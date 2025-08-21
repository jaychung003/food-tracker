import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const foodEntries = pgTable("food_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  dishName: text("dish_name").notNull(),
  ingredients: text("ingredients").array().notNull(),
  triggerIngredients: text("trigger_ingredients").array().default([]),
  portion: text("portion"), // S/M/L or grams
  mealTime: timestamp("meal_time").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedDishes = pgTable("saved_dishes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  dishName: text("dish_name").notNull(),
  ingredients: text("ingredients").array().notNull(),
  triggerIngredients: text("trigger_ingredients").array().default([]),
  aiDetectedIngredients: text("ai_detected_ingredients").array().default([]),
  timesUsed: integer("times_used").default(1).notNull(),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const symptomEntries = pgTable("symptom_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  bristolType: integer("bristol_type").notNull(), // 1-7
  symptoms: text("symptoms").array().default([]),
  severity: integer("severity").notNull(), // 1-10 (kept for backward compatibility)
  urgencySeverity: integer("urgency_severity").default(2), // 0-3 scale
  bloodSeverity: integer("blood_severity").default(0), // 0/1 binary
  painSeverity: integer("pain_severity").default(0), // 0-3 scale
  notes: text("notes"),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category"), // 'gluten', 'dairy', 'fodmap', etc.
  isTrigger: boolean("is_trigger").default(false),
  description: text("description"),
});

// New tables for multi-lag correlation analysis
export const userDayCoverage = pgTable("user_day_coverage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  mealCoverage: integer("meal_coverage").notNull(), // 0-100 percentage
  bmCoverage: integer("bm_coverage").notNull(), // 0-100 percentage
  totalCoverage: integer("total_coverage").notNull(), // 0-100 percentage
  createdAt: timestamp("created_at").defaultNow(),
});

export const mealBmLinks = pgTable("meal_bm_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id").notNull(),
  bmId: varchar("bm_id").notNull(),
  window: integer("window").notNull(), // 6, 24, or 48 hours
  timeDiff: integer("time_diff").notNull(), // minutes between meal and BM
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyWindowSeverity = pgTable("daily_window_severity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  window: integer("window").notNull(), // 6, 24, or 48 hours
  severitySum: integer("severity_sum").notNull(),
  severityMax: integer("severity_max").notNull(),
  bmCount: integer("bm_count").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tagExposuresByWindow = pgTable("tag_exposures_by_window", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: timestamp("date").notNull(),
  tag: text("tag").notNull(),
  window: integer("window").notNull(), // 6, 24, or 48 hours
  exposed: boolean("exposed").notNull(), // 0/1
  severityShare: integer("severity_share").default(0), // for attribution
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFoodEntrySchema = createInsertSchema(foodEntries).omit({
  id: true,
  createdAt: true,
});

export const insertSymptomEntrySchema = createInsertSchema(symptomEntries).omit({
  id: true,
  createdAt: true,
});

export const insertSavedDishSchema = createInsertSchema(savedDishes).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export const insertUserDayCoverageSchema = createInsertSchema(userDayCoverage).omit({
  id: true,
  createdAt: true,
});

export const insertMealBmLinkSchema = createInsertSchema(mealBmLinks).omit({
  id: true,
  createdAt: true,
});

export const insertDailyWindowSeveritySchema = createInsertSchema(dailyWindowSeverity).omit({
  id: true,
  createdAt: true,
});

export const insertTagExposuresByWindowSchema = createInsertSchema(tagExposuresByWindow).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFoodEntry = z.infer<typeof insertFoodEntrySchema>;
export type FoodEntry = typeof foodEntries.$inferSelect;
export type InsertSymptomEntry = z.infer<typeof insertSymptomEntrySchema>;
export type SymptomEntry = typeof symptomEntries.$inferSelect;
export type InsertSavedDish = z.infer<typeof insertSavedDishSchema>;
export type SavedDish = typeof savedDishes.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

// New types for multi-lag correlation
export type InsertUserDayCoverage = z.infer<typeof insertUserDayCoverageSchema>;
export type UserDayCoverage = typeof userDayCoverage.$inferSelect;
export type InsertMealBmLink = z.infer<typeof insertMealBmLinkSchema>;
export type MealBmLink = typeof mealBmLinks.$inferSelect;
export type InsertDailyWindowSeverity = z.infer<typeof insertDailyWindowSeveritySchema>;
export type DailyWindowSeverity = typeof dailyWindowSeverity.$inferSelect;
export type InsertTagExposuresByWindow = z.infer<typeof insertTagExposuresByWindowSchema>;
export type TagExposuresByWindow = typeof tagExposuresByWindow.$inferSelect;

// Utility types for correlation analysis
export interface TagCorrelationResult {
  tag: string;
  primaryWindow: number;
  effect: number;
  upliftRatio: number;
  reliability: 'Low' | 'Medium' | 'High';
  nExposures: number;
  meanExposed: number;
  meanControl: number;
  otherWindows: Array<{
    window: number;
    effect: number;
    reliability: 'Low' | 'Medium' | 'High';
    status: 'higher' | 'lower' | 'similar' | 'unclear';
  }>;
  coOccurringTags?: string[];
}

export interface CorrelationAnalysisSettings {
  windows: number[];
  aggregation: 'sum' | 'max';
  coverageThreshold: number;
  minExposures: number;
}
