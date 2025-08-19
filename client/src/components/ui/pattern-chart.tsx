import { useQuery } from "@tanstack/react-query";
import { type SymptomEntry } from "@shared/schema";

interface PatternChartProps {
  timeRange: number;
}

export default function PatternChart({ timeRange }: PatternChartProps) {
  const { data: symptomEntries = [], isLoading } = useQuery<SymptomEntry[]>({
    queryKey: ["/api/symptom-entries"],
  });

  if (isLoading) {
    return (
      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading chart...</p>
      </div>
    );
  }

  // Filter entries based on time range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeRange);
  
  const filteredEntries = symptomEntries.filter(entry => 
    new Date(entry.occurredAt) >= cutoffDate
  );

  // Group by date and calculate average severity
  const dailyData = filteredEntries.reduce((acc, entry) => {
    const date = new Date(entry.occurredAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { total: 0, count: 0 };
    }
    acc[date].total += entry.severity;
    acc[date].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const chartData = Object.entries(dailyData).map(([date, data]) => ({
    date,
    severity: Math.round(data.total / data.count * 10) / 10
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (chartData.length === 0) {
    return (
      <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">No symptom data available</p>
          <p className="text-gray-400 text-xs">Start logging symptoms to see patterns</p>
        </div>
      </div>
    );
  }

  const maxSeverity = Math.max(...chartData.map(d => d.severity));
  
  return (
    <div className="h-48 bg-gray-50 rounded-lg p-4">
      <div className="h-full flex items-end justify-between space-x-1">
        {chartData.slice(-14).map((data, index) => {
          const height = (data.severity / 10) * 100; // Convert to percentage
          const color = data.severity > 7 ? 'bg-red-500' : 
                       data.severity > 4 ? 'bg-yellow-500' : 'bg-green-500';
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex-1 flex items-end w-full">
                <div 
                  className={`w-full rounded-t ${color} transition-all duration-300`}
                  style={{ height: `${height}%`, minHeight: '4px' }}
                  title={`${data.date}: ${data.severity}/10`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                {new Date(data.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          );
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
      </div>
    </div>
  );
}
