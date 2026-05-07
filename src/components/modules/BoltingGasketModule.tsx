import { useDesignInputs } from "@/stores/designInputsStore";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { LearningMoment } from "../LearningMoment";
import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { TeachBadge } from "../TeachBadge";
import { getBoltAssembly } from "./designInputs/boltingGasketEngine";
import { normalizeNpsForPicker } from "@/lib/nps";

export function BoltingGasketModule() {
  const { inputs, recommendations, calculated } = useDesignInputs();

  if (!calculated) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Bolting & Gasket</h2>
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              Go to <strong>Inputs</strong>, complete the design conditions and material, then calculate recommendations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const flangeClass = recommendations.flangeClass?.value || "";
  const nps = normalizeNpsForPicker(inputs.nominalPipeSize);
  const boltInfo = getBoltAssembly(flangeClass, nps);
  const boltParts = recommendations.boltMaterial.value.split(" / ");
  const studMaterial = boltParts[0] || recommendations.boltMaterial.value;
  const nutMaterial = boltParts[1] || "A194 2H";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Bolting & Gasket</h2>
        <p className="text-sm text-muted-foreground">
          ASME B16.5 / B16.20 joint assembly - Class {flangeClass || "-"} - NPS {nps || "-"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="eng-card border-primary/20 bg-primary/5">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Stud / Nut Material</span>
          </div>
          <div className="text-sm font-mono font-semibold">
            {recommendations.boltMaterial.value} <TeachBadge materialId={recommendations.boltMaterial.value} label="Why?" />
          </div>
        </div>

        <div className="eng-card border-primary/20 bg-primary/5">
          <div className="mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Gasket Selection</span>
          </div>
          <div className="text-sm font-mono font-semibold">{recommendations.gasketType.value}</div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{recommendations.gasketType.reason}</p>
          <div className="mt-1 text-[9px] font-mono text-primary">{recommendations.gasketType.source}</div>
        </div>

        <div className="eng-card">
          <div className="eng-label mb-2">Gasket Specification</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div><span className="text-muted-foreground">Standard</span><div className="font-mono text-foreground">ASME B16.20</div></div>
            <div><span className="text-muted-foreground">Class</span><div className="font-mono text-foreground">{flangeClass || "-"}</div></div>
            <div><span className="text-muted-foreground">NPS</span><div className="font-mono text-foreground">{nps || "-"}</div></div>
            <div><span className="text-muted-foreground">Facing</span><div className="font-mono text-foreground">{recommendations.flangeFacing.value}</div></div>
          </div>
        </div>
      </div>

      {boltInfo ? (
        <div className="eng-card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="eng-label">Bolt Assembly</div>
              <div className="text-[10px] text-muted-foreground">{boltInfo.source}, Appendix E excerpt</div>
            </div>
            <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
              Verified lookup
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              ["Stud Size", boltInfo.boltSize],
              ["Bolt Count", String(boltInfo.boltCount)],
              ["Bolt Length", boltInfo.boltLength],
              ["Nut", boltInfo.nutType],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border bg-secondary/30 p-3">
                <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
                <div className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="eng-card border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Bolt dimensional lookup is not loaded for Class {flangeClass || "?"} NPS {nps || "?"}. Do not infer bolt size from nearby classes; import or verify the applicable ASME B16.5 Appendix E table before issuing a BOM.
            </p>
          </div>
        </div>
      )}

      {boltInfo && (
        <div className="eng-card">
          <div className="eng-label mb-3">Joint Assembly BOM</div>
          <div className="table-scroll">
            <table className="eng-table min-w-[520px] text-[11px]">
              <thead>
                <tr><th>Item</th><th>Description</th><th>Qty</th><th>Material</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Stud Bolt {boltInfo.boltSize} x {boltInfo.boltLength}</td>
                  <td className="font-mono">{boltInfo.boltCount}</td>
                  <td className="font-mono">{studMaterial}</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>{boltInfo.nutType} Nut {boltInfo.boltSize}</td>
                  <td className="font-mono">{boltInfo.boltCount * 2}</td>
                  <td className="font-mono">{nutMaterial}</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Gasket NPS {nps} Class {flangeClass}</td>
                  <td className="font-mono">1</td>
                  <td className="font-mono">{recommendations.gasketType.value}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LearningMoment
        title="Why these bolts and this gasket?"
        principle="A bolted joint works only if the bolt clamping force exceeds the hydrostatic end force trying to separate the flanges, plus enough residual load to keep the gasket compressed. Higher pressure classes need more or larger studs. Spiral-wound gaskets suit raised-face process flanges; RTJ rings are used where the selected facing and pressure class require metal-to-metal seating."
        reference="ASME B16.5 Table E-1; ASME B16.20; ASME PCC-1"
      />

      <EngineeringDisclaimer />
    </div>
  );
}
