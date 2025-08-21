import { storage } from "../storage";
import type { InsertFoodEntry, InsertSymptomEntry } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const data: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

export async function importCSVData() {
  const projectRoot = process.cwd();
  const foodCSVPath = path.join(projectRoot, "attached_assets", "food_entries_2w_user001_v2_1755814189436.csv");
  const symptomCSVPath = path.join(projectRoot, "attached_assets", "symptom_entries_2w_user001_v2_1755814194356.csv");
  
  console.log("Reading CSV files...");
  
  // Read and parse food entries CSV
  const foodCSVContent = fs.readFileSync(foodCSVPath, 'utf-8');
  const foodData = parseCSV(foodCSVContent);
  
  // Read and parse symptom entries CSV
  const symptomCSVContent = fs.readFileSync(symptomCSVPath, 'utf-8');
  const symptomData = parseCSV(symptomCSVContent);
  
  console.log(`Found ${foodData.length} food entries and ${symptomData.length} symptom entries`);
  
  // Transform and import food entries
  const foodEntries: InsertFoodEntry[] = [];
  
  for (const row of foodData) {
    try {
      const ingredients = JSON.parse(row.ingredients || "[]");
      const triggerIngredients = JSON.parse(row.triggerIngredients || "[]");
      
      const foodEntry: InsertFoodEntry = {
        userId: "demo-user", // Convert to our demo user
        dishName: row.dishName,
        ingredients,
        triggerIngredients,
        portion: "M", // Default portion since not in CSV
        mealTime: new Date(row.mealTime),
        notes: undefined
      };
      
      foodEntries.push(foodEntry);
    } catch (error) {
      console.warn(`Skipping invalid food entry: ${row.id}`, error);
    }
  }
  
  // Transform and import symptom entries
  const symptomEntries: InsertSymptomEntry[] = [];
  
  for (const row of symptomData) {
    try {
      const symptoms = JSON.parse(row.symptoms || "[]");
      
      const symptomEntry: InsertSymptomEntry = {
        userId: "demo-user", // Convert to our demo user
        bristolType: parseInt(row.bristolType),
        symptoms,
        severity: parseInt(row.severity || "0"), // Legacy field
        urgencySeverity: parseInt(row.urgencySeverity || "0"),
        bloodSeverity: parseInt(row.bloodSeverity || "0"), 
        painSeverity: parseInt(row.painSeverity || "0"),
        notes: row.notes || undefined,
        occurredAt: new Date(row.occurredAt)
      };
      
      symptomEntries.push(symptomEntry);
    } catch (error) {
      console.warn(`Skipping invalid symptom entry: ${row.id}`, error);
    }
  }
  
  // Clear existing data first
  console.log("Clearing existing data...");
  if (storage.clearAllData) {
    await storage.clearAllData();
  } else {
    console.warn("Clear data method not available");
  }
  
  // Insert the imported data
  console.log("Importing food entries...");
  for (const entry of foodEntries) {
    await storage.createFoodEntry(entry);
  }
  
  console.log("Importing symptom entries...");
  for (const entry of symptomEntries) {
    await storage.createSymptomEntry(entry);
  }
  
  console.log("CSV data import completed!");
  return {
    foodEntriesCount: foodEntries.length,
    symptomEntriesCount: symptomEntries.length,
    dateRange: {
      start: "2025-08-01",
      end: "2025-08-14"
    }
  };
}