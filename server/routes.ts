import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFoodEntrySchema, insertSymptomEntrySchema, insertSavedDishSchema } from "@shared/schema";
import { z } from "zod";
import { analyzeIngredients, analyzeTriggers } from "./openai";

// Food database simulation (in production would use Edamam/Spoonacular API)
const foodDatabase: Record<string, string[]> = {
  "oatmeal": ["oats", "water"],
  "caesar salad": ["romaine lettuce", "parmesan cheese", "croutons", "caesar dressing", "chicken"],
  "chicken rice bowl": ["chicken breast", "brown rice", "broccoli", "soy sauce"],
  "pizza": ["wheat flour", "mozzarella cheese", "tomato sauce"],
  "pasta": ["wheat flour", "olive oil"],
  "sandwich": ["wheat bread", "turkey", "lettuce", "tomato"],
  "yogurt": ["yogurt", "berries"],
  "smoothie": ["banana", "berries", "milk", "yogurt"],
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Food entries routes
  app.get("/api/food-entries", async (req, res) => {
    try {
      const userId = "demo-user"; // In production, get from session/auth
      const entries = await storage.getFoodEntries(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food entries" });
    }
  });

  app.get("/api/food-entries/range", async (req, res) => {
    try {
      const userId = "demo-user";
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const entries = await storage.getFoodEntriesByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food entries" });
    }
  });

  app.post("/api/food-entries", async (req, res) => {
    try {
      const userId = "demo-user";
      const validatedData = insertFoodEntrySchema.parse({
        ...req.body,
        userId,
        mealTime: new Date(req.body.mealTime)
      });

      const entry = await storage.createFoodEntry(validatedData);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid food entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create food entry" });
    }
  });

  app.delete("/api/food-entries/:id", async (req, res) => {
    try {
      const userId = "demo-user";
      const success = await storage.deleteFoodEntry(req.params.id, userId);
      if (success) {
        res.json({ message: "Food entry deleted successfully" });
      } else {
        res.status(404).json({ message: "Food entry not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete food entry" });
    }
  });

  // Symptom entries routes
  app.get("/api/symptom-entries", async (req, res) => {
    try {
      const userId = "demo-user";
      const entries = await storage.getSymptomEntries(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch symptom entries" });
    }
  });

  app.get("/api/symptom-entries/range", async (req, res) => {
    try {
      const userId = "demo-user";
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const entries = await storage.getSymptomEntriesByDateRange(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch symptom entries" });
    }
  });

  app.post("/api/symptom-entries", async (req, res) => {
    try {
      const userId = "demo-user";
      const validatedData = insertSymptomEntrySchema.parse({
        ...req.body,
        userId,
        occurredAt: new Date(req.body.occurredAt)
      });

      const entry = await storage.createSymptomEntry(validatedData);
      res.json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid symptom entry data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create symptom entry" });
    }
  });

  app.delete("/api/symptom-entries/:id", async (req, res) => {
    try {
      const userId = "demo-user";
      const success = await storage.deleteSymptomEntry(req.params.id, userId);
      if (success) {
        res.json({ message: "Symptom entry deleted successfully" });
      } else {
        res.status(404).json({ message: "Symptom entry not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete symptom entry" });
    }
  });

  // OpenAI-powered ingredient analysis
  app.post("/api/food/analyze", async (req, res) => {
    try {
      const { dishName, existingIngredients } = req.body;
      if (!dishName || typeof dishName !== 'string') {
        return res.status(400).json({ message: "Dish name is required" });
      }

      const analysis = await analyzeIngredients(dishName.trim(), existingIngredients);
      res.json(analysis);
    } catch (error) {
      console.error("Ingredient analysis error:", error);
      res.status(500).json({ message: "Failed to analyze ingredients" });
    }
  });

  app.post("/api/food/analyze-triggers", async (req, res) => {
    try {
      const { ingredients } = req.body;
      if (!Array.isArray(ingredients)) {
        return res.status(400).json({ message: "Ingredients array is required" });
      }

      const triggers = await analyzeTriggers(ingredients);
      res.json({ triggerIngredients: triggers });
    } catch (error) {
      console.error("Trigger analysis error:", error);
      res.status(500).json({ message: "Failed to analyze triggers" });
    }
  });

  // Food search and ingredients routes (legacy - kept for fallback)
  app.get("/api/food/search/:query?", async (req, res) => {
    try {
      const query = req.params.query || req.query.q;
      if (!query || typeof query !== 'string') {
        return res.json([]); // Return empty array for invalid queries
      }

      const queryLower = query.toLowerCase();
      const matches = Object.keys(foodDatabase)
        .filter(dish => dish.includes(queryLower))
        .slice(0, 10);

      res.json(matches);
    } catch (error) {
      res.json([]);
    }
  });

  app.get("/api/food/ingredients/:dishName", async (req, res) => {
    try {
      const dishName = req.params.dishName.toLowerCase();
      const ingredients = foodDatabase[dishName] || [];
      
      if (ingredients.length === 0) {
        return res.status(404).json({ message: "Dish not found" });
      }

      // Check for trigger ingredients
      const allIngredients = await storage.getIngredients();
      const triggerIngredients = [];
      
      for (const ingredient of ingredients) {
        const found = allIngredients.find(ing => 
          ing.name.toLowerCase() === ingredient.toLowerCase() && ing.isTrigger
        );
        if (found) {
          triggerIngredients.push(found.name);
        }
      }

      res.json({
        ingredients,
        triggerIngredients
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get ingredients" });
    }
  });

  app.get("/api/ingredients", async (req, res) => {
    try {
      const ingredients = await storage.getIngredients();
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.get("/api/ingredients/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const ingredients = await storage.searchIngredients(q);
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to search ingredients" });
    }
  });

  // Saved dishes routes
  app.get("/api/saved-dishes", async (req, res) => {
    try {
      const userId = "demo-user";
      const dishes = await storage.getSavedDishes(userId);
      res.json(dishes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved dishes" });
    }
  });

  app.post("/api/saved-dishes", async (req, res) => {
    try {
      const userId = "demo-user";
      const validatedData = insertSavedDishSchema.parse({
        ...req.body,
        userId
      });

      const savedDish = await storage.createSavedDish(validatedData);
      res.json(savedDish);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid saved dish data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create saved dish" });
    }
  });

  app.put("/api/saved-dishes/:id/use", async (req, res) => {
    try {
      const userId = "demo-user";
      const success = await storage.updateSavedDishUsage(req.params.id, userId);
      if (success) {
        res.json({ message: "Saved dish usage updated" });
      } else {
        res.status(404).json({ message: "Saved dish not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update saved dish usage" });
    }
  });

  app.delete("/api/saved-dishes/:id", async (req, res) => {
    try {
      const userId = "demo-user";
      const success = await storage.deleteSavedDish(req.params.id, userId);
      if (success) {
        res.json({ message: "Saved dish deleted successfully" });
      } else {
        res.status(404).json({ message: "Saved dish not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete saved dish" });
    }
  });

  // Pattern analysis route
  app.get("/api/analysis/patterns", async (req, res) => {
    try {
      const userId = "demo-user";
      const { days = "7" } = req.query;
      
      const daysCount = parseInt(days as string);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysCount);

      const foodEntries = await storage.getFoodEntriesByDateRange(userId, startDate, endDate);
      const symptomEntries = await storage.getSymptomEntriesByDateRange(userId, startDate, endDate);

      // Simple correlation analysis
      const triggerCorrelations: Record<string, { count: number; severity: number }> = {};
      
      for (const symptomEntry of symptomEntries) {
        // Find food entries within 24 hours before symptom
        const symptomTime = symptomEntry.occurredAt.getTime();
        const relevantFoods = foodEntries.filter(foodEntry => {
          const foodTime = foodEntry.mealTime.getTime();
          const timeDiff = symptomTime - foodTime;
          return timeDiff >= 0 && timeDiff <= 24 * 60 * 60 * 1000; // 24 hours
        });

        for (const foodEntry of relevantFoods) {
          const triggers = foodEntry.triggerIngredients || [];
          for (const trigger of triggers) {
            if (!triggerCorrelations[trigger]) {
              triggerCorrelations[trigger] = { count: 0, severity: 0 };
            }
            triggerCorrelations[trigger].count++;
            triggerCorrelations[trigger].severity += symptomEntry.severity;
          }
        }
      }

      // Calculate correlation percentages
      const patterns = Object.entries(triggerCorrelations).map(([trigger, data]: [string, any]) => ({
        ingredient: trigger,
        correlation: Math.min(95, (data.count / Math.max(1, symptomEntries.length)) * 100),
        averageSeverity: data.severity / data.count,
        occurrences: data.count
      })).sort((a, b) => b.correlation - a.correlation);

      res.json({
        patterns,
        totalDays: daysCount,
        foodEntries: foodEntries.length,
        symptomEntries: symptomEntries.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze patterns" });
    }
  });

  // Multi-lag correlation analysis endpoint
  app.post("/api/analysis/multi-lag-correlation", async (req, res) => {
    try {
      const userId = "demo-user";
      const settings = {
        windows: req.body.windows || [6, 24, 48],
        aggregation: req.body.aggregation || "sum",
        coverageThreshold: req.body.coverageThreshold || 70,
        minExposures: req.body.minExposures || 3
      };

      // Generate/refresh derived tables first
      await storage.generateDerivedTables(userId);
      
      // Calculate correlation analysis
      const correlationResults = await storage.calculateCorrelationAnalysis(userId, settings);

      res.json({
        results: correlationResults,
        settings,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Multi-lag correlation error:", error);
      res.status(500).json({ message: "Failed to calculate multi-lag correlation analysis" });
    }
  });

  // Get coverage data for debugging/transparency
  app.get("/api/analysis/coverage", async (req, res) => {
    try {
      const userId = "demo-user";
      const { days = "30" } = req.query;
      
      const daysCount = parseInt(days as string);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysCount);

      const coverage = await storage.getUserDayCoverage(userId, startDate, endDate);
      
      res.json({
        coverage,
        validDays: coverage.filter(c => c.totalCoverage >= 70).length,
        totalDays: coverage.length,
        averageCoverage: coverage.length > 0 ? 
          coverage.reduce((sum, c) => sum + c.totalCoverage, 0) / coverage.length : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coverage data" });
    }
  });

  // Export data route
  app.get("/api/export", async (req, res) => {
    try {
      const userId = "demo-user";
      const { format = "json", days = "30" } = req.query;
      
      const daysCount = parseInt(days as string);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysCount);

      const foodEntries = await storage.getFoodEntriesByDateRange(userId, startDate, endDate);
      const symptomEntries = await storage.getSymptomEntriesByDateRange(userId, startDate, endDate);

      const exportData = {
        exportDate: new Date().toISOString(),
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        foodEntries,
        symptomEntries
      };

      if (format === "csv") {
        // Simple CSV export
        let csv = "Type,Date,Name/Description,Details\n";
        
        foodEntries.forEach(entry => {
          csv += `Food,${entry.mealTime.toISOString()},${entry.dishName},"${entry.ingredients.join(', ')}"\n`;
        });
        
        symptomEntries.forEach(entry => {
          const symptoms = entry.symptoms || [];
          csv += `Symptom,${entry.occurredAt.toISOString()},Bristol Type ${entry.bristolType},"Severity: ${entry.severity}, Symptoms: ${symptoms.join(', ')}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="digesttrack-export.csv"');
        res.send(csv);
      } else {
        res.json(exportData);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Generate sample data endpoint (for development/testing)
  app.post("/api/generate-sample-data", async (req, res) => {
    try {
      const { generateSampleData } = await import("./utils/sample-data-generator");
      const result = await generateSampleData();
      res.json({
        success: true,
        ...result,
        message: "Sample data generated successfully"
      });
    } catch (error) {
      console.error("Sample data generation error:", error);
      res.status(500).json({ message: "Failed to generate sample data" });
    }
  });

  // Import CSV data endpoint
  app.post("/api/import-csv-data", async (req, res) => {
    try {
      const { importCSVData } = await import("./utils/csv-data-importer");
      const result = await importCSVData();
      res.json({
        success: true,
        ...result,
        message: "CSV data imported successfully"
      });
    } catch (error) {
      console.error("CSV data import error:", error);
      res.status(500).json({ 
        message: "Failed to import CSV data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
