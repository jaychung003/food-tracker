import { Utensils, AlertTriangle } from "lucide-react";
import { type FoodEntry, type SymptomEntry } from "@shared/schema";

interface TimelineEntryProps {
  entry: (FoodEntry & { type: 'food'; time: Date }) | (SymptomEntry & { type: 'symptom'; time: Date });
}

export default function TimelineEntry({ entry }: TimelineEntryProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getBristolDescription = (type: number) => {
    const descriptions = {
      1: "Hard lumps",
      2: "Lumpy, sausage-like",
      3: "Sausage w/ cracks",
      4: "Smooth sausage",
      5: "Soft blobs",
      6: "Mushy",
      7: "Liquid"
    };
    return descriptions[type as keyof typeof descriptions] || "Unknown";
  };

  if (entry.type === 'food') {
    return (
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Utensils className="w-4 h-4 text-secondary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">{entry.dishName}</p>
            <span className="text-sm text-gray-500">{formatTime(entry.time)}</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{entry.ingredients.join(", ")}</p>
          <div className="flex flex-wrap gap-1">
            {entry.triggerIngredients.length === 0 ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Safe</span>
            ) : (
              entry.triggerIngredients.map(trigger => (
                <span key={trigger} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                  Contains {trigger}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-warning" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900">Bowel Movement</p>
          <span className="text-sm text-gray-500">{formatTime(entry.time)}</span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Bristol Type {entry.bristolType}, {getBristolDescription(entry.bristolType)}
        </p>
        <div className="flex flex-wrap gap-1">
          {entry.symptoms.map(symptom => {
            const severity = entry.severity > 7 ? 'red' : entry.severity > 4 ? 'orange' : 'yellow';
            return (
              <span key={symptom} className={`px-2 py-1 bg-${severity}-100 text-${severity}-700 text-xs rounded-full`}>
                {symptom}
              </span>
            );
          })}
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            Severity {entry.severity}/10
          </span>
        </div>
      </div>
    </div>
  );
}
