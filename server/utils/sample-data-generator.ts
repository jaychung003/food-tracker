import { storage } from "../storage";
import type { InsertFoodEntry, InsertSymptomEntry } from "@shared/schema";

export async function generateSampleData() {
  const userId = "demo-user";
  
  // Sample ingredients and their trigger likelihood
  const ingredients = [
    { name: "wheat bread", triggers: ["gluten"], severity: 3 },
    { name: "milk", triggers: ["dairy"], severity: 2 },
    { name: "cheese", triggers: ["dairy"], severity: 2 },
    { name: "onions", triggers: ["fodmap"], severity: 2 },
    { name: "garlic", triggers: ["fodmap"], severity: 1 },
    { name: "apples", triggers: ["fodmap"], severity: 1 },
    { name: "beans", triggers: ["fodmap"], severity: 3 },
    { name: "rice", triggers: [], severity: 0 },
    { name: "chicken", triggers: [], severity: 0 },
    { name: "carrots", triggers: [], severity: 0 },
    { name: "banana", triggers: [], severity: 0 },
    { name: "eggs", triggers: [], severity: 0 },
    { name: "spinach", triggers: [], severity: 0 },
    { name: "quinoa", triggers: [], severity: 0 },
    { name: "sweet potato", triggers: [], severity: 0 }
  ];

  // Sample meals with their ingredients
  const sampleMeals = [
    { dish: "Oatmeal with milk", ingredients: ["oats", "milk"], triggers: ["dairy"] },
    { dish: "Toast with jam", ingredients: ["wheat bread", "jam"], triggers: ["gluten"] },
    { dish: "Grilled chicken salad", ingredients: ["chicken", "spinach", "carrots"], triggers: [] },
    { dish: "Pasta with cheese", ingredients: ["wheat pasta", "cheese", "garlic"], triggers: ["gluten", "dairy", "fodmap"] },
    { dish: "Bean and rice bowl", ingredients: ["beans", "rice", "onions"], triggers: ["fodmap"] },
    { dish: "Apple slices", ingredients: ["apples"], triggers: ["fodmap"] },
    { dish: "Scrambled eggs", ingredients: ["eggs"], triggers: [] },
    { dish: "Quinoa bowl", ingredients: ["quinoa", "sweet potato", "spinach"], triggers: [] },
    { dish: "Chicken sandwich", ingredients: ["chicken", "wheat bread"], triggers: ["gluten"] },
    { dish: "Banana smoothie", ingredients: ["banana", "milk"], triggers: ["dairy"] }
  ];

  // Generate data for the last 60 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 60);

  const foodEntries: InsertFoodEntry[] = [];
  const symptomEntries: InsertSymptomEntry[] = [];

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Random chance of logging data (70-90% coverage)
    const logChance = Math.random();
    if (logChance < 0.25) continue; // Skip some days for realistic coverage
    
    // Generate 1-4 meals per day
    const mealsPerDay = Math.floor(Math.random() * 4) + 1;
    const dayTriggers: string[] = [];
    
    for (let meal = 0; meal < mealsPerDay; meal++) {
      const mealTime = new Date(date);
      mealTime.setHours(7 + meal * 4 + Math.floor(Math.random() * 3)); // Spread meals throughout day
      
      const selectedMeal = sampleMeals[Math.floor(Math.random() * sampleMeals.length)];
      const portion = ["S", "M", "L"][Math.floor(Math.random() * 3)];
      
      const foodEntry: InsertFoodEntry = {
        userId,
        dishName: selectedMeal.dish,
        ingredients: selectedMeal.ingredients,
        triggerIngredients: selectedMeal.triggers,
        portion,
        mealTime,
        notes: Math.random() > 0.8 ? "Tasted good" : undefined
      };
      
      foodEntries.push(foodEntry);
      dayTriggers.push(...selectedMeal.triggers);
    }
    
    // Generate 0-3 symptom entries per day
    const symptomsPerDay = Math.floor(Math.random() * 4);
    
    for (let symptom = 0; symptom < symptomsPerDay; symptom++) {
      const symptomTime = new Date(date);
      symptomTime.setHours(9 + Math.floor(Math.random() * 12)); // Symptoms throughout day
      
      // Higher severity if triggers were consumed
      const baseSeverity = dayTriggers.length > 0 ? 2 : 1;
      const triggerMultiplier = Math.min(dayTriggers.length * 0.5, 2);
      
      const bristolType = Math.floor(Math.random() * 7) + 1;
      const urgencySeverity = Math.floor(Math.random() * 4); // 0-3
      const bloodSeverity = Math.random() > 0.8 ? 1 : 0; // Binary
      const painSeverity = Math.floor(Math.random() * 4); // 0-3
      
      // Calculate total severity using PRD formula
      const bristolDeviation = Math.abs(bristolType - 4);
      const totalSeverity = (bristolDeviation * 1) + (urgencySeverity * 2) + (bloodSeverity * 3) + (painSeverity * 2);
      
      const symptomEntry: InsertSymptomEntry = {
        userId,
        bristolType,
        symptoms: [],
        severity: Math.floor(baseSeverity * (1 + triggerMultiplier)), // Legacy field
        urgencySeverity,
        bloodSeverity,
        painSeverity,
        notes: Math.random() > 0.7 ? "Felt uncomfortable" : undefined,
        occurredAt: symptomTime
      };
      
      symptomEntries.push(symptomEntry);
    }
  }
  
  // Insert all the sample data
  console.log(`Generating ${foodEntries.length} food entries and ${symptomEntries.length} symptom entries...`);
  
  for (const entry of foodEntries) {
    await storage.createFoodEntry(entry);
  }
  
  for (const entry of symptomEntries) {
    await storage.createSymptomEntry(entry);
  }
  
  console.log("Sample data generation completed!");
  return {
    foodEntriesCount: foodEntries.length,
    symptomEntriesCount: symptomEntries.length,
    daysOfData: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  };
}