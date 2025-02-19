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
  read: boolean("read").default(false),
  created: timestamp("created").defaultNow(),
  logseqSyncStatus: text("logseq_sync_status").default("not_synced"),
});

export const highlights = pgTable("highlights", {
  id: serial("id").primaryKey(),
  articleId: serial("article_id").references(() => articles.id),
  userId: serial("user_id").references(() => users.id),
  text: text("text").notNull(),
  startOffset: text("start_offset").notNull(),
  endOffset: text("end_offset").notNull(),
  color: text("color").default("yellow"),
  note: text("note"),
  created: timestamp("created").defaultNow(),
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
export const insertArticleSchema = createInsertSchema(articles)
  .omit({ id: true, created: true })
  .extend({
    url: z.string().url("Please enter a valid URL"),
    title: z.string().optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    notes: z.string().optional(),
    archived: z.boolean().optional().default(false),
    logseqSyncStatus: z.string().optional().default("not_synced"),
  });

export const insertHighlightSchema = createInsertSchema(highlights)
  .omit({ id: true, created: true })
  .extend({
    color: z.enum(["yellow", "green", "blue", "pink", "purple"]).default("yellow"),
    note: z.string().optional(),
  });

export const insertPreferencesSchema = createInsertSchema(preferences).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Highlight = typeof highlights.$inferSelect;
export type InsertHighlight = z.infer<typeof insertHighlightSchema>;
export type Preferences = typeof preferences.$inferSelect;
export type InsertPreferences = z.infer<typeof insertPreferencesSchema>;