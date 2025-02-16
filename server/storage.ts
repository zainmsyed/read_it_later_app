import { users, articles, preferences, type User, type InsertUser, type Article, type InsertArticle, type Preferences, type InsertPreferences } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

const PostgresStore = connectPg(session);

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

  sessionStore: session.Store;
  searchArticles(userId: number, query?: string, tags?: string[]): Promise<Article[]>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }

    this.sessionStore = new PostgresStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  async searchArticles(userId: number, query?: string, tags?: string[]): Promise<Article[]> {
    try {
      console.log('Starting search with:', { userId, query, tags });

      // Base condition: user's articles only
      const conditions = [eq(articles.userId, userId)];

      // Add search condition if query exists
      if (query?.trim()) {
        const searchTerm = `%${query.trim().toLowerCase()}%`;
        conditions.push(
          or(
            ilike(articles.title, searchTerm),
            ilike(articles.content, searchTerm),
            ilike(articles.description || '', searchTerm)
          )
        );
        console.log('Added search condition for term:', searchTerm);
      }

      // Add tag conditions if tags exist
      if (tags && tags.length > 0) {
        // Each tag must be in the article's tags array
        tags.forEach(tag => {
          conditions.push(sql`${articles.tags} && ARRAY[${tag}]::text[]`);
        });
        console.log('Added tag conditions for tags:', tags);
      }

      const results = await db
        .select()
        .from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.created));

      console.log('Search completed. Found results:', results.length);
      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw error;  // Let the route handler deal with the error
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getArticles(userId: number): Promise<Article[]> {
    return db.select().from(articles).where(eq(articles.userId, userId));
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values(insertArticle).returning();
    return article;
  }

  async updateArticle(id: number, article: Partial<Article>): Promise<Article> {
    const [updated] = await db
      .update(articles)
      .set(article)
      .where(eq(articles.id, id))
      .returning();
    if (!updated) throw new Error("Article not found");
    return updated;
  }

  async deleteArticle(id: number): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  async getPreferences(userId: number): Promise<Preferences> {
    let [prefs] = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, userId));

    if (!prefs) {
      [prefs] = await db
        .insert(preferences)
        .values({
          userId,
          fontSize: "medium",
          lineHeight: "normal",
          margins: "normal",
          theme: "light",
        })
        .returning();
    }

    return prefs;
  }

  async updatePreferences(userId: number, prefs: Partial<InsertPreferences>): Promise<Preferences> {
    const [updated] = await db
      .update(preferences)
      .set(prefs)
      .where(eq(preferences.userId, userId))
      .returning();
    if (!updated) throw new Error("Preferences not found");
    return updated;
  }
}

export const storage = new DatabaseStorage();