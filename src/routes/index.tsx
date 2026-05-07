import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  pressureDesignThickness, mawpFromThickness,
  MATERIALS, NPS_OD, fmt, type Units,
} from "@/lib/b313";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PipePro · ASME B31.3 Design Assistant" },
      { name: "description", content: "Process piping wall thickness, MAWP, and design checks per ASME B31.3 §304.1.2." },
    ],
  }),
  component: Index,
});

function Index() {
  const [units, setUnits] = useState<Units>("us");
  const isUS = units === "us";

  const [matId, setMatId] = useState(MATERIALS[0].id);
  const mat = MATERIALS.find(m => m.id === matId)!;

  const [npsId, setNpsId] = useState("6");
  const nps = NPS_OD.find(n => n.nps === npsId)!;
  const D = isUS ? nps.in : nps.mm;

  const [P, setP] = useState(isUS ? 600 : 4.14);
  const [E, setE] = useState(1.0);
  const [W, setW] = useState(1.0);
  const [Y, setY] = useState(mat.Y);
  const [c, setC] = useState(isUS ? 0.0625 : 1.6);
  const [tol, setTol] = useState(12.5);
  const [tNom, setTNom] = useState(isUS ? 0.28 : 7.11);

  const S = isUS ? mat.S_us : mat.S_si;

  const result = useMemo(() => pressureDesignThickness({
    P, D, S, E, W, Y, c, millTolerance: tol,
  }), [P, D, S, E, W, Y, c, tol]);

  const mawp = useMemo(() =>
    mawpFromThickness(tNom, c, tol, D, S, E, W, Y),
    [tNom, c, tol, D, S, E, W, Y]
  );

  const uP = isUS ? "psi" : "MPa";
  const uL = isUS ? "in" : "mm";

  function swap(u: Units) {
    if (u === units) return;
    // convert numeric inputs
    const toSI = u === "si";
    setUnits(u);
    setP(v => toSI ? v * 0.00689476 : v / 0.00689476);
    setC(v => toSI ? v * 25.4 : v / 25.4);
    setTNom(v => toSI ? v * 25.4 : v / 25.4);
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "var(--gradient-glow)" }} />
      <header className="relative border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <div className="mono text-xs uppercase tracking-[0.3em] text-muted-foreground">PipePro · b31.3</div>
              <h1 className="text-lg font-semibold">Process Piping Design Assistant</h1>
            </div>
          </div>
          <div className="mono text-[11px] flex rounded-md border border-border overflow-hidden">
            <button onClick={() => swap("us")}
              className={`px-3 py-1.5 ${isUS ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              US
            </button>
            <button onClick={() => swap("si")}
              className={`px-3 py-1.5 ${!isUS ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              SI
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-6 py-10 grid lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <section className="lg:col-span-3 rounded-xl p-6 border border-border" style={{ background: "var(--gradient-panel)", boxShadow: "var(--shadow-elev)" }}>
          <SectionTitle index="01" title="Design Inputs" subtitle="ASME B31.3 §304.1.2 — Eq. (3a)" />

          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <Select label="Material" value={matId} onChange={v => { setMatId(v); const m = MATERIALS.find(x=>x.id===v)!; setY(m.Y); }}
              options={MATERIALS.map(m => ({ value: m.id, label: `${m.grade}` }))} />
            <Select label="Pipe size (NPS)" value={npsId} onChange={setNpsId}
              options={NPS_OD.map(n => ({ value: n.nps, label: `${n.nps}  ·  OD ${isUS ? n.in.toFixed(3)+'"' : n.mm.toFixed(1)+' mm'}` }))} />
            <Field label={`Design pressure P`} unit={uP} value={P} onChange={setP} step={isUS ? 10 : 0.1} />
            <Field label="Quality factor E" value={E} onChange={setE} step={0.05} hint="Casting/longitudinal" />
            <Field label="Weld factor W" value={W} onChange={setW} step={0.05} hint="≥ 950°F derating" />
            <Field label="Coefficient Y" value={Y} onChange={setY} step={0.01} hint="Table 304.1.1" />
            <Field label="Allowance c" unit={uL} value={c} onChange={setC} step={isUS ? 0.01 : 0.1} hint="Corrosion + threads" />
            <Field label="Mill tolerance" unit="%" value={tol} onChange={setTol} step={0.5} />
          </div>

          <div className="mt-8 rounded-lg border border-border bg-background/40 p-4">
            <div className="mono text-[11px] uppercase tracking-widest text-muted-foreground">Equation 3a</div>
            <div className="mono mt-2 text-foreground/90">
              t = (P · D) / (2 · (S·E·W + P·Y))
            </div>
            <div className="mono text-[11px] text-muted-foreground mt-2">
              S = {fmt(S, isUS ? 0 : 1)} {uP}   ·   D = {fmt(D, isUS ? 3 : 1)} {uL}
            </div>
          </div>
        </section>

        {/* Results */}
        <aside className="lg:col-span-2 space-y-4">
          <ResultCard
            label="Pressure design thickness"
            symbol="t"
            value={fmt(result.t, isUS ? 4 : 3)}
            unit={uL}
            tone="primary"
          />
          <ResultCard
            label="Min. required (t + c)"
            symbol="tm"
            value={fmt(result.tm, isUS ? 4 : 3)}
            unit={uL}
          />
          <ResultCard
            label="Nominal w/ mill tolerance"
            symbol="tnom"
            value={fmt(result.tNom, isUS ? 4 : 3)}
            unit={uL}
            tone="accent"
          />

          <div className="rounded-xl border border-border p-5 bg-card">
            <div className="flex items-center justify-between">
              <div className="mono text-[11px] uppercase tracking-widest text-muted-foreground">Validity</div>
              <span className={`mono text-[11px] px-2 py-0.5 rounded ${result.highPressure ? "bg-destructive/20 text-destructive" : "bg-[oklch(0.82_0.20_145/0.15)] text-[oklch(0.82_0.20_145)]"}`}>
                {result.highPressure ? "t ≥ D/6 — review §304.1.2(b)" : "Standard range"}
              </span>
            </div>
            <div className="mt-3 mono text-sm">t / D = {fmt(result.ratio, 4)}</div>
          </div>

          <div className="rounded-xl border border-border p-5 bg-card">
            <SectionTitle index="02" title="MAWP Check" subtitle="Reverse from nominal t" small />
            <Field label="Nominal thickness" unit={uL} value={tNom} onChange={setTNom} step={isUS ? 0.01 : 0.1} />
            <div className="mt-4 flex items-baseline justify-between">
              <span className="mono text-[11px] uppercase tracking-widest text-muted-foreground">MAWP</span>
              <span className="mono text-2xl text-[oklch(0.82_0.20_145)]">{fmt(mawp, isUS ? 1 : 3)} <span className="text-sm text-muted-foreground">{uP}</span></span>
            </div>
          </div>
        </aside>
      </main>

      <footer className="relative border-t border-border mt-10">
        <div className="max-w-6xl mx-auto px-6 py-6 mono text-[11px] text-muted-foreground flex flex-wrap gap-4 justify-between">
          <span>For preliminary design only — verify per current ASME B31.3 edition.</span>
          <span>v0.1 · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="relative w-10 h-10 rounded-md border border-border grid place-items-center bg-background overflow-hidden">
      <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-panel)" }} />
      <svg viewBox="0 0 24 24" className="relative w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M2 12h6a4 4 0 0 1 4-4V2" />
        <path d="M22 12h-6a4 4 0 0 0-4 4v6" />
        <circle cx="12" cy="12" r="2.2" />
      </svg>
    </div>
  );
}

