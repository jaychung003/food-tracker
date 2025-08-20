import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface SymptomSeverityScaleProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const severityLabels = {
  1: "Mild",
  2: "Moderate", 
  3: "Severe"
};

const severityColors = {
  1: "bg-green-100 text-green-800 border-green-200",
  2: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  3: "bg-red-100 text-red-800 border-red-200"
};

export default function SymptomSeverityScale({ 
  label, 
  value, 
  onChange, 
  className = "" 
}: SymptomSeverityScaleProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3].map((severity) => (
          <Button
            key={severity}
            type="button"
            variant={value === severity ? "default" : "outline"}
            size="sm"
            className={`flex-1 h-12 flex flex-col gap-1 ${
              value === severity 
                ? severityColors[severity as keyof typeof severityColors]
                : "hover:bg-gray-50"
            }`}
            onClick={() => onChange(severity)}
          >
            <span className="font-medium">{severity}</span>
            <span className="text-xs">
              {severityLabels[severity as keyof typeof severityLabels]}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}