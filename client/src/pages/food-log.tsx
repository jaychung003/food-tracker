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
  const [ingredientMode, setIngredientMode] = useState<'choose' | 'ai' | 'manual'>('choose');
  const [newIngredient, setNewIngredient] = useState("");

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
    setTriggerIngredients(detectedTriggers);
    setIngredientMode('ai');
  };

  const handleAIDetection = () => {
    if (!dishName.trim()) return;
    setIngredientMode('ai');
    // The FoodSearch component will handle the AI analysis
  };

  const handleManualEntry = () => {
    setIngredients([]);
    setTriggerIngredients([]);
    setIngredientMode('manual');
  };

  const resetIngredientMode = () => {
    setIngredientMode('choose');
    setIngredients([]);
    setTriggerIngredients([]);
  };

  const removeIngredient = (indexToRemove: number) => {
    const updatedIngredients = ingredients.filter((_, index) => index !== indexToRemove);
    setIngredients(updatedIngredients);
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
              if (ingredientMode !== 'choose') {
                resetIngredientMode();
              }
            }}
            placeholder="e.g., chicken pasta, coffee, Prime energy drink"
            required
          />
        </div>

        {/* Step 2: Choose ingredient method */}
        {dishName.trim() && ingredientMode === 'choose' && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <Label className="text-base font-medium mb-3 block">How would you like to add ingredients?</Label>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleAIDetection}
                className="justify-start h-auto p-4"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <div className="font-medium">Use AI detection (recommended)</div>
                    <div className="text-sm text-gray-600 mt-1">AI will analyze "{dishName}" and detect ingredients and UC triggers automatically</div>
                  </div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleManualEntry}
                className="justify-start h-auto p-4"
              >
                <div className="flex items-start gap-3">
                  <Edit className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="text-left">
                    <div className="font-medium">Enter ingredients manually</div>
                    <div className="text-sm text-gray-600 mt-1">Add ingredients yourself and skip AI analysis</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: AI Detection */}
        {ingredientMode === 'ai' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">AI-detected ingredients</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetIngredientMode}
              >
                Change method
              </Button>
            </div>
            
            {ingredients.length === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <FoodSearch
                  value={dishName}
                  onChange={setDishName}
                  onFoodSelect={handleFoodSelect}
                />
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ingredient, index) => {
                      const triggerInfo = triggerIngredients.find(t => t.ingredient.toLowerCase() === ingredient.toLowerCase());
                      return (
                        <div
                          key={index}
                          className={`flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
                            triggerInfo
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-green-100 text-green-700 border border-green-200"
                          }`}
                        >
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
                            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-200 hover:text-red-800 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    
                    {/* Add new ingredient */}
                    <div className="flex items-center gap-1">
                      <Input
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        onKeyPress={handleAddIngredientKeyPress}
                        placeholder="Add ingredient"
                        className="w-32 h-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addIngredient}
                        disabled={!newIngredient.trim() || ingredients.includes(newIngredient.trim())}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
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
            )}
          </div>
        )}

        {/* Step 3: Manual Entry */}
        {ingredientMode === 'manual' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Ingredients</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetIngredientMode}
              >
                Change method
              </Button>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="space-y-3">
                {ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 border border-blue-200"
                      >
                        <span>{ingredient}</span>
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 hover:text-blue-800 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add new ingredient */}
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
                
                {ingredients.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Add ingredients to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
        <div className="space-y-2">
          {ingredientMode === 'choose' && dishName.trim() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-sm text-yellow-700">
                Choose how to add ingredients above to continue
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            className="w-full"
            disabled={createFoodEntryMutation.isPending || ingredients.length === 0 || !dishName.trim() || ingredientMode === 'choose'}
          >
            {createFoodEntryMutation.isPending ? "Saving..." : "Save Food Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
