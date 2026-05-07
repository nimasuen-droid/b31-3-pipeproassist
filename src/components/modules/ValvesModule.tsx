import { useState, useMemo } from "react";
import { ValveClassTable } from "./valves/ValveClassTable";
import { useDesignInputs } from "@/stores/designInputsStore";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { ReferenceBadge } from "../ReferenceBadge";
import { CodeReferencePopup } from "../CodeReferencePopup";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle, CheckCircle2, Info, XCircle, BookOpen,
  ChevronDown, ChevronUp, Settings2, ShieldCheck, Flame,
  Thermometer, Droplets, Gauge, Ruler,
} from "lucide-react";
import {
  getValveRecommendations,
  defaultRefinement,
  type ValveRefinement,
  type ValveFunction,
  type ServiceRecommendation,
  type BoreType,
  type SeatType,
  type ActuationType,
} from "./designInputs/valveSelectionEngine";

// ── Service Recommendation Card ──

function RecCard({
  rec,
  icon: Icon,
  accentClass,
}: {
  rec: ServiceRecommendation;
  icon: React.ElementType;
  accentClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const hasWarnings = rec.warnings.length > 0;
  const accent = accentClass || "text-primary";

  return (
    <div className="eng-card border-border">
      <button
        className="w-full flex items-start gap-2 text-left"
        onClick={() => setOpen(!open)}
      >
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${accent}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">{rec.label}</span>
            {open ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
          </div>
          <div className="text-sm font-semibold text-foreground mt-0.5">{rec.value}</div>
        </div>
      </button>

      {open && (
        <div className="mt-2.5 space-y-2 border-t border-border pt-2.5 ml-6">
          {/* Why */}
          <div className="bg-secondary/50 rounded p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase">Why</span>
            </div>
            <p className="text-xs text-foreground leading-relaxed">{rec.why}</p>
          </div>

          {/* Reference — click to see what the section actually says */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
            <span className="font-medium">Reference:</span>
            <CodeReferencePopup
              reference={rec.reference}
              section={rec.referenceSection}
              context={rec.why}
            />
            {rec.referenceSection && (
              <span className="text-muted-foreground">— {rec.referenceSection}</span>
            )}
          </div>

          {/* Warnings */}
          {hasWarnings && (
            <div className="flex items-start gap-1.5 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{rec.warnings.join("; ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tier styles for valve types ──

const TIER_STYLES: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  "Recommended": { icon: CheckCircle2, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5", border: "border-[hsl(var(--success))]/20" },
  "Alternative": { icon: Info, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/20" },
  "Not Suitable": { icon: XCircle, color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20" },
};

// ── Main Module ──

export function ValvesModule() {
  const { inputs, recommendations, activePipeMaterial, calculated } = useDesignInputs();
  const [refinement, setRefinement] = useState<ValveRefinement>({ ...defaultRefinement });
  const [showRefinement, setShowRefinement] = useState(false);
  const [showTypes, setShowTypes] = useState(false);

  const result = useMemo(() => {
    if (!calculated) return null;
    return getValveRecommendations({
      pipeMaterial: activePipeMaterial,
      serviceType: inputs.serviceType,
      corrosionSeverity: inputs.corrosionSeverity,
      designTemperature: inputs.designTemperature,
      designPressure: inputs.designPressure,
      nominalPipeSize: inputs.nominalPipeSize,
      serviceDescription: inputs.serviceDescription,
      refinement,
    });
  }, [calculated, activePipeMaterial, inputs.serviceType, inputs.corrosionSeverity,
    inputs.designTemperature, inputs.designPressure, inputs.nominalPipeSize,
    inputs.serviceDescription, refinement]);

  if (!calculated) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Valve Design Guide</h2>
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Go to <strong>Inputs</strong> tab, complete design conditions and material, then click <strong>Calculate & Recommend</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { serviceRecs: s } = result;

  const updateRefinement = <K extends keyof ValveRefinement>(key: K, value: ValveRefinement[K]) =>
    setRefinement(prev => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Valve Design Guide</h2>
        <p className="text-sm text-muted-foreground">
          Service-driven recommendations per ASME B16.34 / API 600 / 602 / 608 • {result.family} System
        </p>
      </div>

      {/* ── Material Recommendations ── */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Material & Trim Recommendations
        </h3>
        <p className="text-[10px] text-muted-foreground mb-2">
          Click any card to see <strong>Why</strong> this was recommended and the governing reference.
        </p>
        <div className="space-y-1.5">
          <RecCard rec={s.body} icon={Gauge} />
          <RecCard rec={s.trim} icon={Settings2} />
          <RecCard rec={s.seat} icon={ShieldCheck} />
          <RecCard rec={s.packing} icon={Droplets} />
        </div>
      </div>

      {/* ── Service Classification Recommendations ── */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-amber-500" />
          Service Flags & Requirements
        </h3>
        <div className="space-y-1.5">
          <RecCard rec={s.fireSafe} icon={Flame} accentClass={result.autoRefinement.fireSafe ? "text-amber-500" : "text-muted-foreground"} />
          <RecCard rec={s.criticalService} icon={ShieldCheck} accentClass={result.autoRefinement.criticalService ? "text-destructive" : "text-muted-foreground"} />
          <RecCard rec={s.corrosive} icon={Droplets} accentClass={result.autoRefinement.corrosiveService ? "text-amber-500" : "text-muted-foreground"} />
          <RecCard rec={s.highTemp} icon={Thermometer} accentClass={result.autoRefinement.highTemperature ? "text-destructive" : "text-muted-foreground"} />
        </div>
      </div>

      {/* ── Size & Bore ── */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Ruler className="h-4 w-4 text-primary" />
          Size & Bore Guidance
        </h3>
        <div className="space-y-1.5">
          <RecCard rec={s.sizeRange} icon={Ruler} />
          <RecCard rec={s.bore} icon={Gauge} />
        </div>
      </div>

      {/* ── Override / Refinement Panel ── */}
      <div className="eng-card border-border">
        <button
          onClick={() => setShowRefinement(!showRefinement)}
          className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5" />
            <span>Manual Overrides</span>
            <span className="text-[9px] text-muted-foreground">(override auto-recommendations)</span>
          </div>
          {showRefinement ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showRefinement && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium">Function</label>
              <select
                value={refinement.valveFunction}
                onChange={e => updateRefinement("valveFunction", e.target.value as ValveFunction)}
                className="mt-1 w-full text-xs bg-secondary border border-border rounded px-2 py-1.5"
              >
                <option>On/Off</option>
                <option>Throttle</option>
                <option>Non-Return</option>
                <option>Control</option>
                <option>Vent/Drain</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium">Bore</label>
              <select
                value={refinement.boreType}
                onChange={e => updateRefinement("boreType", e.target.value as BoreType)}
                className="mt-1 w-full text-xs bg-secondary border border-border rounded px-2 py-1.5"
              >
                <option>Full Bore</option>
                <option>Reduced Bore</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium">Seat</label>
              <select
                value={refinement.seatType}
                onChange={e => updateRefinement("seatType", e.target.value as SeatType)}
                className="mt-1 w-full text-xs bg-secondary border border-border rounded px-2 py-1.5"
              >
                <option>Soft Seat</option>
                <option>Metal Seat</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase font-medium">Actuation</label>
              <select
                value={refinement.actuationType}
                onChange={e => updateRefinement("actuationType", e.target.value as ActuationType)}
                className="mt-1 w-full text-xs bg-secondary border border-border rounded px-2 py-1.5"
              >
                <option>Manual</option>
                <option>Gear Operated</option>
                <option>Pneumatic</option>
                <option>Electric</option>
                <option>Hydraulic</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-3 flex flex-wrap gap-4 mt-1">
              <CheckOption label="Fire-Safe" checked={refinement.fireSafe} onChange={v => updateRefinement("fireSafe", v)} />
              <CheckOption label="Critical Service" checked={refinement.criticalService} onChange={v => updateRefinement("criticalService", v)} />
              <CheckOption label="Corrosive" checked={refinement.corrosiveService} onChange={v => updateRefinement("corrosiveService", v)} />
              <CheckOption label="High Temperature" checked={refinement.highTemperature} onChange={v => updateRefinement("highTemperature", v)} />
            </div>
          </div>
        )}
      </div>

      {/* ── Valve Types (collapsible) ── */}
      <div className="eng-card border-border">
        <button
          onClick={() => setShowTypes(!showTypes)}
          className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span>Valve Type Selection Guide</span>
          </div>
          {showTypes ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showTypes && (
          <div className="mt-3 space-y-1.5">
            {result.traces.valveType && (
              <div className="flex items-center gap-2 mb-1">
                <ReferenceBadge trace={result.traces.valveType} />
                <span className="text-[10px] text-muted-foreground">Source traceability</span>
              </div>
            )}
            {result.typeRecommendations.map(rec => {
              const style = TIER_STYLES[rec.tier];
              const Icon = style.icon;
              return (
                <div key={rec.type} className={`rounded border px-3 py-2 text-xs ${style.border} ${style.bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                    <span className="font-medium">{rec.type}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${style.color} ${style.border}`}>{rec.tier}</span>
                    <span className="text-muted-foreground ml-auto hidden md:inline">{rec.npsRange}</span>
                  </div>
                  <p className="text-muted-foreground mt-1 leading-relaxed">{rec.reason}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Valve Class Table (PMS-driven, per-type recommendations) ── */}
      <ValveClassTable
        pipeMaterial={activePipeMaterial}
        serviceType={inputs.serviceType}
        corrosionSeverity={inputs.corrosionSeverity}
        designTemperature={inputs.designTemperature}
        designPressure={inputs.designPressure}
        serviceDescription={inputs.serviceDescription}
        flangeClass={recommendations.flangeClass?.value}
      />

      <LearningMoment
        title="Body may be common, but trim & seat must vary by valve type"
        principle="In a piping material class, body material may be consistent, but trim and seat selection vary by valve type due to different sealing mechanisms and functional requirements. Gate/Globe/Check valves seal metal-to-metal and require hardfaced trim (e.g. 13Cr / Stellite). Ball valves can use soft seats (PTFE/RPTFE) for bubble-tight low-temperature shutoff, with fire-safe secondary metal seats per API 607 where required."
        reference="ASME B16.34 • API 600 / 602 / 608 / 623 / 594 • API 607 (fire-safe) • NACE MR0175"
      />

      <LearningMoment
        title="PMS envelope drives material; valve type narrows the choice"
        principle="The design basis defines the acceptable material envelope. Valve type then filters the acceptable body, trim, and seat options based on mechanical design, sealing method, leakage requirement, and service suitability."
        reference="ASME B16.34 • API 600 / 602 / 608 / 594 • API 607 (fire-safe) • NACE MR0175"
      />

      <LearningMoment
        title="Matching valve type to service"
        principle="Valves are chosen by function, not just size. Gate/ball valves are isolation devices — designed for fully open or fully closed; throttling them erodes the seat. Globe valves throttle and control flow because the disc moves perpendicular to the seat. Check valves prevent reverse flow. Body and trim materials must survive the fluid (e.g. 316 SS for chlorides, Monel for HF) at temperature; soft seats (PTFE) bubble-tight at low T but creep at high T, so metal seats take over. Packing material limits leakage to atmosphere — graphite for hydrocarbons, PTFE for clean utilities."
        reference="API 600/602/6D • ASME B16.34 valve pressure-temperature ratings"
      />

      <EngineeringDisclaimer />
    </div>
  );
}

function CheckOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
      <Checkbox checked={checked} onCheckedChange={v => onChange(v === true)} className="h-3.5 w-3.5" />
      {label}
    </label>
  );
}