function SectionTitle({ index, title, subtitle, small }: { index: string; title: string; subtitle?: string; small?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="mono text-[11px] text-primary">{index}</span>
      <div>
        <h2 className={small ? "text-sm font-semibold" : "text-base font-semibold"}>{title}</h2>
        {subtitle && <div className="mono text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
}

function Field({ label, unit, value, onChange, step = 1, hint }: {
  label: string; unit?: string; value: number; onChange: (n: number) => void; step?: number; hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && <span className="mono text-[10px] text-muted-foreground/70">{hint}</span>}
      </div>
      <div className="mt-1 flex items-center rounded-md border border-border bg-input/40 focus-within:border-primary transition">
        <input
          type="number"
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="mono w-full bg-transparent px-3 py-2 text-sm outline-none"
        />
        {unit && <span className="mono text-[11px] text-muted-foreground pr-3">{unit}</span>}
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="mt-1 rounded-md border border-border bg-input/40 focus-within:border-primary transition">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mono w-full bg-transparent px-3 py-2 text-sm outline-none appearance-none"
        >
          {options.map(o => <option key={o.value} value={o.value} className="bg-background">{o.label}</option>)}
        </select>
      </div>
    </label>
  );
}

function ResultCard({ label, symbol, value, unit, tone }: {
  label: string; symbol: string; value: string; unit: string; tone?: "primary" | "accent";
}) {
  const color =
    tone === "primary" ? "text-primary" :
    tone === "accent"  ? "text-accent" :
    "text-foreground";
  return (
    <div className="rounded-xl border border-border p-5 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 mono text-[10px] text-muted-foreground/60 px-2 py-1">{symbol}</div>
      <div className="mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-2 mono text-3xl ${color}`}>
        {value}
        <span className="text-sm text-muted-foreground ml-2">{unit}</span>
      </div>
    </div>
  );
}
