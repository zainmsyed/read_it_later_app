import { users, articles, preferences, type User, type InsertUser, type Article, type InsertArticle, type Preferences, type InsertPreferences } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, SQL, sql, desc } from "drizzle-orm";

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
      let conditions: SQL[] = [eq(articles.userId, userId)];

      // Text search using PostgreSQL's full-text search with trigram similarity
      if (query?.trim()) {
        const searchQuery = query.trim().toLowerCase();
        conditions.push(
          or(
            sql`similarity(${articles.title}, ${searchQuery}) > 0.3`,
            sql`similarity(${articles.content}, ${searchQuery}) > 0.3`,
            sql`similarity(COALESCE(${articles.description}, ''), ${searchQuery}) > 0.3`
          )
        );
      }

      // Tag filtering - articles must have ALL specified tags
      if (tags?.length) {
        conditions.push(sql`${articles.tags} ?& array[${sql.join(tags)}]`);
      }

      const results = await db
        .select()
        .from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.created));

      return results;
    } catch (error) {
      console.error('Search error:', error);
      return [];
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