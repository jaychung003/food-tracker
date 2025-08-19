import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FoodSearchProps {
  value: string;
  onChange: (value: string) => void;
  onFoodSelect: (dish: string, ingredients: string[], triggerIngredients: any[]) => void;
}

interface TriggerIngredient {
  ingredient: string;
  category: string;
  confidence: number;
  reason: string;
}

export default function FoodSearch({ value, onChange, onFoodSelect }: FoodSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: suggestions = [] } = useQuery<string[]>({
    queryKey: ["/api/food/search", searchQuery],
    enabled: searchQuery.length > 1,
  });

  // OpenAI-powered ingredient analysis
  const analyzeIngredientsMutation = useMutation({
    mutationFn: async (dishName: string) => {
      const response = await apiRequest("POST", "/api/food/analyze", { dishName });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.ingredients && data.triggerIngredients) {
        onFoodSelect(value, data.ingredients, data.triggerIngredients);
      }
    },
    onError: (error) => {
      console.error("Failed to analyze ingredients:", error);
      // Fallback to basic ingredient detection
      onFoodSelect(value, [], []);
    }
  });

  // Trigger analysis when user stops typing
  useEffect(() => {
    if (value.length > 2) {
      const timeoutId = setTimeout(() => {
        analyzeIngredientsMutation.mutate(value);
        setShowSuggestions(false); // Hide suggestions after analysis starts
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchQuery(newValue);
    setShowSuggestions(newValue.length > 1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSearchQuery("");
  };

  const recentMeals = ["Oatmeal", "Caesar Salad", "Rice Bowl", "Pizza", "Smoothie"];

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={handleInputChange}
            placeholder="Enter dish name for AI analysis..."
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {analyzeIngredientsMutation.isPending ? (
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
        {value.length > 2 && !analyzeIngredientsMutation.isPending && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => analyzeIngredientsMutation.mutate(value)}
            className="shrink-0"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg capitalize"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Quick Suggestions */}
      {!showSuggestions && value.length === 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium text-gray-700">Recent meals</p>
          <div className="flex flex-wrap gap-2">
            {recentMeals.map((meal) => (
              <button
                key={meal}
                type="button"
                onClick={() => handleSuggestionClick(meal)}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
              >
                {meal}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
