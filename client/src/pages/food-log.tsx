import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FoodSearch from "@/components/ui/food-search";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Edit } from "lucide-react";

export default function FoodLog() {
  const [, setLocation] = useLocation();
  const [dishName, setDishName] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [triggerIngredients, setTriggerIngredients] = useState<string[]>([]);
  const [mealTime, setMealTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);

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

  const handleFoodSelect = (selectedDish: string, detectedIngredients: string[], detectedTriggers: string[]) => {
    setDishName(selectedDish);
    setIngredients(detectedIngredients);
    setTriggerIngredients(detectedTriggers);
  };

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

    createFoodEntryMutation.mutate({
      dishName: dishName.trim(),
      ingredients,
      triggerIngredients,
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
        {/* Smart Food Search */}
        <div className="space-y-2">
          <Label htmlFor="food-search">Search or enter dish name</Label>
          <FoodSearch
            value={dishName}
            onChange={setDishName}
            onFoodSelect={handleFoodSelect}
          />
        </div>

        {/* Detected Ingredients */}
        {ingredients.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-900">Detected Ingredients</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingIngredients(!isEditingIngredients)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
            
            {isEditingIngredients ? (
              <div className="space-y-2">
                <Input
                  value={ingredients.join(", ")}
                  onChange={(e) => setIngredients(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  placeholder="Enter ingredients separated by commas"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingIngredients(false)}
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className={`px-3 py-1 text-sm rounded-full ${
                      triggerIngredients.includes(ingredient)
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {ingredient}
                    {triggerIngredients.includes(ingredient) && " (trigger)"}
                  </span>
                ))}
              </div>
            )}
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
        <Button
          type="submit"
          className="w-full"
          disabled={createFoodEntryMutation.isPending}
        >
          {createFoodEntryMutation.isPending ? "Saving..." : "Save Food Entry"}
        </Button>
      </form>
    </div>
  );
}
