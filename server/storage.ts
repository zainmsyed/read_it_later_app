import { users, articles, preferences, type User, type InsertUser, type Article, type InsertArticle, type Preferences, type InsertPreferences } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getArticles(userId: number): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<Article>): Promise<Article>;
  deleteArticle(id: number): Promise<void>;
  
  getPreferences(userId: number): Promise<Preferences>;
  updatePreferences(userId: number, prefs: Partial<InsertPreferences>): Promise<Preferences>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private articles: Map<number, Article>;
  private preferences: Map<number, Preferences>;
  private currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.articles = new Map();
    this.preferences = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getArticles(userId: number): Promise<Article[]> {
    return Array.from(this.articles.values()).filter(
      (article) => article.userId === userId,
    );
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.currentId++;
    const article = {
      ...insertArticle,
      id,
      created: new Date(),
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticle(id: number, article: Partial<Article>): Promise<Article> {
    const existing = await this.getArticle(id);
    if (!existing) throw new Error("Article not found");
    
    const updated = { ...existing, ...article };
    this.articles.set(id, updated);
    return updated;
  }

  async deleteArticle(id: number): Promise<void> {
    this.articles.delete(id);
  }

  async getPreferences(userId: number): Promise<Preferences> {
    const prefs = this.preferences.get(userId);
    if (prefs) return prefs;

    const defaultPrefs: Preferences = {
      id: this.currentId++,
      userId,
      fontSize: "medium",
      lineHeight: "normal",
      margins: "normal",
      theme: "light",
    };
    this.preferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  async updatePreferences(userId: number, prefs: Partial<InsertPreferences>): Promise<Preferences> {
    const existing = await this.getPreferences(userId);
    const updated = { ...existing, ...prefs };
    this.preferences.set(userId, updated);
    return updated;
  }
}

export const storage = new MemStorage();
