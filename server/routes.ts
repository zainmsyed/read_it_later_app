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

  app.get("/api/articles/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const article = await storage.getArticle(Number(req.params.id));
    if (!article || article.userId !== req.user.id) return res.sendStatus(404);
    res.json(article);
  });

  app.post("/api/articles", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    
    const parsed = insertArticleSchema.safeParse({ ...req.body, userId: req.user.id });
    if (!parsed.success) return res.status(400).json(parsed.error);

    // Fetch and parse article content
    const response = await fetch(req.body.url);
    const html = await response.text();
    const doc = new JSDOM(html);
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) return res.status(400).send("Could not parse article");

    const saved = await storage.createArticle({
      ...parsed.data,
      title: article.title || parsed.data.title,
      content: article.content,
      description: article.excerpt || "",
    });

    res.status(201).json(saved);
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
