import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BristolScale from "@/components/ui/bristol-scale";
import SymptomSelector from "@/components/ui/symptom-selector";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

export default function SymptomLog() {
  const [, setLocation] = useLocation();
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSymptomEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/symptom-entries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Symptom entry saved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/symptom-entries"] });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save symptom entry.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bristolType === null) {
      toast({
        title: "Error",
        description: "Please select a Bristol Stool Scale type.",
        variant: "destructive",
      });
      return;
    }

    createSymptomEntryMutation.mutate({
      bristolType,
      symptoms,
      severity,
      notes: notes.trim() || null,
      occurredAt: new Date(occurredAt).toISOString(),
    });
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Log Symptoms</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bristol Stool Scale */}
        <div className="space-y-4">
          <Label>Bristol Stool Scale</Label>
          <BristolScale
            selectedType={bristolType}
            onTypeSelect={setBristolType}
          />
        </div>

        {/* Additional Symptoms */}
        <div className="space-y-4">
          <Label>Additional Symptoms</Label>
          <SymptomSelector
            selectedSymptoms={symptoms}
            onSymptomsChange={setSymptoms}
          />
        </div>

        {/* Severity */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="severity">Overall Severity</Label>
            <p className="text-sm text-gray-600 mt-1">
              Rate the overall impact of this bowel movement (1 = minor discomfort, 10 = severe symptoms affecting daily activities)
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 w-4">1</span>
              <input
                id="severity"
                type="range"
                min="1"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-600 w-6">10</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Mild</span>
              <span className="font-medium text-gray-700">{severity}/10</span>
              <span>Severe</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            rows={3}
          />
        </div>

        {/* Time */}
        <div className="space-y-2">
          <Label htmlFor="occurred-at">Time</Label>
          <Input
            id="occurred-at"
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            required
          />
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={createSymptomEntryMutation.isPending}
        >
          {createSymptomEntryMutation.isPending ? "Saving..." : "Save Symptom Entry"}
        </Button>
      </form>
    </div>
  );
}
