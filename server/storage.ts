import { type User, type InsertUser, type FoodEntry, type InsertFoodEntry, type SymptomEntry, type InsertSymptomEntry, type Ingredient, type InsertIngredient } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Food entry methods
  getFoodEntries(userId: string): Promise<FoodEntry[]>;
  getFoodEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<FoodEntry[]>;
  createFoodEntry(entry: InsertFoodEntry): Promise<FoodEntry>;
  deleteFoodEntry(id: string, userId: string): Promise<boolean>;
  
  // Symptom entry methods
  getSymptomEntries(userId: string): Promise<SymptomEntry[]>;
  getSymptomEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<SymptomEntry[]>;
  createSymptomEntry(entry: InsertSymptomEntry): Promise<SymptomEntry>;
  deleteSymptomEntry(id: string, userId: string): Promise<boolean>;
  
  // Ingredient methods
  getIngredients(): Promise<Ingredient[]>;
  getIngredientsByCategory(category: string): Promise<Ingredient[]>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  searchIngredients(query: string): Promise<Ingredient[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private foodEntries: Map<string, FoodEntry>;
  private symptomEntries: Map<string, SymptomEntry>;
  private ingredients: Map<string, Ingredient>;

  constructor() {
    this.users = new Map();
    this.foodEntries = new Map();
    this.symptomEntries = new Map();
    this.ingredients = new Map();
    
    // Initialize with common trigger ingredients
    this.initializeIngredients();
  }

  private initializeIngredients() {
    const commonIngredients = [
      { name: "wheat", category: "gluten", isTrigger: true, description: "Contains gluten" },
      { name: "barley", category: "gluten", isTrigger: true, description: "Contains gluten" },
      { name: "rye", category: "gluten", isTrigger: true, description: "Contains gluten" },
      { name: "milk", category: "dairy", isTrigger: true, description: "Contains lactose" },
      { name: "cheese", category: "dairy", isTrigger: true, description: "Contains lactose" },
      { name: "yogurt", category: "dairy", isTrigger: false, description: "Lower lactose content" },
      { name: "onions", category: "fodmap", isTrigger: true, description: "High FODMAP" },
      { name: "garlic", category: "fodmap", isTrigger: true, description: "High FODMAP" },
      { name: "apples", category: "fodmap", isTrigger: true, description: "High FODMAP" },
      { name: "beans", category: "fodmap", isTrigger: true, description: "High FODMAP" },
      { name: "rice", category: "safe", isTrigger: false, description: "Generally well tolerated" },
      { name: "chicken", category: "protein", isTrigger: false, description: "Lean protein" },
      { name: "carrots", category: "vegetable", isTrigger: false, description: "Low FODMAP" },
    ];

    commonIngredients.forEach(ingredient => {
      const id = randomUUID();
      this.ingredients.set(id, { ...ingredient, id });
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Food entry methods
  async getFoodEntries(userId: string): Promise<FoodEntry[]> {
    return Array.from(this.foodEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.mealTime.getTime() - a.mealTime.getTime());
  }

  async getFoodEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<FoodEntry[]> {
    return Array.from(this.foodEntries.values())
      .filter(entry => 
        entry.userId === userId && 
        entry.mealTime >= startDate && 
        entry.mealTime <= endDate
      )
      .sort((a, b) => b.mealTime.getTime() - a.mealTime.getTime());
  }

  async createFoodEntry(insertEntry: InsertFoodEntry): Promise<FoodEntry> {
    const id = randomUUID();
    const entry: FoodEntry = {
      ...insertEntry,
      id,
      createdAt: new Date()
    };
    this.foodEntries.set(id, entry);
    return entry;
  }

  async deleteFoodEntry(id: string, userId: string): Promise<boolean> {
    const entry = this.foodEntries.get(id);
    if (entry && entry.userId === userId) {
      return this.foodEntries.delete(id);
    }
    return false;
  }

  // Symptom entry methods
  async getSymptomEntries(userId: string): Promise<SymptomEntry[]> {
    return Array.from(this.symptomEntries.values())
      .filter(entry => entry.userId === userId)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async getSymptomEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<SymptomEntry[]> {
    return Array.from(this.symptomEntries.values())
      .filter(entry => 
        entry.userId === userId && 
        entry.occurredAt >= startDate && 
        entry.occurredAt <= endDate
      )
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  async createSymptomEntry(insertEntry: InsertSymptomEntry): Promise<SymptomEntry> {
    const id = randomUUID();
    const entry: SymptomEntry = {
      ...insertEntry,
      id,
      createdAt: new Date()
    };
    this.symptomEntries.set(id, entry);
    return entry;
  }

  async deleteSymptomEntry(id: string, userId: string): Promise<boolean> {
    const entry = this.symptomEntries.get(id);
    if (entry && entry.userId === userId) {
      return this.symptomEntries.delete(id);
    }
    return false;
  }

  // Ingredient methods
  async getIngredients(): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values());
  }

  async getIngredientsByCategory(category: string): Promise<Ingredient[]> {
    return Array.from(this.ingredients.values())
      .filter(ingredient => ingredient.category === category);
  }

  async createIngredient(insertIngredient: InsertIngredient): Promise<Ingredient> {
    const id = randomUUID();
    const ingredient: Ingredient = { ...insertIngredient, id };
    this.ingredients.set(id, ingredient);
    return ingredient;
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.ingredients.values())
      .filter(ingredient => 
        ingredient.name.toLowerCase().includes(lowerQuery) ||
        ingredient.description?.toLowerCase().includes(lowerQuery)
      );
  }
}

export const storage = new MemStorage();
