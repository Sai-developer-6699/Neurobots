import { Slider } from "@/components/ui/slider";
import { Label } from "@radix-ui/react-label";

export default function ConfidenceSlider({ value, onChange }) {
  const getLabel = (val) => {
    if (val < 25) return "Guessing";
    if (val < 50) return "Unsure";
    if (val < 75) return "Fairly Confident";
    return "Very Confident";
  };

  const getColor = (val) => {
    if (val < 25) return "text-red-500";
    if (val < 50) return "text-orange-500";
    if (val < 75) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium text-muted-foreground">
          Confidence Level
        </Label>
        <span className={`text-sm font-bold ${getColor(value)}`}>
          {getLabel(value)} ({value}%)
        </span>
      </div>
      <Slider
        defaultValue={[50]}
        max={100}
        step={1}
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        className="cursor-pointer"
      />
    </div>
  );
}
