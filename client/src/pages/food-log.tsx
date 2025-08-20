import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FoodSearch from "@/components/ui/food-search";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Edit, Sparkles, AlertTriangle, Plus } from "lucide-react";

interface TriggerIngredient {
  ingredient: string;
  category: string;
  confidence: number;
  reason: string;
}

export default function FoodLog() {
  const [, setLocation] = useLocation();
  const [dishName, setDishName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [triggerIngredients, setTriggerIngredients] = useState<TriggerIngredient[]>([]);
  const [mealTime, setMealTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [showAISuggestion, setShowAISuggestion] = useState(true);
  const [newIngredient, setNewIngredient] = useState("");
  const [aiDetectedIngredients, setAiDetectedIngredients] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFoodEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/food-entries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Food entry saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/food-entries"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to save food entry.",
        variant: "destructive",
      });
    },
  });

  const handleFoodSelect = (selectedDish: string, detectedIngredients: string[], detectedTriggers: TriggerIngredient[]) => {
    setDishName(selectedDish);
    setIngredients(detectedIngredients);
    setAiDetectedIngredients(detectedIngredients); // Mark all as AI-detected
    setTriggerIngredients(detectedTriggers);
    setShowAISuggestion(false);
  };

  const handleAIAnalysis = async () => {
    if (!dishName.trim()) return;
    
    try {
      const response = await fetch('/api/food/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dishName: dishName.trim(),
          existingIngredients: ingredients.length > 0 ? ingredients : undefined
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Merge AI-detected ingredients with existing ones, avoiding duplicates
        const newIngredients = result.ingredients || [];
        const mergedIngredients = [...ingredients];
        
        const newAiIngredients: string[] = [];
        newIngredients.forEach((ingredient: string) => {
          if (!mergedIngredients.some(existing => 
            existing.toLowerCase() === ingredient.toLowerCase())) {
            mergedIngredients.push(ingredient);
            newAiIngredients.push(ingredient);
          }
        });
        
        setIngredients(mergedIngredients);
        setAiDetectedIngredients([...aiDetectedIngredients, ...newAiIngredients]);
        setTriggerIngredients(result.triggerIngredients || []);
        setShowAISuggestion(false);
        
        toast({
          title: "AI Detection Complete",
          description: `Added ${newAiIngredients.length} new ingredients`,
        });
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        title: "AI Detection Failed",
        description: "Could not detect ingredients. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeIngredient = (indexToRemove: number) => {
    const removedIngredient = ingredients[indexToRemove];
    const updatedIngredients = ingredients.filter((_, index) => index !== indexToRemove);
    setIngredients(updatedIngredients);
    // Also remove from AI-detected list if it exists there
    setAiDetectedIngredients(aiDetectedIngredients.filter(ai => ai !== removedIngredient));
    // Re-analyze triggers after ingredient removal
    if (updatedIngredients.length > 0) {
      reAnalyzeTriggersMutation.mutate(updatedIngredients);
    } else {
      setTriggerIngredients([]);
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      const updatedIngredients = [...ingredients, newIngredient.trim()];
      setIngredients(updatedIngredients);
      setNewIngredient("");
      // Re-analyze triggers after ingredient addition
      reAnalyzeTriggersMutation.mutate(updatedIngredients);
    }
  };

  const handleAddIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  // AI re-analysis mutation for edited ingredients
  const reAnalyzeTriggersMutation = useMutation({
    mutationFn: async (ingredientList: string[]) => {
      const response = await apiRequest("POST", "/api/food/analyze-triggers", { ingredients: ingredientList });
      return response.json();
    },
    onSuccess: (data) => {
      setTriggerIngredients(data.triggerIngredients || []);
      toast({
        title: "Analysis Updated",
        description: "Trigger ingredients analyzed with AI!",
      });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze triggers. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dishName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a dish name.",
        variant: "destructive",
      });
      return;
    }

    // Convert trigger ingredients to simple string array for storage
    const triggerNames = triggerIngredients.map(trigger => trigger.ingredient);
    
    createFoodEntryMutation.mutate({
      dishName: dishName.trim(),
      ingredients,
      triggerIngredients: triggerNames,
      mealTime: new Date(mealTime).toISOString(),
    });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Log Food</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Dish Name */}
        <div className="space-y-2">
          <Label htmlFor="dish-name">Dish or drink name</Label>
          <Input
            id="dish-name"
            value={dishName}
            onChange={(e) => {
              setDishName(e.target.value);
              if (ingredients.length > 0) {
                setIngredients([]);
                setAiDetectedIngredients([]);
                setTriggerIngredients([]);
                setShowAISuggestion(true);
              }
            }}
            placeholder="e.g., chicken pasta, coffee, Prime energy drink"
            required
          />
        </div>

        {/* Ingredients Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Ingredients</Label>
            {dishName.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIAnalysis}
                className="flex items-center gap-1"
              >
                <Sparkles className="w-4 h-4" />
                {ingredients.length === 0 ? "AI detect" : "Add more with AI"}
              </Button>
            )}
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="space-y-3">
              {/* Show existing ingredients */}
              {ingredients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient, index) => {
                    const triggerInfo = triggerIngredients.find(t => t.ingredient.toLowerCase() === ingredient.toLowerCase());
                    const isAiDetected = aiDetectedIngredients.includes(ingredient);
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
                          triggerInfo
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-green-100 text-green-700 border border-green-200"
                        } ${isAiDetected ? 'relative' : ''}`}
                      >
                        {isAiDetected && (
                          <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0" />
                        )}
                        <span>
                          {ingredient}
                          {triggerInfo && (
                            <span className="ml-1 text-xs opacity-75">
                              ({triggerInfo.category})
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-200 hover:text-red-800 transition-colors flex-shrink-0 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Add new ingredient input */}
              <div className="flex items-center gap-2">
                <Input
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={handleAddIngredientKeyPress}
                  placeholder="Add ingredient (e.g., chicken, rice, tomato)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addIngredient}
                  disabled={!newIngredient.trim() || ingredients.includes(newIngredient.trim())}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
              
              {/* Show AI suggestion if no ingredients */}
              {ingredients.length === 0 && dishName.trim() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-sm text-blue-700 mb-2">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Let AI detect ingredients for "{dishName}"
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAIAnalysis}
                  >
                    Analyze with AI
                  </Button>
                </div>
              )}
              
              {/* Empty state */}
              {ingredients.length === 0 && !dishName.trim() && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Add ingredients to continue
                </p>
              )}
              
              {/* Detailed trigger information */}
              {triggerIngredients.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="flex items-center text-sm font-medium text-red-900 mb-2">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Potential UC Triggers Detected
                  </h4>
                  <div className="space-y-2">
                    {triggerIngredients.map((trigger, index) => (
                      <div key={index} className="text-xs text-red-700">
                        <span className="font-medium capitalize">{trigger.ingredient}</span>
                        <span className="mx-1">•</span>
                        <span className="uppercase text-red-600">{trigger.category}</span>
                        <span className="mx-1">•</span>
                        <span>{Math.round(trigger.confidence * 100)}% confidence</span>
                        <div className="mt-1 text-red-600 italic">{trigger.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Meal Time */}
        <div className="space-y-2">
          <Label htmlFor="meal-time">Meal time</Label>
          <Input
            id="meal-time"
            type="datetime-local"
            value={mealTime}
            onChange={(e) => setMealTime(e.target.value)}
            required
          />
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={createFoodEntryMutation.isPending || ingredients.length === 0 || !dishName.trim()}
        >
          {createFoodEntryMutation.isPending ? "Saving..." : "Save Food Entry"}
        </Button>
      </form>
    </div>
  );
}
