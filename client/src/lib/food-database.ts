// Food database utilities for ingredient detection and trigger analysis

export interface FoodItem {
  name: string;
  ingredients: string[];
  category: string;
}

export interface IngredientInfo {
  name: string;
  isTrigger: boolean;
  category: string;
  description?: string;
}

// Common trigger ingredients database
export const triggerIngredients: Record<string, IngredientInfo> = {
  wheat: { name: "wheat", isTrigger: true, category: "gluten", description: "Contains gluten protein" },
  barley: { name: "barley", isTrigger: true, category: "gluten", description: "Contains gluten protein" },
  rye: { name: "rye", isTrigger: true, category: "gluten", description: "Contains gluten protein" },
  milk: { name: "milk", isTrigger: true, category: "dairy", description: "Contains lactose" },
  cheese: { name: "cheese", isTrigger: true, category: "dairy", description: "Contains lactose" },
  onions: { name: "onions", isTrigger: true, category: "fodmap", description: "High FODMAP content" },
  garlic: { name: "garlic", isTrigger: true, category: "fodmap", description: "High FODMAP content" },
  apples: { name: "apples", isTrigger: true, category: "fodmap", description: "High fructose content" },
  beans: { name: "beans", isTrigger: true, category: "fodmap", description: "High oligosaccharide content" },
};

// Helper function to detect trigger ingredients in a list
export function detectTriggers(ingredients: string[]): string[] {
  const triggers: string[] = [];
  
  ingredients.forEach(ingredient => {
    const lowerIngredient = ingredient.toLowerCase();
    
    // Check for exact matches or partial matches
    Object.values(triggerIngredients).forEach(triggerInfo => {
      if (lowerIngredient.includes(triggerInfo.name) || 
          triggerInfo.name.includes(lowerIngredient)) {
        if (!triggers.includes(triggerInfo.name)) {
          triggers.push(triggerInfo.name);
        }
      }
    });
    
    // Check for common wheat products
    if (['bread', 'pasta', 'flour', 'croutons', 'crackers'].some(wheat => 
        lowerIngredient.includes(wheat))) {
      if (!triggers.includes('wheat')) {
        triggers.push('wheat');
      }
    }
    
    // Check for dairy products
    if (['butter', 'cream', 'yogurt', 'parmesan', 'mozzarella', 'cheddar'].some(dairy => 
        lowerIngredient.includes(dairy))) {
      if (!triggers.includes('dairy')) {
        triggers.push('dairy');
      }
    }
  });
  
  return triggers;
}

// Helper function to categorize ingredients by risk level
export function categorizeIngredientRisk(ingredient: string): 'safe' | 'caution' | 'trigger' {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Check if it's a known trigger
  if (Object.values(triggerIngredients).some(trigger => 
      lowerIngredient.includes(trigger.name) || trigger.name.includes(lowerIngredient))) {
    return 'trigger';
  }
  
  // Check for commonly safe foods
  const safeIngredients = ['rice', 'chicken', 'carrots', 'spinach', 'potato', 'cucumber'];
  if (safeIngredients.some(safe => lowerIngredient.includes(safe))) {
    return 'safe';
  }
  
  return 'caution';
}

export default {
  triggerIngredients,
  detectTriggers,
  categorizeIngredientRisk,
};
