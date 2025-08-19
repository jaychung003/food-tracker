import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FoodSearchProps {
  value: string;
  onChange: (value: string) => void;
  onFoodSelect: (dish: string, ingredients: string[], triggerIngredients: string[]) => void;
}

export default function FoodSearch({ value, onChange, onFoodSelect }: FoodSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: suggestions = [] } = useQuery<string[]>({
    queryKey: ["/api/food/search", { q: searchQuery }],
    enabled: searchQuery.length > 1,
  });

  const { data: ingredientsData } = useQuery({
    queryKey: ["/api/food/ingredients", value.toLowerCase().replace(/\s+/g, "-")],
    enabled: value.length > 0 && !showSuggestions,
  });

  useEffect(() => {
    if (ingredientsData) {
      onFoodSelect(value, ingredientsData.ingredients || [], ingredientsData.triggerIngredients || []);
    }
  }, [ingredientsData, value, onFoodSelect]);

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
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          placeholder="Search or enter dish name..."
          className="pr-10"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
