import { useQuery } from "@tanstack/react-query";
import { type FoodEntry, type SymptomEntry } from "@shared/schema";
import TimelineEntry from "@/components/ui/timeline-entry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Timeline() {
  const [dateRange, setDateRange] = useState(7); // days

  const { data: foodEntries = [], isLoading: foodLoading } = useQuery<FoodEntry[]>({
    queryKey: ["/api/food-entries"],
  });

  const { data: symptomEntries = [], isLoading: symptomLoading } = useQuery<SymptomEntry[]>({
    queryKey: ["/api/symptom-entries"],
  });

  // Filter entries based on date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRange);

  const filteredFoodEntries = foodEntries.filter(entry => 
    new Date(entry.mealTime) >= cutoffDate
  );

  const filteredSymptomEntries = symptomEntries.filter(entry =>
    new Date(entry.occurredAt) >= cutoffDate
  );

  // Combine and sort entries
  const allEntries = [
    ...filteredFoodEntries.map(entry => ({ 
      ...entry, 
      type: 'food' as const, 
      time: new Date(entry.mealTime) 
    })),
    ...filteredSymptomEntries.map(entry => ({ 
      ...entry, 
      type: 'symptom' as const, 
      time: new Date(entry.occurredAt) 
    }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  // Group entries by date
  const entriesByDate = allEntries.reduce((groups, entry) => {
    const date = entry.time.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, typeof allEntries>);

  if (foodLoading || symptomLoading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
            <div className="h-8 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Timeline</h1>
        <p className="text-gray-600">Your complete food and symptom history</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {[7, 30, 90].map((days) => (
          <Button
            key={days}
            variant={dateRange === days ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange(days)}
          >
            {days} Days
          </Button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(entriesByDate).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No entries found for the selected time period.</p>
              <p className="text-sm text-gray-400">Start logging your meals and symptoms to see them here!</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(entriesByDate).map(([date, entries]) => (
            <Card key={date}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {entries.map((entry, index) => (
                  <TimelineEntry key={`${entry.type}-${entry.id}`} entry={entry} />
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{filteredFoodEntries.length}</p>
            <p className="text-sm text-gray-600">Food Entries</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{filteredSymptomEntries.length}</p>
            <p className="text-sm text-gray-600">Symptom Entries</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
