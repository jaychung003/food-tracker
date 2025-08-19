import { type FoodEntry, type SymptomEntry } from "@shared/schema";

export interface TriggerPattern {
  ingredient: string;
  correlation: number;
  occurrences: number;
  averageSeverity: number;
  timeToSymptom: number; // average hours between eating and symptoms
}

export interface PatternAnalysis {
  patterns: TriggerPattern[];
  totalFoodEntries: number;
  totalSymptomEntries: number;
  analysisPeriod: number; // days
}

// Analyze patterns between food consumption and symptoms
export function analyzePatterns(
  foodEntries: FoodEntry[],
  symptomEntries: SymptomEntry[],
  windowHours: number = 24
): PatternAnalysis {
  const triggerCorrelations: Record<string, {
    symptomCount: number;
    totalSymptoms: number;
    severitySum: number;
    timeDelays: number[];
  }> = {};

  // Initialize correlation tracking for all trigger ingredients found
  foodEntries.forEach(foodEntry => {
    foodEntry.triggerIngredients.forEach(trigger => {
      if (!triggerCorrelations[trigger]) {
        triggerCorrelations[trigger] = {
          symptomCount: 0,
          totalSymptoms: 0,
          severitySum: 0,
          timeDelays: []
        };
      }
    });
  });

  // Analyze each symptom entry
  symptomEntries.forEach(symptomEntry => {
    const symptomTime = new Date(symptomEntry.occurredAt).getTime();
    let triggeredByAny = false;

    // Find food entries within the time window before this symptom
    foodEntries.forEach(foodEntry => {
      const mealTime = new Date(foodEntry.mealTime).getTime();
      const timeDiff = symptomTime - mealTime;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Check if this meal was within our analysis window
      if (hoursDiff >= 0 && hoursDiff <= windowHours) {
        foodEntry.triggerIngredients.forEach(trigger => {
          if (triggerCorrelations[trigger]) {
            triggerCorrelations[trigger].symptomCount++;
            triggerCorrelations[trigger].severitySum += symptomEntry.severity;
            triggerCorrelations[trigger].timeDelays.push(hoursDiff);
            triggeredByAny = true;
          }
        });
      }
    });

    // Count total symptoms for correlation calculation
    Object.keys(triggerCorrelations).forEach(trigger => {
      triggerCorrelations[trigger].totalSymptoms++;
    });
  });

  // Calculate patterns
  const patterns: TriggerPattern[] = Object.entries(triggerCorrelations)
    .map(([ingredient, data]) => ({
      ingredient,
      correlation: data.totalSymptoms > 0 
        ? (data.symptomCount / data.totalSymptoms) * 100 
        : 0,
      occurrences: data.symptomCount,
      averageSeverity: data.symptomCount > 0 
        ? data.severitySum / data.symptomCount 
        : 0,
      timeToSymptom: data.timeDelays.length > 0
        ? data.timeDelays.reduce((sum, delay) => sum + delay, 0) / data.timeDelays.length
        : 0
    }))
    .filter(pattern => pattern.occurrences > 0)
    .sort((a, b) => b.correlation - a.correlation);

  return {
    patterns,
    totalFoodEntries: foodEntries.length,
    totalSymptomEntries: symptomEntries.length,
    analysisPeriod: Math.ceil(
      Math.max(
        ...foodEntries.map(e => new Date(e.mealTime).getTime()),
        ...symptomEntries.map(e => new Date(e.occurredAt).getTime())
      ) - Math.min(
        ...foodEntries.map(e => new Date(e.mealTime).getTime()),
        ...symptomEntries.map(e => new Date(e.occurredAt).getTime())
      )
    ) / (1000 * 60 * 60 * 24)
  };
}

// Get recommendations based on pattern analysis
export function getRecommendations(analysis: PatternAnalysis): string[] {
  const recommendations: string[] = [];
  
  const highRiskTriggers = analysis.patterns.filter(p => p.correlation > 70);
  const mediumRiskTriggers = analysis.patterns.filter(p => p.correlation > 40 && p.correlation <= 70);

  if (highRiskTriggers.length > 0) {
    const topTrigger = highRiskTriggers[0];
    recommendations.push(
      `Consider eliminating ${topTrigger.ingredient} for 2-4 weeks to confirm sensitivity (${Math.round(topTrigger.correlation)}% correlation)`
    );
  }

  if (mediumRiskTriggers.length > 0) {
    recommendations.push(
      `Monitor your intake of ${mediumRiskTriggers.map(t => t.ingredient).join(', ')} more closely`
    );
  }

  if (analysis.patterns.some(p => p.ingredient.toLowerCase().includes('dairy'))) {
    recommendations.push("Try lactose-free alternatives if dairy appears problematic");
  }

  if (analysis.patterns.some(p => p.ingredient.toLowerCase().includes('gluten'))) {
    recommendations.push("Consider a gluten-free trial period");
  }

  if (analysis.totalSymptomEntries > 0 && analysis.patterns.length > 0) {
    recommendations.push("Share this analysis with your healthcare provider for professional guidance");
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue consistent logging to identify patterns over time");
    recommendations.push("Consider keeping portion sizes and meal timing consistent for better analysis");
  }

  return recommendations;
}

export default {
  analyzePatterns,
  getRecommendations,
};
