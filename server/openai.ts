import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface IngredientAnalysis {
  ingredients: string[];
  triggerIngredients: {
    ingredient: string;
    category: string;
    confidence: number;
    reason: string;
  }[];
}

export async function analyzeIngredients(dishName: string): Promise<IngredientAnalysis> {
  try {
    const prompt = `You're an expert dietitian and you have to guess whether the following foods have any triggers for an ulcerative colitis patient. For each of the food listed below, can you try to guess what ingredients go in it typically and whether those ingredients are triggers for someone with UC and which of the food types they belong under?

Analyze the dish "${dishName}" and provide:
1. A comprehensive list of typical ingredients used in this dish
2. Identify any ingredients that could be UC triggers

Common UC trigger categories:
- Gluten (wheat, barley, rye, spelt)
- Dairy (milk, cheese, butter, cream, yogurt)
- FODMAPs (onions, garlic, beans, apples, wheat, etc.)
- Spicy ingredients (chili, hot peppers, spices)
- High-fat ingredients
- Processed meats (sausage, deli meat, bacon)
- High-fiber foods (nuts, seeds, raw vegetables)
- Artificial sweeteners
- Caffeine
- Alcohol

Please respond in JSON format with this structure:
{
  "ingredients": ["ingredient1", "ingredient2", ...],
  "triggerIngredients": [
    {
      "ingredient": "ingredient_name",
      "category": "gluten|dairy|fodmap|spicy|high_fat|processed|high_fiber|artificial|caffeine|alcohol",
      "confidence": 0.8,
      "reason": "brief explanation why this could trigger UC flares"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert dietitian specializing in ulcerative colitis. Analyze dishes for ingredients and potential UC triggers. Focus on foods that commonly trigger UC flares. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      ingredients: result.ingredients || [],
      triggerIngredients: result.triggerIngredients || []
    };
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    // Fallback to basic analysis if OpenAI fails
    return analyzeIngredientsFallback(dishName);
  }
}

export async function analyzeTriggers(ingredients: string[]): Promise<IngredientAnalysis['triggerIngredients']> {
  try {
    const prompt = `You're an expert dietitian and you have to guess whether the following foods have any triggers for an ulcerative colitis patient. 

Analyze this list of ingredients for potential UC triggers: ${ingredients.join(", ")}

Common UC trigger categories:
- Gluten (wheat, barley, rye, spelt)
- Dairy (milk, cheese, butter, cream, yogurt)
- FODMAPs (onions, garlic, beans, apples, wheat, etc.)
- Spicy ingredients (chili, hot peppers, spices)
- High-fat ingredients
- Processed meats (sausage, deli meat, bacon)
- High-fiber foods (nuts, seeds, raw vegetables)
- Artificial sweeteners
- Caffeine
- Alcohol

Please respond in JSON format:
{
  "triggerIngredients": [
    {
      "ingredient": "ingredient_name",
      "category": "gluten|dairy|fodmap|spicy|high_fat|processed|high_fiber|artificial|caffeine|alcohol",
      "confidence": 0.8,
      "reason": "brief explanation why this could trigger UC flares"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert dietitian specializing in ulcerative colitis. Analyze ingredients for potential UC triggers that commonly cause flares. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.triggerIngredients || [];
  } catch (error) {
    console.error("OpenAI trigger analysis error:", error);
    return analyzeTriggersFallback(ingredients);
  }
}

// Fallback functions for when OpenAI is unavailable
function analyzeIngredientsFallback(dishName: string): IngredientAnalysis {
  const lowerDish = dishName.toLowerCase();
  
  // Simple ingredient mapping
  const ingredientMap: Record<string, string[]> = {
    pizza: ["wheat flour", "mozzarella cheese", "tomato sauce", "olive oil"],
    pasta: ["wheat flour", "olive oil", "garlic", "tomato"],
    salad: ["lettuce", "tomato", "cucumber", "olive oil"],
    sandwich: ["wheat bread", "meat", "lettuce", "tomato"],
    soup: ["broth", "vegetables", "onion", "garlic"],
    rice: ["rice", "water", "salt"],
    chicken: ["chicken breast", "salt", "pepper"],
  };

  let ingredients: string[] = [];
  for (const [key, value] of Object.entries(ingredientMap)) {
    if (lowerDish.includes(key)) {
      ingredients = value;
      break;
    }
  }

  if (ingredients.length === 0) {
    ingredients = ["unknown ingredients"];
  }

  return {
    ingredients,
    triggerIngredients: analyzeTriggersFallback(ingredients)
  };
}

function analyzeTriggersFallback(ingredients: string[]): IngredientAnalysis['triggerIngredients'] {
  const triggers: IngredientAnalysis['triggerIngredients'] = [];
  
  const triggerMap = {
    gluten: ["wheat", "flour", "bread", "pasta", "barley", "rye"],
    dairy: ["cheese", "milk", "butter", "cream", "yogurt"],
    fodmap: ["onion", "garlic", "beans", "apple", "wheat"],
  };

  ingredients.forEach(ingredient => {
    const lower = ingredient.toLowerCase();
    
    Object.entries(triggerMap).forEach(([category, triggerWords]) => {
      triggerWords.forEach(triggerWord => {
        if (lower.includes(triggerWord)) {
          triggers.push({
            ingredient,
            category,
            confidence: 0.7,
            reason: `Contains ${triggerWord}, which is a known ${category} trigger`
          });
        }
      });
    });
  });

  return triggers;
}