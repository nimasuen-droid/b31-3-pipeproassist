import { useState } from "react";
import { BookOpen, X, AlertTriangle, FileText, Lightbulb, ExternalLink } from "lucide-react";
import { getCodeReference, type CodeReference } from "@/components/modules/designInputs/codeReferenceDatabase";

/**
 * Try to resolve a free-text reference string (e.g. "API 600", "ASME B31.3 §304.1.2",
 * "API 607 / API 6FA", "ASME B16.34") to a CodeReference entry in the database.
 *
 * Strategy: split on common separators, normalize each token, try a few
 * id-shape candidates against the CODE_REFERENCES map, return the first hit.
 */
function resolveReference(ref: string): CodeReference | null {
  if (!ref) return null;
  const tokens = ref.split(/\s*[/,;]\s*/).map((t) => t.trim()).filter(Boolean);
  for (const t of tokens) {
    // Direct id
    let hit = getCodeReference(t);
    if (hit) return hit;
    // Strip "ASME " / "ANSI " prefixes
    const stripped = t.replace(/^(ASME|ANSI|API|MSS|ASTM|NACE)\s+/i, "");
    hit = getCodeReference(stripped);
    if (hit) return hit;
    // B31.3 §304.1.2 → B31.3-304.1.2
    const m = t.match(/B31\.3.*?(\d+(?:\.\d+)+)/i);
    if (m) {
      hit = getCodeReference(`B31.3-${m[1]}`);
      if (hit) return hit;
    }
    // B16.x — direct
    const b = t.match(/B(16|36)\.(\d+M?)/i);
    if (b) {
      hit = getCodeReference(`B${b[1]}.${b[2]}`);
      if (hit) return hit;
    }
  }
  return null;
}

interface Props {
  /** Reference citation, e.g. "API 600" or "ASME B31.3 §304.1.2" */
  reference: string;
  /** Section/clause description, e.g. "Section 4 — Materials" */
  section?: string;
  /** Why this clause was applied to the recommendation */
  context?: string;
  /** Optional explicit lesson/extract to show even when the code isn't in the DB */
  inlineExtract?: string;
}

/**
 * Inline reference badge that opens a popup showing:
 *   - The cited standard + section
 *   - Authoritative paraphrased section text (when in CODE_REFERENCES)
 *   - The "why this was applied" context from the engine
 *   - A clear notice + Source Library pointer when the standard isn't yet mapped
 */
export function CodeReferencePopup({ reference, section, context, inlineExtract }: Props) {
  const [open, setOpen] = useState(false);
  const resolved = resolveReference(reference);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 transition-colors text-[10px] font-mono cursor-pointer shrink-0"
        title="Click to view what this section says"
      >
        <BookOpen className="h-2.5 w-2.5" />
        <span className="font-semibold">{reference}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative bg-card border border-border rounded-lg shadow-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {resolved ? `${resolved.standard} ${resolved.section}` : reference}
                  </div>
                  {(resolved?.title || section) && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {resolved?.title || section}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 shrink-0 ml-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* What the section says */}
              {resolved ? (
                <>
                  <Section title="What this section says" icon={<FileText className="h-3 w-3" />}>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{resolved.fullText}</p>
                  </Section>

                  {resolved.summary && (
                    <Section title="Summary">
                      <p className="text-xs text-muted-foreground leading-relaxed">{resolved.summary}</p>
                    </Section>
                  )}

                  {resolved.keyPoints?.length > 0 && (
                    <Section title="Key Points">
                      <ul className="space-y-1">
                        {resolved.keyPoints.map((p, i) => (
                          <li key={i} className="text-xs text-foreground flex gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="leading-relaxed">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}

                  {resolved.lesson && (
                    <Section title="Engineering lesson" icon={<Lightbulb className="h-3 w-3" />}>
                      <p className="text-xs text-foreground leading-relaxed">{resolved.lesson}</p>
                    </Section>
                  )}
                </>
              ) : (
                <div className="bg-amber-500/5 border border-amber-500/30 rounded p-3 text-xs text-amber-600 flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p>
                      <strong>{reference}</strong> is a citation reference — verbatim section text is not
                      bundled with the app (copyrighted material). The recommendation engine applies this
                      clause based on the rule below.
                    </p>
                    {section && <p><span className="text-muted-foreground">Cited section:</span> <span className="font-mono">{section}</span></p>}
                    <p className="text-muted-foreground">
                      To see exact extracted content, upload your licensed copy of the standard via the
                      <span className="inline-flex items-center gap-0.5 mx-1"><ExternalLink className="h-2.5 w-2.5" />Source Library</span>
                      module.
                    </p>
                  </div>
                </div>
              )}

              {/* Inline extract (engine-supplied paraphrase) */}
              {inlineExtract && (
                <Section title="Applied rule">
                  <p className="text-xs text-foreground leading-relaxed">{inlineExtract}</p>
                </Section>
              )}

              {/* Why applied here */}
              {context && (
                <Section title="Why this was applied to your line" icon={<Lightbulb className="h-3 w-3" />}>
                  <p className="text-xs text-foreground leading-relaxed">{context}</p>
                </Section>
              )}

              {/* Disclaimer */}
              <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
                Reference content is paraphrased for engineering guidance. Always verify against the
                official, licensed standard before issuing for construction.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">
        {icon}
        <span>{title}</span>
      </div>
      <div className="bg-secondary/30 rounded-md p-2.5">{children}</div>
    </div>
  );
}
