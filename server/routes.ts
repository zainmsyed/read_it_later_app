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
    const article = await storage.getArticle(Number(req.params.id));
    if (!article || article.userId !== req.user.id) return res.sendStatus(404);
    res.json(article);
  });

  app.post("/api/articles", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      // First validate the URL and tags
      const parsed = insertArticleSchema.safeParse({ 
        url: req.body.url,
        userId: req.user.id,
        tags: req.body.tags || [] 
      });
      if (!parsed.success) {
        return res.status(400).json(parsed.error);
      }

      // Fetch and parse article content
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

      // Create the article with parsed content and tags
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

    const article = await storage.getArticle(Number(req.params.id));
    if (!article || article.userId !== req.user.id) return res.sendStatus(404);

    const updated = await storage.updateArticle(article.id, req.body);
    res.json(updated);
  });

  app.delete("/api/articles/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const article = await storage.getArticle(Number(req.params.id));
    if (!article || article.userId !== req.user.id) return res.sendStatus(404);

    await storage.deleteArticle(article.id);
    res.sendStatus(204);
  });

  app.get("/api/preferences", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const prefs = await storage.getPreferences(req.user.id);
    res.json(prefs);
  });

  app.patch("/api/preferences", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const updated = await storage.updatePreferences(req.user.id, req.body);
    res.json(updated);
  });

  const httpServer = createServer(app);
  return httpServer;
}