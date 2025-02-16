import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertArticleSchema } from "@shared/schema";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/articles", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const articles = await storage.getArticles(req.user.id);
    res.json(articles);
  });

  app.get("/api/articles/tags", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const articles = await storage.getArticles(req.user.id);
    const tags = new Set<string>();
    articles.forEach(article => {
      article.tags?.forEach(tag => tags.add(tag));
    });
    res.json(Array.from(tags).sort());
  });

  app.get("/api/articles/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }

    try {
      const article = await storage.getArticle(articleId);
      if (!article || article.userId !== req.user.id) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const parsed = insertArticleSchema.safeParse({
        url: req.body.url,
        userId: req.user.id,
        tags: req.body.tags || []
      });
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      const response = await fetch(req.body.url);
      if (!response.ok) {
        return res.status(400).json({ message: "Failed to fetch article" });
      }

      const html = await response.text();
      const doc = new JSDOM(html, { url: req.body.url });
      const reader = new Readability(doc.window.document);
      const article = reader.parse();

      if (!article) {
        return res.status(400).json({ message: "Could not parse article content" });
      }

      const saved = await storage.createArticle({
        userId: req.user.id,
        url: req.body.url,
        title: article.title,
        content: article.content,
        description: article.excerpt || "",
        tags: req.body.tags || [],
        archived: false,
        logseqSyncStatus: "not_synced"
      });

      res.status(201).json(saved);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(500).json({ message: "Failed to create article" });
    }
  });

  app.patch("/api/articles/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }

    try {
      const article = await storage.getArticle(articleId);
      if (!article || article.userId !== req.user.id) {
        return res.status(404).json({ message: "Article not found" });
      }

      const updated = await storage.updateArticle(article.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ message: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const articleId = parseInt(req.params.id);
    if (isNaN(articleId)) {
      return res.status(400).json({ message: "Invalid article ID" });
    }

    try {
      const article = await storage.getArticle(articleId);
      if (!article || article.userId !== req.user.id) {
        return res.status(404).json({ message: "Article not found" });
      }

      await storage.deleteArticle(article.id);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ message: "Failed to delete article" });
    }
  });

  app.get("/api/preferences", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const prefs = await storage.getPreferences(req.user.id);
    res.json(prefs);
  });

  app.patch("/api/preferences", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    try {
      const updated = await storage.updatePreferences(req.user.id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}