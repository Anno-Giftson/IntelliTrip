import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StringListEditor({ items, addLabel, onChange }) {
  const update = (index, value) => onChange(items.map((item, i) => (i === index ? value : item)));

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={item}
            className="bg-card"
            onChange={(e) => update(index, e.target.value)}
            aria-label={`Item ${index + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove item"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, ""])}>
        <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}