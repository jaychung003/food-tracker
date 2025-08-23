import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Clock, Target, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import type { TagCorrelationResult, CorrelationAnalysisSettings } from "@shared/schema";

interface CorrelationResponse {
  results: TagCorrelationResult[];
  settings: CorrelationAnalysisSettings;
  generatedAt: string;
}

interface CoverageData {
  coverage: Array<{
    date: Date;
    totalCoverage: number;
    mealCoverage: number;
    bmCoverage: number;
  }>;
  validDays: number;
  totalDays: number;
  averageCoverage: number;
}

export default function CorrelationPage() {
  const [settings, setSettings] = useState<CorrelationAnalysisSettings>({
    windows: [6, 24, 48],
    aggregation: "sum",
    coverageThreshold: 70,
    minExposures: 3
  });
  
  const [selectedWindow, setSelectedWindow] = useState<number>(24);

  // Fetch coverage data
  const { data: coverageData } = useQuery<CoverageData>({
    queryKey: ["/api/analysis/coverage", { days: 30 }],
  });

  // Multi-lag correlation analysis mutation
  const correlationMutation = useMutation({
    mutationFn: async (settings: CorrelationAnalysisSettings) => {
      const response = await fetch("/api/analysis/multi-lag-correlation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error("Failed to analyze correlation");
      return response.json() as Promise<CorrelationResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analysis/coverage"] });
    }
  });

  const correlationData = correlationMutation.data;

  const handleRunAnalysis = () => {
    correlationMutation.mutate(settings);
  };

  const toggleWindow = (window: number) => {
    setSettings(prev => ({
      ...prev,
      windows: prev.windows.includes(window)
        ? prev.windows.filter(w => w !== window)
        : [...prev.windows, window].sort((a, b) => a - b)
    }));
  };

  const getReliabilityColor = (reliability: 'Low' | 'Medium' | 'High') => {
    switch (reliability) {
      case 'High': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Low': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    }
  };

  const getStatusIcon = (status: 'higher' | 'lower' | 'similar' | 'unclear') => {
    switch (status) {
      case 'higher': return <TrendingUp className="h-3 w-3" />;
      case 'lower': return <TrendingUp className="h-3 w-3 rotate-180" />;
      case 'similar': return <Target className="h-3 w-3" />;
      case 'unclear': return <AlertCircle className="h-3 w-3" />;
    }
  };

  // Filter results by selected window for window-specific view
  const filteredResults = correlationData?.results?.filter((result: TagCorrelationResult) => 
    result.primaryWindow === selectedWindow || 
    result.otherWindows.some((w: any) => w.window === selectedWindow)
  ) || [];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Multi-Lag Correlation Analysis</h1>
          <p className="text-muted-foreground">
            Advanced pattern detection across different time windows (6h, 24h, 48h)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={async () => {
              const response = await fetch("/api/generate-sample-data", { method: "POST" });
              if (response.ok) {
                queryClient.invalidateQueries({ queryKey: ["/api/analysis/coverage"] });
              }
            }}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Generate Sample Data
          </Button>
          <Button 
            onClick={handleRunAnalysis}
            disabled={correlationMutation.isPending}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {correlationMutation.isPending ? "Analyzing..." : "Run Analysis"}
          </Button>
        </div>
      </div>

      {/* Coverage Summary */}
      {coverageData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Data Coverage Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{coverageData.validDays}</div>
                <div className="text-sm text-muted-foreground">Valid Days (≥70%)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{coverageData.totalDays}</div>
                <div className="text-sm text-muted-foreground">Total Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{Math.round(coverageData.averageCoverage)}%</div>
                <div className="text-sm text-muted-foreground">Avg Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round((coverageData.validDays / coverageData.totalDays) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Data Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Settings</CardTitle>
          <CardDescription>Configure analysis parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">Time Windows</Label>
            <div className="flex gap-4 mt-2">
              {[6, 24, 48].map((window) => (
                <div key={window} className="flex items-center space-x-2">
                  <Switch
                    id={`window-${window}`}
                    checked={settings.windows.includes(window)}
                    onCheckedChange={() => toggleWindow(window)}
                  />
                  <Label htmlFor={`window-${window}`}>{window}h</Label>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Coverage Threshold</Label>
              <div className="text-lg font-mono">{settings.coverageThreshold}%</div>
            </div>
            <div>
              <Label className="text-sm">Minimum Exposures</Label>
              <div className="text-lg font-mono">{settings.minExposures}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {correlationData && (
        <Tabs value="ranked" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="ranked">Ranked Results</TabsTrigger>
              <TabsTrigger value="by-window">By Window</TabsTrigger>
            </TabsList>
            
            {/* Window selector for by-window view */}
            <div className="flex gap-2">
              {settings.windows.map((window) => (
                <Button
                  key={window}
                  variant={selectedWindow === window ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedWindow(window)}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {window}h
                </Button>
              ))}
            </div>
          </div>

          <TabsContent value="ranked" className="space-y-4">
            {correlationData.results.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No significant correlations found. Try lowering minimum exposures or adding more data.
                  </p>
                </CardContent>
              </Card>
            ) : (
              correlationData.results.map((result: TagCorrelationResult) => (
                <Card key={result.tag} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="capitalize">{result.tag}</CardTitle>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Primary: {result.primaryWindow}h
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {result.upliftRatio > 1 ? '+' : ''}{Math.round((result.upliftRatio - 1) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">vs control</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-medium">n={result.nExposures}</div>
                        <div className="text-sm text-muted-foreground">exposures</div>
                      </div>
                      <div className="text-center">
                        <Badge className={getReliabilityColor(result.reliability)}>
                          {result.reliability}
                        </Badge>
                      </div>
                    </div>
                    
                    {result.otherWindows.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-sm font-medium mb-2">Other Windows:</div>
                          <div className="flex flex-wrap gap-2">
                            {result.otherWindows.map((window: any) => (
                              <Badge 
                                key={window.window}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {getStatusIcon(window.status)}
                                {window.window}h: {Math.round((window.effect / result.effect - 1) * 100)}%
                                <span className={`ml-1 ${getReliabilityColor(window.reliability).replace('bg-', 'text-').replace('text-', '').replace('dark:', '')}`}>
                                  ({window.reliability})
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {result.coOccurringTags && result.coOccurringTags.length > 0 && (
                      <>
                        <Separator />
                        <div className="text-sm text-amber-600 dark:text-amber-400">
                          ⚠️ Often co-occurs with: {result.coOccurringTags.join(', ')}. Interpret cautiously.
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="by-window" className="space-y-4">
            <div className="grid gap-4">
              {filteredResults.map((result: TagCorrelationResult) => (
                <Card key={result.tag}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium capitalize">{result.tag}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getReliabilityColor(
                          result.primaryWindow === selectedWindow 
                            ? result.reliability
                            : result.otherWindows.find(w => w.window === selectedWindow)?.reliability || 'Low'
                        )}>
                          {result.primaryWindow === selectedWindow 
                            ? result.reliability
                            : result.otherWindows.find(w => w.window === selectedWindow)?.reliability || 'Low'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          n={result.nExposures}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {correlationMutation.isError && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to run correlation analysis. Please try again.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}