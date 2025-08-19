import { useLocation } from "wouter";
import { Plus, AlertTriangle } from "lucide-react";

export default function FloatingActionButtons() {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed bottom-20 right-4 space-y-3 z-20">
      <button
        onClick={() => setLocation("/symptom-log")}
        className="w-14 h-14 bg-secondary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-secondary/90 transition-colors"
      >
        <AlertTriangle className="w-5 h-5" />
      </button>
      <button
        onClick={() => setLocation("/food-log")}
        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}
