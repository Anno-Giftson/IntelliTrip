import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function RowsEditor({ rows, fields, blank, addLabel, onChange }) {
  const update = (index, key, value) => {
    const next = rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={index} className="rounded-xl border border-border bg-card/60 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.wide ? "sm:col-span-2" : ""}>
                <Label htmlFor={`row-${index}-${field.key}`} className="text-xs">
                  {field.label}
                </Label>
                {field.textarea ? (
                  <Textarea
                    id={`row-${index}-${field.key}`}
                    value={row[field.key] ?? ""}
                    rows={2}
                    className="mt-1"
                    onChange={(e) => update(index, field.key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={`row-${index}-${field.key}`}
                    value={row[field.key] ?? ""}
                    className="mt-1 bg-card"
                    onChange={(e) => update(index, field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 text-foreground/70"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
          >
            <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { ...blank }])}>
        <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}