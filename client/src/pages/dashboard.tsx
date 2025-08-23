import { useQuery } from "@tanstack/react-query";
import { type FoodEntry, type SymptomEntry } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, AlertTriangle, TrendingUp } from "lucide-react";
import TimelineEntry from "@/components/ui/timeline-entry";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: foodEntries = [], isLoading: foodLoading } = useQuery<FoodEntry[]>({
    queryKey: ["/api/food-entries"],
  });

  const { data: symptomEntries = [], isLoading: symptomLoading } = useQuery<SymptomEntry[]>({
    queryKey: ["/api/symptom-entries"],
  });

  const { data: patterns } = useQuery({
    queryKey: ["/api/analysis/patterns"],
  });

  // Get today's entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysFoods = foodEntries.filter(entry => {
    const mealTime = new Date(entry.mealTime);
    return mealTime >= today && mealTime < tomorrow;
  });

  const todaysSymptoms = symptomEntries.filter(entry => {
    const occurredAt = new Date(entry.occurredAt);
    return occurredAt >= today && occurredAt < tomorrow;
  });

  // Combine and sort today's entries
  const todaysEntries = [
    ...todaysFoods.map(entry => ({ ...entry, type: 'food' as const, time: new Date(entry.mealTime) })),
    ...todaysSymptoms.map(entry => ({ ...entry, type: 'symptom' as const, time: new Date(entry.occurredAt) }))
  ].sort((a, b) => b.time.getTime() - a.time.getTime());

  const topTrigger = patterns?.patterns?.[0];

  if (foodLoading || symptomLoading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded-xl"></div>
            <div className="h-24 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Meals</p>
              <p className="text-2xl font-bold text-primary">{todaysFoods.length}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Symptoms</p>
              <p className="text-2xl font-bold text-warning">{todaysSymptoms.length}</p>
            </div>
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
          </div>
        </div>
      </div>

      {/* Potential Triggers Alert */}
      {topTrigger && topTrigger.correlation > 50 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-3 h-3 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">Potential Trigger Detected</h3>
              <p className="text-sm text-red-700">
                Your symptoms may be related to <strong>{topTrigger.ingredient}</strong> intake ({Math.round(topTrigger.correlation)}% correlation).
              </p>
              <button 
                onClick={() => setLocation("/analysis")}
                className="mt-2 text-sm text-red-600 font-medium hover:text-red-800"
              >
                View Details <TrendingUp className="inline w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Today's Timeline</h2>
          <p className="text-sm text-gray-600">Food entries and symptoms</p>
        </div>
        
        <div className="p-4 space-y-4">
          {todaysEntries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No entries today. Start by logging your meals or symptoms!
            </p>
          ) : (
            todaysEntries.slice(0, 5).map((entry, index) => (
              <TimelineEntry key={`${entry.type}-${entry.id}`} entry={entry} />
            ))
          )}
          
          {todaysEntries.length > 5 && (
            <button 
              onClick={() => setLocation("/timeline")}
              className="w-full py-2 text-sm text-primary font-medium hover:text-primary/80"
            >
              View all entries ({todaysEntries.length})
            </button>
          )}
        </div>
      </div>

      {/* Weekly Pattern Summary */}
      {patterns && patterns.patterns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Weekly Pattern</h2>
            <p className="text-sm text-gray-600">Trigger ingredient correlation</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {patterns.patterns.slice(0, 3).map((pattern: any) => (
                <div key={pattern.ingredient} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">{pattern.ingredient}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          pattern.correlation > 70 ? 'bg-red-500' :
                          pattern.correlation > 40 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min(100, pattern.correlation)}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${
                      pattern.correlation > 70 ? 'text-red-600' :
                      pattern.correlation > 40 ? 'text-yellow-600' : 'text-orange-600'
                    }`}>
                      {Math.round(pattern.correlation)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setLocation("/analysis")}
              className="w-full mt-4 py-2 text-sm text-primary font-medium border border-primary rounded-lg hover:bg-primary/5"
            >
              View Detailed Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
