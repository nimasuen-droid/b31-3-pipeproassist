import { BookOpen, Clock, Shield, ChevronRight, ChevronLeft, FileText, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useSourceRegistry, type SourceDocument } from "@/stores/sourceRegistry";
import { ReferenceBadge } from "./ReferenceBadge";
import type { CalculationTrace } from "@/stores/sourceRegistry";

function statusLabel(status: string) {
  switch (status) {
    case "active": return "Active";
    case "approved": return "Reviewed";
    case "parsed": return "Parsed";
    case "draft": return "Draft";
    case "superseded": return "Superseded";
    case "archived": return "Deleted";
    default: return "Not Loaded";
  }
}

function displaySourceEdition(src: SourceDocument) {
  return src.origin === "standard-derived" || src.id.startsWith("std_")
    ? "Default"
    : src.edition || "User upload required";
}

function statusClass(status: string) {
  switch (status) {
    case "active": return "status-pass";
    case "approved": return "bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 rounded text-xs font-medium";
    case "parsed": return "status-review";
    case "draft": return "status-missing";
    case "superseded": return "text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded text-xs font-medium";
    default: return "status-missing";
  }
}

function SourceEntry({ src }: { src: SourceDocument }) {
  const [expanded, setExpanded] = useState(false);
  const registry = useSourceRegistry();
  const tables = registry.getTablesBySource(src.id);

  return (
    <div className="bg-secondary/50 rounded p-2 space-y-1">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setExpanded(!expanded)}
        aria-label={`${expanded ? "Collapse" : "Expand"} ${src.standard} source details`}
      >
        <span className="text-xs font-medium">{src.standard}</span>
        <span className={`text-[10px] ${statusClass(src.status)}`}>
          {statusLabel(src.status)}
        </span>
      </button>
      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
        <FileText className="h-2.5 w-2.5" />
        {displaySourceEdition(src)}
      </div>
      {/* Completeness bar */}
      <div className="flex items-center gap-1">
        <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${src.mappingCompleteness}%` }} />
        </div>
        <span className="text-[9px] text-muted-foreground">{src.mappingCompleteness}%</span>
      </div>
      {expanded && (
        <div className="mt-1 pt-1 border-t border-border/50 space-y-1">
          <div className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">Type:</span> {src.type.replace(/-/g, " ")}
          </div>
          {src.modulesLinked.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">Modules:</span>{" "}
              {src.modulesLinked.join(", ")}
            </div>
          )}
          {tables.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground">Tables:</span> {tables.length} mapped
            </div>
          )}
          {src.uploadDate && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Uploaded {src.uploadDate}
            </div>
          )}
          {src.notes && (
            <div className="text-[10px] text-muted-foreground italic">{src.notes}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function TraceabilityPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const registry = useSourceRegistry();

  const activeCount = registry.sources.filter(s => s.status === "active").length;
  const draftCount = registry.sources.filter(s => s.status === "draft").length;
  const totalMapped = registry.sources.reduce((sum, s) => sum + s.mappingCompleteness, 0);
  const avgCompleteness = registry.sources.length > 0 ? Math.round(totalMapped / registry.sources.length) : 0;

  if (collapsed) {
    return (
      <div className="w-10 bg-card border-l border-border flex flex-col items-center pt-4 shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Expand source traceability panel"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="mt-4 writing-mode-vertical text-xs text-muted-foreground [writing-mode:vertical-lr] rotate-180 tracking-wider">
          TRACEABILITY
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-card border-l border-border flex flex-col shrink-0 overflow-hidden">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider">Source Traceability</span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Collapse source traceability panel"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-3 py-2 border-b border-border/50 grid grid-cols-3 gap-1 text-center">
        <div>
          <div className="text-sm font-mono font-bold text-[hsl(var(--success))]">{activeCount}</div>
          <div className="text-[9px] text-muted-foreground">Active</div>
        </div>
        <div>
          <div className="text-sm font-mono font-bold text-muted-foreground">{draftCount}</div>
          <div className="text-[9px] text-muted-foreground">Draft</div>
        </div>
        <div>
          <div className="text-sm font-mono font-bold text-primary">{avgCompleteness}%</div>
          <div className="text-[9px] text-muted-foreground">Mapped</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="eng-label mb-2">Registered Standards</div>
        {registry.sources.filter(s => s.status !== "archived").map((src) => (
          <SourceEntry key={src.id} src={src} />
        ))}

        <div className="mt-4 p-2 border border-dashed border-border rounded text-center">
          <BookOpen className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-[10px] text-muted-foreground">
            Import source-referenced tables via Source Library to activate traceability
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-border">
        <div className="text-[10px] text-muted-foreground">
          <span className="font-medium">Confidence:</span>{" "}
          {activeCount > 0
            ? `${activeCount} source-referenced table${activeCount > 1 ? "s" : ""} loaded`
            : "No source-referenced tables loaded"
          }
        </div>
      </div>
    </div>
  );
}
