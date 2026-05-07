import { useMemo, useState } from "react";
import { AlertTriangle, Info, Pencil, RotateCcw, ShieldCheck, Star } from "lucide-react";
import {
  buildValveClassTable,
  type ClassValveType,
  type ValveClassRow,
  type WaferSubtype,
} from "../designInputs/valveClassTableEngine";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  pipeMaterial: string;
  serviceType: string;
  corrosionSeverity: string;
  designTemperature: string;
  designPressure: string;
  serviceDescription?: string;
  flangeClass?: string;
}

type FieldKey = "body" | "trim" | "seat";

interface OverrideRecord {
  recommended: string;
  override: string;
  reason: string;
}

type OverrideMap = Partial<Record<ClassValveType, Partial<Record<FieldKey, OverrideRecord>>>>;

const FIELD_LABEL: Record<FieldKey, string> = {
  body: "Body",
  trim: "Trim",
  seat: "Seat",
};

export function ValveClassTable(props: Props) {
  const [waferSubtype, setWaferSubtype] = useState<WaferSubtype | undefined>();
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [editing, setEditing] = useState<{
    valve: ClassValveType;
    field: FieldKey;
    recommended: string;
    alternatives: string[];
  } | null>(null);
  const [draftValue, setDraftValue] = useState("");
  const [draftReason, setDraftReason] = useState("");

  const result = useMemo(
    () => buildValveClassTable({ ...props, waferSubtype }),
    [props, waferSubtype],
  );

  const applyValue = (row: ValveClassRow, field: FieldKey): string =>
    overrides[row.valveType]?.[field]?.override ?? (row as any)[field];

  const isOverridden = (row: ValveClassRow, field: FieldKey) =>
    !!overrides[row.valveType]?.[field];

  const openOverride = (vt: ClassValveType, field: FieldKey, recommended: string, alts: string[]) => {
    setEditing({ valve: vt, field, recommended, alternatives: alts });
    setDraftValue(overrides[vt]?.[field]?.override ?? recommended);
    setDraftReason(overrides[vt]?.[field]?.reason ?? "");
  };

  const saveOverride = () => {
    if (!editing || !draftValue.trim() || !draftReason.trim()) return;
    setOverrides(prev => ({
      ...prev,
      [editing.valve]: {
        ...prev[editing.valve],
        [editing.field]: {
          recommended: editing.recommended,
          override: draftValue.trim(),
          reason: draftReason.trim(),
        },
      },
    }));
    setEditing(null);
  };

  const clearOverride = (vt: ClassValveType, field: FieldKey) => {
    setOverrides(prev => {
      const next = { ...prev };
      const row = { ...(next[vt] || {}) };
      delete row[field];
      if (Object.keys(row).length === 0) delete next[vt];
      else next[vt] = row;
      return next;
    });
  };

  const renderMaterialChoice = (row: ValveClassRow, field: FieldKey, compact = false) => {
    const val = applyValue(row, field);
    const ovr = isOverridden(row, field);
    const alts = (row as any)[`${field}Alternatives`] as string[];
    const label = FIELD_LABEL[field];

    return (
      <div className={`rounded-md border p-2 ${ovr ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-background/40"}`}>
        <div className="flex items-start gap-2">
          {!ovr ? (
            <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-[hsl(var(--success))] text-[hsl(var(--success))]" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openOverride(row.valveType, field, (row as any)[field], alts)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-primary hover:bg-primary/10"
                  title={`Override ${label.toLowerCase()} for ${row.valveType}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {ovr && (
                  <button
                    type="button"
                    onClick={() => clearOverride(row.valveType, field)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary"
                    title={`Reset ${label.toLowerCase()} for ${row.valveType}`}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className={`${compact ? "text-xs" : "text-[11px]"} leading-snug ${ovr ? "font-medium text-amber-500" : "text-foreground"}`}>
              {val}
            </div>
            {ovr && (
              <div className="mt-1 space-y-0.5 text-[10px] leading-snug text-muted-foreground">
                <div className="line-through">{(row as any)[field]}</div>
                <div>Reason: {overrides[row.valveType]?.[field]?.reason}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFlags = (row: ValveClassRow) => (
    row.reviewFlags.length === 0 ? (
      <div className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--success))]/25 bg-[hsl(var(--success))]/10 px-2 py-1 text-[10px] font-medium text-[hsl(var(--success))]">
        <ShieldCheck className="h-3 w-3" />
        No flags
      </div>
    ) : (
      <div className="space-y-1">
        {row.reviewFlags.map((f, i) => (
          <div key={i} className="flex items-start gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 p-2 text-[10px] leading-snug text-amber-500">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
    )
  );

  return (
    <div className="eng-card space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold">Valve Class Table</h3>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-md border border-border bg-secondary/50 px-2 py-1">Family: <span className="font-mono text-foreground">{result.pmsEnvelope.family}</span></span>
            <span className="rounded-md border border-border bg-secondary/50 px-2 py-1">Class {result.pmsEnvelope.flangeClass}#</span>
            <span className="rounded-md border border-border bg-secondary/50 px-2 py-1">{result.pmsEnvelope.tempC}C @ {result.pmsEnvelope.pressureBar} bar</span>
            <span className="rounded-md border border-border bg-secondary/50 px-2 py-1">Service: {result.pmsEnvelope.severity.join(", ")}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 p-2">
          <Label className="shrink-0 text-[10px] font-semibold uppercase text-muted-foreground">Wafer subtype</Label>
          <select
            value={waferSubtype ?? ""}
            onChange={e => setWaferSubtype((e.target.value || undefined) as WaferSubtype | undefined)}
            className="min-h-9 w-full rounded border border-border bg-secondary px-2 py-1 text-xs text-foreground sm:w-auto"
          >
            <option value="">select</option>
            <option>Wafer Check</option>
            <option>Wafer Butterfly</option>
            <option>Other Wafer Pattern</option>
          </select>
        </div>
      </div>

      {result.globalWarnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-500">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{result.globalWarnings.join(" ")}</div>
        </div>
      )}

      <div className="hidden overflow-hidden rounded-md border border-border md:block">
        <table className="w-full table-fixed text-[11px]">
          <thead className="bg-secondary/70 text-muted-foreground">
            <tr>
              <th className="w-[18%] p-3 text-left font-semibold">Valve</th>
              <th className="w-[36%] p-3 text-left font-semibold">Material Selection</th>
              <th className="w-[16%] p-3 text-left font-semibold">Ends / Rating</th>
              <th className="w-[18%] p-3 text-left font-semibold">Basis / Standards</th>
              <th className="w-[12%] p-3 text-left font-semibold">Review</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map(row => (
              <tr key={row.valveType} className="border-t border-border align-top odd:bg-background/20 even:bg-secondary/15">
                <td className="p-3">
                  <div className="font-semibold text-foreground">{row.valveType}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono text-[10px]">{row.npsRange}</span>
                    {row.requiresSubtype && <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500">Subtype required</span>}
                  </div>
                  {row.scopeNote && (
                    <div className="mt-2 flex items-start gap-1 text-[10px] font-normal leading-snug text-muted-foreground">
                      <Info className="mt-0.5 h-3 w-3 shrink-0" />
                      {row.scopeNote}
                    </div>
                  )}
                </td>
                <td className="space-y-2 p-3">
                  {(["body", "trim", "seat"] as FieldKey[]).map(field => (
                    <div key={field}>{renderMaterialChoice(row, field)}</div>
                  ))}
                </td>
                <td className="p-3">
                  <div className="font-medium text-foreground">{row.ends}</div>
                  <div className="mt-2 rounded-md border border-border bg-background/50 p-2 font-mono text-[10px] text-muted-foreground">{row.ratingClass}</div>
                </td>
                <td className="space-y-2 p-3 text-[10px] leading-snug text-muted-foreground">
                  <div>{row.basis}</div>
                  <div className="rounded-md border border-border bg-background/50 p-2">{row.applicableStandard}</div>
                </td>
                <td className="p-3">{renderFlags(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {result.rows.map(row => (
          <div key={row.valveType} className="rounded-md border border-border bg-secondary/15 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-foreground">{row.valveType}</div>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono">{row.npsRange}</span>
                  <span className="rounded border border-border bg-background/60 px-1.5 py-0.5">{row.ratingClass}</span>
                </div>
              </div>
              {row.requiresSubtype && <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-500">Review</span>}
            </div>

            <div className="mt-3 rounded-md border border-border bg-background/40 p-2">
              <div className="text-[10px] font-semibold uppercase text-muted-foreground">Ends</div>
              <div className="mt-0.5 text-xs text-foreground">{row.ends}</div>
            </div>

            <div className="mt-3 space-y-2">
              {(["body", "trim", "seat"] as FieldKey[]).map(field => (
                <div key={field}>{renderMaterialChoice(row, field, true)}</div>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <div className="rounded-md border border-border bg-background/40 p-2 text-[11px] leading-relaxed text-muted-foreground">{row.basis}</div>
              <div className="rounded-md border border-border bg-background/40 p-2 text-[10px] leading-relaxed text-muted-foreground">{row.applicableStandard}</div>
              {row.scopeNote && (
                <div className="flex items-start gap-1 rounded-md border border-border bg-background/40 p-2 text-[10px] leading-snug text-muted-foreground">
                  <Info className="mt-0.5 h-3 w-3 shrink-0" />
                  {row.scopeNote}
                </div>
              )}
              {renderFlags(row)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <Star className="h-3 w-3 fill-[hsl(var(--success))] text-[hsl(var(--success))]" />
        = Recommended choice. Material overrides require a reason.
      </div>

      <Dialog open={!!editing} onOpenChange={open => !open && setEditing(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Override {editing?.field} - {editing?.valve}</DialogTitle>
            <DialogDescription>
              Recommended: <span className="font-mono text-[hsl(var(--success))]">{editing?.recommended}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">New value</Label>
              <Input
                list="alt-options"
                value={draftValue}
                onChange={e => setDraftValue(e.target.value)}
                className="mt-1"
              />
              <datalist id="alt-options">
                {editing?.alternatives.map(a => <option key={a} value={a} />)}
              </datalist>
              {editing && editing.alternatives.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {editing.alternatives.map(a => (
                    <button
                      key={a}
                      onClick={() => setDraftValue(a)}
                      className="rounded border border-border px-2 py-1 text-[10px] hover:bg-secondary"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Reason for override</Label>
              <textarea
                value={draftReason}
                onChange={e => setDraftReason(e.target.value)}
                rows={3}
                className="mt-1 min-h-24 w-full rounded border border-border bg-secondary px-3 py-2 text-xs text-foreground"
                placeholder="Project spec, client requirement, or service condition driving the change."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveOverride} disabled={!draftValue.trim() || !draftReason.trim()}>
              Save Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
