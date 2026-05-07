import { Lightbulb, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { Recommendations } from "./recommendationEngine";

interface TeachingPanelProps {
  recommendations: Recommendations;
  visible: boolean;
}

interface TeachingItemProps {
  label: string;
  value: string;
  reason: string;
  source: string;
  confidence?: string;
}

function TeachingItem({ label, value, reason, source, confidence }: TeachingItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Lightbulb className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">{label}</span>
          <span className="text-xs font-mono text-primary truncate">{value}</span>
          {confidence && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium shrink-0">
              {confidence}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="px-3 py-2 bg-secondary/30 border-t border-border space-y-1.5">
          <p className="text-xs text-foreground leading-relaxed">{reason}</p>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground font-mono">{source}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeachingPanel({ recommendations, visible }: TeachingPanelProps) {
  if (!visible) return null;

  const items: TeachingItemProps[] = [
    { label: "Pipe Material", value: recommendations.pipeMaterial.value, reason: recommendations.pipeMaterial.reason, source: recommendations.pipeMaterial.source, confidence: recommendations.pipeMaterial.confidence },
    { label: "Flange Material", value: recommendations.flangeMaterial.value, reason: recommendations.flangeMaterial.reason, source: recommendations.flangeMaterial.source, confidence: recommendations.flangeMaterial.confidence },
    { label: "Fitting Material", value: recommendations.fittingMaterial.value, reason: recommendations.fittingMaterial.reason, source: recommendations.fittingMaterial.source, confidence: recommendations.fittingMaterial.confidence },
    { label: "Bolt Material", value: recommendations.boltMaterial.value, reason: recommendations.boltMaterial.reason, source: recommendations.boltMaterial.source, confidence: recommendations.boltMaterial.confidence },
    { label: "Gasket Type", value: recommendations.gasketType.value, reason: recommendations.gasketType.reason, source: recommendations.gasketType.source, confidence: recommendations.gasketType.confidence },
    { label: "Corrosion Allowance", value: recommendations.corrosionAllowance.value, reason: recommendations.corrosionAllowance.reason, source: recommendations.corrosionAllowance.source },
    { label: "Mill Tolerance", value: recommendations.millTolerance.value + "%", reason: recommendations.millTolerance.reason, source: recommendations.millTolerance.source },
    { label: "Joint Quality Factor", value: recommendations.jointQualityFactor.value, reason: recommendations.jointQualityFactor.reason, source: recommendations.jointQualityFactor.source },
    { label: "Test Pressure", value: recommendations.testPressure.value || "–", reason: recommendations.testPressure.reason, source: recommendations.testPressure.source },
    { label: "Test Medium", value: recommendations.testMedium.value, reason: recommendations.testMedium.reason, source: recommendations.testMedium.source },
  ];

  return (
    <div className="eng-card space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-foreground">Recommendation Rationale</span>
        <span className="text-[10px] text-muted-foreground">Click each item to learn why it was recommended</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <TeachingItem key={item.label} {...item} />
        ))}
      </div>
    </div>
  );
}
