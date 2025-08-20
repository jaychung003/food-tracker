import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, Trash2, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SavedDish {
  id: string;
  dishName: string;
  ingredients: string[];
  triggerIngredients: string[];
  aiDetectedIngredients: string[];
  timesUsed: number;
  lastUsedAt: string;
}

interface SavedDishesProps {
  onSelectDish: (dish: SavedDish) => void;
  onSaveDish: (dishData: {
    dishName: string;
    ingredients: string[];
    triggerIngredients: string[];
    aiDetectedIngredients: string[];
  }) => void;
  currentDishName?: string;
  currentIngredients?: string[];
  currentTriggers?: string[];
  currentAiIngredients?: string[];
  showSaveOption?: boolean;
}

export function SavedDishes({
  onSelectDish,
  onSaveDish,
  currentDishName,
  currentIngredients = [],
  currentTriggers = [],
  currentAiIngredients = [],
  showSaveOption = false
}: SavedDishesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: savedDishes = [], isLoading } = useQuery({
    queryKey: ["/api/saved-dishes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/saved-dishes");
      return response.json();
    },
  });

  const deleteDishMutation = useMutation({
    mutationFn: async (dishId: string) => {
      return apiRequest("DELETE", `/api/saved-dishes/${dishId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-dishes"] });
    },
  });

  const saveDishMutation = useMutation({
    mutationFn: async (dishData: any) => {
      return apiRequest("POST", "/api/saved-dishes", dishData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-dishes"] });
    },
  });

  const handleSaveDish = () => {
    if (currentDishName && currentIngredients.length > 0) {
      const dishData = {
        dishName: currentDishName,
        ingredients: currentIngredients,
        triggerIngredients: currentTriggers,
        aiDetectedIngredients: currentAiIngredients,
      };
      saveDishMutation.mutate(dishData);
      onSaveDish(dishData);
    }
  };

  const handleSelectDish = (dish: SavedDish) => {
    // Update usage counter
    apiRequest("PUT", `/api/saved-dishes/${dish.id}/use`);
    queryClient.invalidateQueries({ queryKey: ["/api/saved-dishes"] });
    onSelectDish(dish);
  };

  const filteredDishes = savedDishes.filter((dish: SavedDish) =>
    dish.dishName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="text-sm text-gray-500">Loading saved dishes...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Save Current Dish Option */}
      {showSaveOption && currentDishName && currentIngredients.length > 0 && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Save "{currentDishName}" for later?</p>
              <p className="text-xs text-blue-700">
                {currentIngredients.length} ingredients • {currentTriggers.length} triggers detected
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleSaveDish}
              disabled={saveDishMutation.isPending}
            >
              {saveDishMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      {savedDishes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search saved dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Saved Dishes List */}
      {filteredDishes.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <Label className="text-sm font-medium">Recent dishes ({filteredDishes.length})</Label>
          {filteredDishes.map((dish: SavedDish) => (
            <Card
              key={dish.id}
              className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleSelectDish(dish)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{dish.dishName}</h4>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {dish.timesUsed}x
                    </Badge>
                  </div>
                  
                  {/* Ingredients preview */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {dish.ingredients.slice(0, 3).map((ingredient, index) => {
                      const isAiDetected = dish.aiDetectedIngredients.includes(ingredient);
                      const isTrigger = dish.triggerIngredients.includes(ingredient);
                      return (
                        <Badge
                          key={index}
                          variant="outline"
                          className={`text-xs ${
                            isTrigger
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }`}
                        >
                          {isAiDetected && <Sparkles className="w-2 h-2 mr-1" />}
                          {ingredient}
                        </Badge>
                      );
                    })}
                    {dish.ingredients.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{dish.ingredients.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Last used {new Date(dish.lastUsedAt).toLocaleDateString()}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDishMutation.mutate(dish.id);
                  }}
                  className="text-gray-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : savedDishes.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No saved dishes yet</p>
          <p className="text-xs">Save your favorite meals to reuse them quickly!</p>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No dishes match "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
}