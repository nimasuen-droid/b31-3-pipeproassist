import { Shield, BookOpen, Calculator, AlertTriangle, Upload, FileCheck } from "lucide-react";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { InstallButton } from "../InstallButton";
import { DATASET_WORKFLOW_NOTICE, PRODUCT_DESCRIPTION, PRODUCT_NAME, PRODUCT_POSITIONING } from "@/lib/brand";

export function HomeModule({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const stats = [
    { label: "Sources Loaded", value: "0", icon: BookOpen, status: "missing" as const },
    { label: "Active Lines", value: "0", icon: FileCheck, status: "missing" as const },
    { label: "Calculations", value: "0", icon: Calculator, status: "missing" as const },
    { label: "Warnings", value: "—", icon: AlertTriangle, status: "missing" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{PRODUCT_NAME}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {PRODUCT_POSITIONING}. {PRODUCT_DESCRIPTION}
          </p>
        </div>
        <InstallButton variant="home" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="eng-card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="eng-label">{s.label}</span>
            </div>
            <div className="font-mono text-xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="eng-card border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-semibold">Engineering Workspace</span>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{DATASET_WORKFLOW_NOTICE} No values are fabricated; every output traces to a default, imported, or user-entered source basis.</p>
          <div className="grid md:grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate("source-library")}
              className="eng-card hover:border-primary/50 transition-colors cursor-pointer text-left"
            >
              <Upload className="h-4 w-4 text-primary mb-1" />
              <div className="text-xs font-medium text-foreground">1. Review Datasets</div>
              <div className="text-[10px] text-muted-foreground">Review default reference tables or stage custom source-referenced engineering datasets</div>
            </button>
            <button
              data-onboarding="design-basis"
              onClick={() => onNavigate("inputs")}
              className="eng-card hover:border-primary/50 transition-colors cursor-pointer text-left"
            >
              <FileCheck className="h-4 w-4 text-primary mb-1" />
              <div className="text-xs font-medium text-foreground">2. Enter Design Basis</div>
              <div className="text-[10px] text-muted-foreground">Define line parameters, service conditions, materials, and design requirements</div>
            </button>
          </div>
        </div>
      </div>

      <div className="eng-card">
        <div className="eng-label mb-3">Reference Standards & Engineering Sources</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {[
            "ASME B31.3 – Process Piping",
            "ASME Sec II Part D – Stress Tables",
            "ASME B16.5 – Flange Ratings",
            "ASME B16.47 – Large Diameter Flanges",
            "ASME B16.9 – BW Fittings",
            "ASME B16.11 – Forged Fittings",
            "ASME B36.10M – CS Pipe Dimensions",
            "ASME B36.19M – SS Pipe Dimensions",
            "ASTM Material Specifications",
            "MSS SP Standards",
            "Company Specifications",
            "Material Compatibility Libraries",
          ].map((s) => (
            <div key={s} className="bg-secondary/50 rounded px-2 py-1.5 text-muted-foreground">{s}</div>
          ))}
        </div>
      </div>

      <EngineeringDisclaimer />
    </div>
  );
}
