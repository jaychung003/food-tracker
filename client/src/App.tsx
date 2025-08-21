import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import FoodLog from "@/pages/food-log";
import SymptomLog from "@/pages/symptom-log";
import Analysis from "@/pages/analysis";
import Timeline from "@/pages/timeline";
import Correlation from "@/pages/correlation";
import MobileLayout from "@/components/layout/mobile-layout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/food-log" component={FoodLog} />
      <Route path="/symptom-log" component={SymptomLog} />
      <Route path="/analysis" component={Analysis} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/correlation" component={Correlation} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MobileLayout>
          <Router />
        </MobileLayout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
