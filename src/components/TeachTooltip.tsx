import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { useLearningMode } from "@/stores/learningMode";
import type { FieldDefinition } from "./modules/designInputs/fieldDefinitions";

interface TeachTooltipProps {
  definition: FieldDefinition;
}

export function TeachTooltip({ definition }: TeachTooltipProps) {
  const [open, setOpen] = useState(false);
  const { enabled: learningMode } = useLearningMode();

  // In learning mode, show icon more prominently
  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center justify-center rounded-full transition-colors shrink-0 ${
          learningMode
            ? "text-accent hover:text-accent/80 bg-accent/10 h-4 w-4"
            : "text-muted-foreground hover:text-foreground h-3.5 w-3.5"
        }`}
        title={`Learn about: ${definition.label}`}
      >
        <HelpCircle className={learningMode ? "h-3 w-3" : "h-2.5 w-2.5"} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold">{definition.label}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <Section title="Definition" content={definition.definition} />
              <Section title="Code Context" content={definition.codeContext} />
              <Section title="Why This Matters" content={definition.whyMatters} />
              <Section title="Impact on Design" content={definition.impact} />
              <Section title="Typical Ranges / Examples" content={definition.typicalRange} />
              <Section title="Common Mistakes" content={definition.commonMistakes} highlight />
              <Section title="When to Be Conservative" content={definition.whenConservative} />

              <div className="mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground italic">
                Engineering support tool. No checker sign-off is enforced by this app.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, content, highlight }: { title: string; content: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "bg-accent/5 border border-accent/20 rounded-md p-2.5" : ""}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{title}</div>
      <p className="text-xs text-foreground leading-relaxed">{content}</p>
    </div>
  );
}
