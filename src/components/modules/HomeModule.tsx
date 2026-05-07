import { Shield, BookOpen, Calculator, AlertTriangle, Upload, FileCheck, ArrowRight, Layers, FileText } from "lucide-react";
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
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
          <div className="p-5 sm:p-7 lg:p-9">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Shield className="h-3.5 w-3.5" />
              Engineering Decision Support & Training Platform
            </div>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Welcome to {PRODUCT_NAME}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              {PRODUCT_POSITIONING}. {PRODUCT_DESCRIPTION} Built for EPC piping engineers, checkers,
              students, trainees, and clients who need clear ASME B31.3-aligned workflows without
              presenting software as a replacement for responsible engineering review.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                onClick={() => onNavigate("inputs")}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
              >
                Start Design Workflow
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate("manual")}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-secondary px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary/80"
              >
                Read User Manual
              </button>
              <InstallButton variant="home" />
            </div>
          </div>
          <div className="border-t border-border bg-secondary/30 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="grid gap-3">
              {[
                { title: "Guided engineering workflow", copy: "Move from design basis through material selection, wall thickness, schedule, fittings, valves, reports, and PMS.", icon: Layers },
                { title: "Reference and training datasets", copy: "Use source-traced sample cases for familiarization before importing or editing project data.", icon: BookOpen },
                { title: "Professional outputs", copy: "Generate decision-support reports and material specifications with engineering review wording.", icon: FileText },
              ].map((item) => (
                <div key={item.title} className="rounded-md border border-border bg-background/55 p-3">
                  <div className="flex items-start gap-3">
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.title}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
