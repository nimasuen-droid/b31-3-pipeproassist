import { useState } from "react";
import { BookOpen, X, ChevronDown, ChevronUp, GraduationCap, Lightbulb, AlertTriangle, ExternalLink } from "lucide-react";
import { useLearningMode } from "@/stores/learningMode";
import { getCodeReference, type CodeReference } from "./modules/designInputs/codeReferenceDatabase";
import { getMaterialLesson, type MaterialLesson } from "./modules/designInputs/materialTeachingDatabase";
import { getCalculationLesson, type CalculationLesson } from "./modules/designInputs/calculationTeachingDatabase";

/** Clickable badge that opens a deep-dive teaching modal for a code reference, material, or calculation */
export function TeachBadge({ refId, materialId, calcId, label }: {
  refId?: string; materialId?: string; calcId?: string; label?: string;
}) {
  const [open, setOpen] = useState(false);
  const { enabled: learningMode } = useLearningMode();

  const codeRef = refId ? getCodeReference(refId) : null;
  const matLesson = materialId ? getMaterialLesson(materialId) : null;
  const calcLesson = calcId ? getCalculationLesson(calcId) : null;
  const hasContent = codeRef || matLesson || calcLesson;

  if (!hasContent) return null;

  const displayLabel = label || codeRef?.section || matLesson?.designation || calcLesson?.title || "Learn";

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex min-h-10 items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer shrink-0 ${
          learningMode
            ? "bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25"
            : "bg-primary/10 text-primary hover:bg-primary/20"
        }`}
        title={`Learn: ${displayLabel}`}
      >
        <GraduationCap className="h-2.5 w-2.5" />
        {displayLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold truncate">{displayLabel}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {codeRef && <CodeReferenceContent codeRef={codeRef} />}
              {matLesson && <MaterialLessonContent lesson={matLesson} />}
              {calcLesson && <CalcLessonContent lesson={calcLesson} />}
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

function CodeReferenceContent({ codeRef: r }: { codeRef: CodeReference }) {
  return (
    <div className="space-y-3">
      <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
        <div className="text-[10px] text-primary font-mono font-medium">{r.standard} {r.section}</div>
        <div className="text-sm font-semibold mt-1">{r.title}</div>
        <p className="text-xs text-muted-foreground mt-1">{r.summary}</p>
      </div>

      <CollapsibleSection title="Code Content (Paraphrased)" defaultOpen>
        <p className="text-xs leading-relaxed">{r.fullText}</p>
      </CollapsibleSection>

      <CollapsibleSection title="How This App Uses This Section" defaultOpen>
        <p className="text-xs leading-relaxed">{r.application}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Engineering Lesson" icon={<Lightbulb className="h-3 w-3 text-accent" />} highlight>
        <p className="text-xs leading-relaxed">{r.lesson}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Key Points">
        <ul className="space-y-1">
          {r.keyPoints.map((p, i) => (
            <li key={i} className="text-xs flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span>{p}
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {r.relatedSections.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          <span className="font-medium">Related: </span>
          {r.relatedSections.join(", ")}
        </div>
      )}
    </div>
  );
}

function MaterialLessonContent({ lesson: m }: { lesson: MaterialLesson }) {
  return (
    <div className="space-y-3">
      <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
        <div className="text-sm font-mono font-semibold">{m.designation}</div>
        <div className="text-xs text-muted-foreground">{m.commonName}</div>
        <div className="text-[10px] font-mono text-primary mt-1">{m.astmSpec}</div>
      </div>

      <CollapsibleSection title="Why This Material?" defaultOpen>
        <p className="text-xs leading-relaxed">{m.whySelected}</p>
      </CollapsibleSection>

      <CollapsibleSection title="When to Use">
        <ul className="space-y-1">{m.whenToUse.map((w, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-green-600 mt-0.5">✓</span>{w}</li>)}</ul>
      </CollapsibleSection>

      <CollapsibleSection title="When NOT to Use" icon={<AlertTriangle className="h-3 w-3 text-amber-500" />}>
        <ul className="space-y-1">{m.whenNOTToUse.map((w, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-destructive mt-0.5">✗</span>{w}</li>)}</ul>
      </CollapsibleSection>

      <CollapsibleSection title="Temperature Lesson">
        <p className="text-xs leading-relaxed">{m.temperatureLesson}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Corrosion Lesson">
        <p className="text-xs leading-relaxed">{m.corrosionLesson}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Cost Perspective">
        <p className="text-xs leading-relaxed">{m.costLesson}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Common Mistakes" highlight icon={<AlertTriangle className="h-3 w-3 text-amber-500" />}>
        <ul className="space-y-1">{m.commonMistakes.map((w, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">⚠</span>{w}</li>)}</ul>
      </CollapsibleSection>

      <CollapsibleSection title="Real-World Notes" icon={<Lightbulb className="h-3 w-3 text-accent" />}>
        <p className="text-xs leading-relaxed">{m.realWorldNotes}</p>
      </CollapsibleSection>

      <div className="text-[10px] text-muted-foreground">
        <span className="font-medium">Code Refs: </span>{m.codeReferences.join(" • ")}
      </div>
    </div>
  );
}

function CalcLessonContent({ lesson: c }: { lesson: CalculationLesson }) {
  return (
    <div className="space-y-3">
      <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
        <div className="text-sm font-semibold">{c.title}</div>
        <div className="text-xs font-mono text-primary mt-1">{c.codeReference}</div>
      </div>

      <div className="bg-secondary rounded p-3 font-mono text-sm text-center">{c.formula}</div>

      <CollapsibleSection title="Variables — What Each Means" defaultOpen>
        <div className="space-y-2">
          {c.variables.map((v, i) => (
            <div key={i} className="border border-border rounded p-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-xs">{v.symbol}</span>
                <span className="text-xs text-muted-foreground">— {v.name}</span>
                <span className="text-[9px] font-mono text-primary ml-auto">{v.source}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{v.lesson}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Derivation">
        <p className="text-xs leading-relaxed">{c.derivation}</p>
      </CollapsibleSection>

      <CollapsibleSection title="What Drives the Result" icon={<Lightbulb className="h-3 w-3 text-accent" />} highlight>
        <p className="text-xs leading-relaxed">{c.whatDrivesResult}</p>
        <p className="text-xs leading-relaxed mt-2 text-muted-foreground">{c.sensitivityNotes}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Practical Lesson">
        <p className="text-xs leading-relaxed">{c.practicalLesson}</p>
      </CollapsibleSection>

      <CollapsibleSection title="Assumptions">
        <ul className="space-y-1">{c.assumptions.map((a, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-muted-foreground mt-0.5">•</span>{a}</li>)}</ul>
      </CollapsibleSection>

      <CollapsibleSection title="Limitations">
        <ul className="space-y-1">{c.limitations.map((l, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-amber-500 mt-0.5">⚠</span>{l}</li>)}</ul>
      </CollapsibleSection>

      <CollapsibleSection title="Common Errors" highlight icon={<AlertTriangle className="h-3 w-3 text-amber-500" />}>
        <ul className="space-y-1">{c.commonErrors.map((e, i) => <li key={i} className="text-xs flex items-start gap-1.5"><span className="text-destructive mt-0.5">✗</span>{e}</li>)}</ul>
      </CollapsibleSection>

      <CollapsibleSection title="Worked Example">
        <p className="text-xs leading-relaxed font-mono bg-secondary/50 rounded p-2">{c.exampleCalc}</p>
      </CollapsibleSection>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen, highlight, icon }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; highlight?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className={highlight ? "bg-accent/5 border border-accent/20 rounded-md overflow-hidden" : "border border-border rounded-md overflow-hidden"}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary/50 transition-colors text-left">
        <div className="flex items-center gap-1.5">
          {icon || <BookOpen className="h-3 w-3 text-muted-foreground" />}
          <span className="text-[11px] font-medium">{title}</span>
        </div>
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && <div className="px-3 py-2 border-t border-border">{children}</div>}
    </div>
  );
}
