import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  url: text("url").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  tags: text("tags").array(),
  notes: text("notes"),
  archived: boolean("archived").default(false),
  created: timestamp("created").defaultNow(),
  logseqSyncStatus: text("logseq_sync_status").default("not_synced"),
});

export const preferences = pgTable("preferences", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  fontSize: text("font_size").default("medium"),
  lineHeight: text("line_height").default("normal"),
  margins: text("margins").default("normal"),
  theme: text("theme").default("light"),
});

export const insertUserSchema = createInsertSchema(users);
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, created: true });
export const insertPreferencesSchema = createInsertSchema(preferences).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Preferences = typeof preferences.$inferSelect;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;
