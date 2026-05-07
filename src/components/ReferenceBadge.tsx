import { useState } from "react";
import { BookOpen, X, ExternalLink, AlertTriangle, CheckCircle2, FileText, Clock, User, Shield, ChevronDown, ChevronUp } from "lucide-react";
import type { CalculationTrace } from "@/stores/sourceRegistry";

interface ReferenceBadgeProps {
  trace: CalculationTrace;
  compact?: boolean;
}

export function ReferenceBadge({ trace, compact = false }: ReferenceBadgeProps) {
  const [open, setOpen] = useState(false);

  const confidenceColors: Record<string, string> = {
    "exact-match": "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
    "mapped": "bg-primary/15 text-primary border-primary/30",
    "default-rule": "bg-accent/15 text-accent border-accent/30",
    "unmapped": "bg-muted text-muted-foreground border-border",
  };

  const confidenceLabels: Record<string, string> = {
    "exact-match": "Exact Source Match",
    "mapped": "Mapped Reference",
    "default-rule": "Default Engineering Rule",
    "unmapped": "Unmapped — Upload Required",
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex min-h-10 items-center gap-0.5 rounded border transition-colors cursor-pointer hover:opacity-80 shrink-0 ${confidenceColors[trace.confidenceLevel]} ${
          compact ? "px-2 py-1 text-[9px]" : "px-2 py-1 text-[10px]"
        }`}
        title="View source reference"
      >
        <BookOpen className={compact ? "h-2 w-2" : "h-2.5 w-2.5"} />
        {!compact && <span className="font-medium">Ref</span>}
      </button>

      {open && <ReferencePopup trace={trace} onClose={() => setOpen(false)} confidenceColors={confidenceColors} confidenceLabels={confidenceLabels} />}
    </>
  );
}

function ReferencePopup({ trace, onClose, confidenceColors, confidenceLabels }: {
  trace: CalculationTrace;
  onClose: () => void;
  confidenceColors: Record<string, string>;
  confidenceLabels: Record<string, string>;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Source Traceability</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Field & Value */}
          <div className="bg-secondary/50 rounded-md p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Applied Value</div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">{trace.fieldName}:</span>
                <span className="ml-2 font-mono text-sm text-foreground font-semibold">{trace.appliedValue || "–"}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${confidenceColors[trace.confidenceLevel]}`}>
                {confidenceLabels[trace.confidenceLevel]}
              </span>
            </div>
            {trace.overrideStatus === "manual-override" && (
              <div className="mt-1 text-[10px] text-accent flex items-center gap-1">
                <AlertTriangle className="h-2.5 w-2.5" />
                Manual override applied — recommended value was bypassed
              </div>
            )}
          </div>

          {/* Source */}
          <Section title="Source">
            <Row label="Standard" value={trace.standard || "Not specified"} />
            <Row label="Reference" value={trace.sectionRef || "Not specified"} />
            {trace.edition && <Row label="Edition" value={trace.edition} />}
            {trace.sourceTitle && <Row label="Dataset" value={trace.sourceTitle} />}
            <Row label="Origin" value={originLabel(trace.sourceOrigin)} />
          </Section>

          {/* Table basis */}
          {(trace.tableRef || trace.tableNumber) && (
            <Section title="Table Basis">
              {trace.tableNumber && <Row label="Table" value={trace.tableNumber} />}
              {trace.tableRef && <Row label="Reference" value={trace.tableRef} />}
              {trace.rowBasis && <Row label="Row" value={trace.rowBasis} />}
              {trace.cellBasis && <Row label="Cell" value={trace.cellBasis} />}
              {trace.lookupFilters && Object.entries(trace.lookupFilters).map(([k, v]) => (
                <Row key={k} label={`Filter: ${k}`} value={v} />
              ))}
            </Section>
          )}

          {/* Why Selected */}
          <Section title="Why Selected">
            <p className="text-xs text-foreground leading-relaxed">{trace.whySelected}</p>
          </Section>

          {/* Assumptions & Warnings */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground py-1"
          >
            <span>Assumptions & Warnings ({trace.assumptions.length + trace.warnings.length})</span>
            {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showDetails && (
            <div className="space-y-2">
              {trace.assumptions.length > 0 && (
                <div className="space-y-1">
                  {trace.assumptions.map((a, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      {a}
                    </div>
                  ))}
                </div>
              )}
              {trace.warnings.length > 0 && (
                <div className="space-y-1">
                  {trace.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-accent">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unmapped notice */}
          {trace.confidenceLevel === "unmapped" && (
            <div className="bg-accent/5 border border-accent/20 rounded p-3 text-xs text-accent flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Exact extracted content not available until uploaded and mapped via Source Library. Currently using citation reference only.</span>
            </div>
          )}

          {trace.confidenceLevel === "default-rule" && (
            <div className="bg-primary/5 border border-primary/20 rounded p-3 text-xs text-muted-foreground flex items-start gap-2">
              <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
              <span>Reference available but exact row/cell mapping not yet configured. Import source-referenced tables to enable exact traceability.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">{title}</div>
      <div className="bg-secondary/30 rounded-md p-2.5 space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2 text-xs">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground font-mono text-right">{value}</span>
    </div>
  );
}

function originLabel(origin: string) {
  switch (origin) {
    case "user-uploaded": return "User-Uploaded Standard";
    case "company-internal": return "Company Internal Table";
    case "standard-derived": return "Standard-Derived Dataset";
    case "default-rule": return "Built-in Engineering Rule";
    default: return origin;
  }
}
