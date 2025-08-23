import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PatternChart from "@/components/ui/pattern-chart";
import { Download, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Analysis() {
  const [timeRange, setTimeRange] = useState("7");
  const { toast } = useToast();

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ["/api/analysis/patterns", { days: timeRange }],
  });

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/export?format=${format}&days=${timeRange}`);
      
      if (format === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "digesttrack-export.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "digesttrack-export.json";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      toast({
        title: "Success",
        description: `Data exported successfully as ${format.toUpperCase()}!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data.",
        variant: "destructive",
      });
    }
  };

  const getRiskLevel = (correlation: number) => {
    if (correlation > 70) return { level: "High Risk", color: "text-red-600" };
    if (correlation > 40) return { level: "Medium Risk", color: "text-yellow-600" };
    return { level: "Low Risk", color: "text-green-600" };
  };

  const getRecommendations = (patterns: any[]) => {
    const recommendations = [];
    
    if (patterns.some(p => p.ingredient.toLowerCase().includes("gluten") && p.correlation > 50)) {
      recommendations.push("Consider eliminating gluten for 2-4 weeks to test sensitivity");
    }
    
    if (patterns.some(p => p.ingredient.toLowerCase().includes("dairy") && p.correlation > 40)) {
      recommendations.push("Try lactose-free dairy alternatives to test dairy sensitivity");
    }
    
    if (patterns.length > 0) {
      recommendations.push("Share this analysis with your healthcare provider");
    }

    if (recommendations.length === 0) {
      recommendations.push("Continue tracking to identify patterns over time");
      recommendations.push("Maintain a consistent logging routine for best results");
    }

    return recommendations;
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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

  const patterns = analysisData?.patterns || [];
  const recommendations = getRecommendations(patterns);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pattern Analysis</h1>
          <p className="text-gray-600">Discover your trigger foods and symptoms</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
          >
            <Download className="w-4 h-4 mr-1" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
          >
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-2">
        {["7", "30", "90"].map((days) => (
          <Button
            key={days}
            variant={timeRange === days ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(days)}
          >
            {days} Days
          </Button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">Total Days</p>
            <p className="text-xl font-bold text-gray-900">{analysisData?.totalDays || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">Food Entries</p>
            <p className="text-xl font-bold text-primary">{analysisData?.foodEntries || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600">Symptom Entries</p>
            <p className="text-xl font-bold text-warning">{analysisData?.symptomEntries || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Trigger Foods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Top Trigger Foods
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patterns.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Not enough data to identify patterns yet. Keep logging to see correlations!
            </p>
          ) : (
            <div className="space-y-4">
              {patterns.slice(0, 5).map((pattern: any, index: number) => {
                const risk = getRiskLevel(pattern.correlation);
                return (
                  <div key={pattern.ingredient} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        index === 0 ? "bg-red-100" :
                        index === 1 ? "bg-yellow-100" : "bg-gray-100"
                      }`}>
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{pattern.ingredient}</p>
                        <p className="text-sm text-gray-600">
                          {Math.round(pattern.correlation)}% correlation • {pattern.occurrences} occurrence(s)
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${risk.color}`}>
                      {risk.level}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Symptom Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Symptom Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatternChart timeRange={parseInt(timeRange)} />
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Lightbulb className="w-5 h-5 mr-2" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-800">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
