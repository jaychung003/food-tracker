import { type User, type InsertUser, type FoodEntry, type InsertFoodEntry, type SymptomEntry, type InsertSymptomEntry, type Ingredient, type InsertIngredient, type SavedDish, type InsertSavedDish, type UserDayCoverage, type InsertUserDayCoverage, type MealBmLink, type InsertMealBmLink, type DailyWindowSeverity, type InsertDailyWindowSeverity, type TagExposuresByWindow, type InsertTagExposuresByWindow, type TagCorrelationResult, type CorrelationAnalysisSettings } from "@shared/schema";
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
  
  // Saved dishes methods
  getSavedDishes(userId: string): Promise<SavedDish[]>;
  getSavedDishByName(userId: string, dishName: string): Promise<SavedDish | undefined>;
  createSavedDish(dish: InsertSavedDish): Promise<SavedDish>;
  updateSavedDishUsage(id: string, userId: string): Promise<boolean>;
  deleteSavedDish(id: string, userId: string): Promise<boolean>;
  
  // Multi-lag correlation methods
  getUserDayCoverage(userId: string, startDate: Date, endDate: Date): Promise<UserDayCoverage[]>;
  createUserDayCoverage(coverage: InsertUserDayCoverage): Promise<UserDayCoverage>;
  getMealBmLinks(userId: string, window: number): Promise<MealBmLink[]>;
  createMealBmLink(link: InsertMealBmLink): Promise<MealBmLink>;
  getDailyWindowSeverity(userId: string, window: number): Promise<DailyWindowSeverity[]>;
  createDailyWindowSeverity(severity: InsertDailyWindowSeverity): Promise<DailyWindowSeverity>;
  getTagExposuresByWindow(userId: string, window: number): Promise<TagExposuresByWindow[]>;
  createTagExposuresByWindow(exposure: InsertTagExposuresByWindow): Promise<TagExposuresByWindow>;
  
  // Analysis methods
  calculateCorrelationAnalysis(userId: string, settings: CorrelationAnalysisSettings): Promise<TagCorrelationResult[]>;
  computeCoverageForDate(userId: string, date: Date): Promise<UserDayCoverage | null>;
  generateDerivedTables(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private foodEntries: Map<string, FoodEntry>;
  private symptomEntries: Map<string, SymptomEntry>;
  private ingredients: Map<string, Ingredient>;
  private savedDishes: Map<string, SavedDish>;
  private userDayCoverage: Map<string, UserDayCoverage>;
  private mealBmLinks: Map<string, MealBmLink>;
  private dailyWindowSeverity: Map<string, DailyWindowSeverity>;
  private tagExposuresByWindow: Map<string, TagExposuresByWindow>;

  constructor() {
    this.users = new Map();
    this.foodEntries = new Map();
    this.symptomEntries = new Map();
    this.ingredients = new Map();
    this.savedDishes = new Map();
    this.userDayCoverage = new Map();
    this.mealBmLinks = new Map();
    this.dailyWindowSeverity = new Map();
    this.tagExposuresByWindow = new Map();
    
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
      createdAt: new Date(),
      triggerIngredients: insertEntry.triggerIngredients || null,
      portion: insertEntry.portion ?? null,
      notes: insertEntry.notes ?? null
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
      createdAt: new Date(),
      symptoms: insertEntry.symptoms || null,
      notes: insertEntry.notes || null,
      urgencySeverity: insertEntry.urgencySeverity ?? null,
      bloodSeverity: insertEntry.bloodSeverity ?? null,
      painSeverity: insertEntry.painSeverity ?? null
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
    const ingredient: Ingredient = { 
      ...insertIngredient, 
      id,
      description: insertIngredient.description || null,
      category: insertIngredient.category || null,
      isTrigger: insertIngredient.isTrigger || null
    };
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

  // Saved dishes methods
  async getSavedDishes(userId: string): Promise<SavedDish[]> {
    return Array.from(this.savedDishes.values())
      .filter(dish => dish.userId === userId)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime());
  }

  async getSavedDishByName(userId: string, dishName: string): Promise<SavedDish | undefined> {
    return Array.from(this.savedDishes.values())
      .find(dish => dish.userId === userId && dish.dishName.toLowerCase() === dishName.toLowerCase());
  }

  async createSavedDish(insertSavedDish: InsertSavedDish): Promise<SavedDish> {
    const id = randomUUID();
    const now = new Date();
    const savedDish: SavedDish = { 
      ...insertSavedDish, 
      id,
      triggerIngredients: insertSavedDish.triggerIngredients || [],
      aiDetectedIngredients: insertSavedDish.aiDetectedIngredients || [],
      timesUsed: insertSavedDish.timesUsed || 1,
      lastUsedAt: now,
      createdAt: now
    };
    this.savedDishes.set(id, savedDish);
    return savedDish;
  }

  async updateSavedDishUsage(id: string, userId: string): Promise<boolean> {
    const savedDish = this.savedDishes.get(id);
    if (savedDish && savedDish.userId === userId) {
      savedDish.timesUsed += 1;
      savedDish.lastUsedAt = new Date();
      return true;
    }
    return false;
  }

  async deleteSavedDish(id: string, userId: string): Promise<boolean> {
    const savedDish = this.savedDishes.get(id);
    if (savedDish && savedDish.userId === userId) {
      this.savedDishes.delete(id);
      return true;
    }
    return false;
  }

  // Multi-lag correlation methods
  async getUserDayCoverage(userId: string, startDate: Date, endDate: Date): Promise<UserDayCoverage[]> {
    return Array.from(this.userDayCoverage.values())
      .filter(coverage => 
        coverage.userId === userId && 
        coverage.date >= startDate && 
        coverage.date <= endDate
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createUserDayCoverage(insertCoverage: InsertUserDayCoverage): Promise<UserDayCoverage> {
    const id = randomUUID();
    const coverage: UserDayCoverage = {
      ...insertCoverage,
      id,
      createdAt: new Date()
    };
    this.userDayCoverage.set(id, coverage);
    return coverage;
  }

  async getMealBmLinks(userId: string, window: number): Promise<MealBmLink[]> {
    return Array.from(this.mealBmLinks.values())
      .filter(link => {
        // Get meal entry to check userId
        const meal = this.foodEntries.get(link.mealId);
        return meal?.userId === userId && link.window === window;
      });
  }

  async createMealBmLink(insertLink: InsertMealBmLink): Promise<MealBmLink> {
    const id = randomUUID();
    const link: MealBmLink = {
      ...insertLink,
      id,
      createdAt: new Date()
    };
    this.mealBmLinks.set(id, link);
    return link;
  }

  async getDailyWindowSeverity(userId: string, window: number): Promise<DailyWindowSeverity[]> {
    return Array.from(this.dailyWindowSeverity.values())
      .filter(severity => severity.userId === userId && severity.window === window)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createDailyWindowSeverity(insertSeverity: InsertDailyWindowSeverity): Promise<DailyWindowSeverity> {
    const id = randomUUID();
    const severity: DailyWindowSeverity = {
      ...insertSeverity,
      id,
      createdAt: new Date()
    };
    this.dailyWindowSeverity.set(id, severity);
    return severity;
  }

  async getTagExposuresByWindow(userId: string, window: number): Promise<TagExposuresByWindow[]> {
    return Array.from(this.tagExposuresByWindow.values())
      .filter(exposure => exposure.userId === userId && exposure.window === window)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createTagExposuresByWindow(insertExposure: InsertTagExposuresByWindow): Promise<TagExposuresByWindow> {
    const id = randomUUID();
    const exposure: TagExposuresByWindow = {
      ...insertExposure,
      id,
      createdAt: new Date(),
      severityShare: insertExposure.severityShare ?? null
    };
    this.tagExposuresByWindow.set(id, exposure);
    return exposure;
  }

  // Calculate BM severity based on PRD formula
  private calculateBmSeverity(symptom: SymptomEntry): number {
    const bristolDeviation = Math.abs(symptom.bristolType - 4);
    const urgency = symptom.urgencySeverity || 0;
    const blood = symptom.bloodSeverity || 0;
    const pain = symptom.painSeverity || 0;
    
    return (bristolDeviation * 1) + (urgency * 2) + (blood * 3) + (pain * 2);
  }

  async computeCoverageForDate(userId: string, date: Date): Promise<UserDayCoverage | null> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayMeals = await this.getFoodEntriesByDateRange(userId, dayStart, dayEnd);
    const daySymptoms = await this.getSymptomEntriesByDateRange(userId, dayStart, dayEnd);

    // Simple coverage calculation - in production this would be more sophisticated
    const mealCoverage = Math.min(100, (dayMeals.length / 3) * 100); // Assume 3 meals per day
    const bmCoverage = Math.min(100, (daySymptoms.length / 1) * 100); // Assume 1+ BM per day
    const totalCoverage = (mealCoverage + bmCoverage) / 2;

    if (totalCoverage < 70) return null; // Below threshold

    return await this.createUserDayCoverage({
      userId,
      date,
      mealCoverage: Math.round(mealCoverage),
      bmCoverage: Math.round(bmCoverage),
      totalCoverage: Math.round(totalCoverage)
    });
  }

  async generateDerivedTables(userId: string): Promise<void> {
    const windows = [6, 24, 48];
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 90); // 90 days of data

    // Clear existing derived data for user
    const existingCoverage = Array.from(this.userDayCoverage.values()).filter(c => c.userId === userId);
    existingCoverage.forEach(c => this.userDayCoverage.delete(c.id));

    // Get all user meals and symptoms in range
    const meals = await this.getFoodEntriesByDateRange(userId, startDate, now);
    const symptoms = await this.getSymptomEntriesByDateRange(userId, startDate, now);

    // Generate coverage data for each day
    const dayMap = new Map<string, Date>();
    for (let date = new Date(startDate); date <= now; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      dayMap.set(dateKey, new Date(date));
    }

    for (const [dateKey, date] of Array.from(dayMap.entries())) {
      await this.computeCoverageForDate(userId, date);
    }

    // Generate meal-BM links for each window
    for (const window of windows) {
      for (const meal of meals) {
        const windowEndTime = new Date(meal.mealTime.getTime() + (window * 60 * 60 * 1000));
        const relevantSymptoms = symptoms.filter(s => 
          s.occurredAt >= meal.mealTime && s.occurredAt <= windowEndTime
        );

        for (const symptom of relevantSymptoms) {
          const timeDiff = Math.round((symptom.occurredAt.getTime() - meal.mealTime.getTime()) / (1000 * 60));
          await this.createMealBmLink({
            mealId: meal.id,
            bmId: symptom.id,
            window,
            timeDiff
          });
        }
      }
    }

    // Generate daily window severity and tag exposures
    for (const window of windows) {
      const coverage = await this.getUserDayCoverage(userId, startDate, now);
      const validDays = coverage.filter(c => c.totalCoverage >= 70);

      for (const day of validDays) {
        const dayStart = new Date(day.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day.date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayMeals = meals.filter(m => 
          m.mealTime >= dayStart && m.mealTime <= dayEnd
        );
        const daySymptoms = symptoms.filter(s => 
          s.occurredAt >= dayStart && s.occurredAt <= dayEnd
        );

        // Calculate severity for this day/window
        let severitySum = 0;
        let severityMax = 0;
        let bmCount = 0;

        for (const meal of dayMeals) {
          const windowEndTime = new Date(meal.mealTime.getTime() + (window * 60 * 60 * 1000));
          const windowSymptoms = daySymptoms.filter(s => 
            s.occurredAt >= meal.mealTime && s.occurredAt <= windowEndTime
          );

          for (const symptom of windowSymptoms) {
            const severity = this.calculateBmSeverity(symptom);
            severitySum += severity;
            severityMax = Math.max(severityMax, severity);
            bmCount++;
          }
        }

        if (bmCount > 0) {
          await this.createDailyWindowSeverity({
            userId,
            date: day.date,
            window,
            severitySum,
            severityMax,
            bmCount
          });
        }

        // Generate tag exposures
        const allTags = new Set<string>();
        dayMeals.forEach(meal => {
          meal.triggerIngredients?.forEach(tag => allTags.add(tag));
          meal.ingredients.forEach(ing => allTags.add(ing));
        });

        for (const tag of Array.from(allTags)) {
          const hasTagMeals = dayMeals.some(meal => 
            meal.triggerIngredients?.includes(tag) || meal.ingredients.includes(tag)
          );

          if (hasTagMeals) {
            // Calculate severity attribution for this tag
            const tagMeals = dayMeals.filter(meal => 
              meal.triggerIngredients?.includes(tag) || meal.ingredients.includes(tag)
            );
            const distinctTagsThisDay = Array.from(allTags);
            const severityShare = Math.round(severitySum / distinctTagsThisDay.length);

            await this.createTagExposuresByWindow({
              userId,
              date: day.date,
              tag,
              window,
              exposed: true,
              severityShare
            });
          }
        }
      }
    }
  }

  async calculateCorrelationAnalysis(userId: string, settings: CorrelationAnalysisSettings): Promise<TagCorrelationResult[]> {
    // Get all tag exposures for analysis
    const results: TagCorrelationResult[] = [];
    const allTags = new Set<string>();

    // Collect all tags from exposures across all windows
    for (const window of settings.windows) {
      const exposures = await this.getTagExposuresByWindow(userId, window);
      exposures.forEach(exp => allTags.add(exp.tag));
    }

    for (const tag of Array.from(allTags)) {
      const windowResults = new Map<number, {
        effect: number;
        reliability: 'Low' | 'Medium' | 'High';
        nExposures: number;
        meanExposed: number;
        meanControl: number;
      }>();

      for (const window of settings.windows) {
        const exposures = await this.getTagExposuresByWindow(userId, window);
        const tagExposures = exposures.filter(exp => exp.tag === tag);
        const exposedDays = tagExposures.filter(exp => exp.exposed);
        const controlDays = exposures.filter(exp => exp.tag !== tag && !exp.exposed);

        if (exposedDays.length < settings.minExposures) continue;

        const meanExposed = exposedDays.reduce((sum, exp) => sum + (exp.severityShare || 0), 0) / exposedDays.length;
        const meanControl = controlDays.length > 0 ? 
          controlDays.reduce((sum, exp) => sum + (exp.severityShare || 0), 0) / controlDays.length : 0;
        
        const effect = meanExposed - meanControl;
        
        // Calculate reliability based on PRD criteria
        let reliability: 'Low' | 'Medium' | 'High' = 'Low';
        if (exposedDays.length >= 10) reliability = 'High';
        else if (exposedDays.length >= 5) reliability = 'Medium';

        windowResults.set(window, {
          effect,
          reliability,
          nExposures: exposedDays.length,
          meanExposed,
          meanControl
        });
      }

      if (windowResults.size === 0) continue;

      // Find primary window (highest reliability-weighted effect)
      let primaryWindow = settings.windows[0];
      let bestScore = -Infinity;

      for (const [window, data] of Array.from(windowResults.entries())) {
        const reliabilityWeight = data.reliability === 'High' ? 1 : data.reliability === 'Medium' ? 0.7 : 0.4;
        const score = Math.abs(data.effect) * reliabilityWeight;
        if (score > bestScore) {
          bestScore = score;
          primaryWindow = window;
        }
      }

      const primaryData = windowResults.get(primaryWindow)!;
      const upliftRatio = primaryData.meanControl > 0 ? primaryData.meanExposed / primaryData.meanControl : 1;

      // Build other windows data
      const otherWindows = Array.from(windowResults.entries())
        .filter(([window]) => window !== primaryWindow)
        .map(([window, data]) => {
          const status: 'higher' | 'lower' | 'similar' | 'unclear' = 
            Math.abs(data.effect) > Math.abs(primaryData.effect) * 1.2 ? 'higher' :
            Math.abs(data.effect) < Math.abs(primaryData.effect) * 0.8 ? 'lower' :
            Math.abs(data.effect) > Math.abs(primaryData.effect) * 0.8 ? 'similar' : 'unclear';
          
          return {
            window,
            effect: data.effect,
            reliability: data.reliability,
            status
          };
        });

      results.push({
        tag,
        primaryWindow,
        effect: primaryData.effect,
        upliftRatio,
        reliability: primaryData.reliability,
        nExposures: primaryData.nExposures,
        meanExposed: primaryData.meanExposed,
        meanControl: primaryData.meanControl,
        otherWindows,
        coOccurringTags: [] // TODO: implement co-occurrence detection
      });
    }

    // Sort by reliability-weighted effect size
    return results.sort((a, b) => {
      const aWeight = a.reliability === 'High' ? 1 : a.reliability === 'Medium' ? 0.7 : 0.4;
      const bWeight = b.reliability === 'High' ? 1 : b.reliability === 'Medium' ? 0.7 : 0.4;
      return (Math.abs(b.effect) * bWeight) - (Math.abs(a.effect) * aWeight);
    });
  }
}

export const storage = new MemStorage();
