/**
 * PIP-format Piping Material Specification Print View
 * Enhanced with P-T ratings, complete sections, references, traceability.
 */

import { forwardRef } from "react";
import type { PipingMaterialSpec, PMSMaterialRow, BranchCode } from "./pmsEngine";
import { BRANCH_LEGEND } from "./pmsEngine";
import { DATASET_RELEASE_ATTESTATION_LINES } from "@/lib/appVersion";

interface PMSPrintViewProps {
  pms: PipingMaterialSpec;
  revision?: string;
}

function categorizeMaterialRows(rows: PMSMaterialRow[]) {
  const pipe: PMSMaterialRow[] = [];
  const nipples: PMSMaterialRow[] = [];
  const fittingSb: PMSMaterialRow[] = [];
  const fittingLb: PMSMaterialRow[] = [];
  const valves: PMSMaterialRow[] = [];
  const flanges: PMSMaterialRow[] = [];
  const gaskets: PMSMaterialRow[] = [];
  const bolting: PMSMaterialRow[] = [];

  for (const r of rows) {
    if (r.category === "pipe") pipe.push(r);
    else if (r.category === "nipple") nipples.push(r);
    else if (r.category === "fitting-sb") fittingSb.push(r);
    else if (r.category === "fitting-lb") fittingLb.push(r);
    else if (r.category === "valve") valves.push(r);
    else if (r.category === "flange") flanges.push(r);
    else if (r.category === "gasket") gaskets.push(r);
    else if (r.category === "bolting") bolting.push(r);
  }

  return { pipe, nipples, fittingSb, fittingLb, valves, flanges, gaskets, bolting };
}

function MaterialSection({ title, rows }: { title: string; rows: PMSMaterialRow[] }) {
  if (rows.length === 0) {
    return (
      <>
        <tr className="pms-category-row"><td colSpan={6}><strong>{title}</strong></td></tr>
        <tr><td colSpan={6} className="pms-na-row">Not used in this class</td></tr>
      </>
    );
  }
  return (
    <>
      <tr className="pms-category-row"><td colSpan={6}><strong>{title}</strong></td></tr>
      {rows.map((r, i) => (
        <tr key={`${title}-${i}`}>
          <td className="pms-col-item pms-indent">{r.component}</td>
          <td className="pms-col-notes">{r.notes !== "-" ? r.notes : ""}</td>
          <td className="pms-col-nps">{r.size}</td>
          <td className="pms-col-sch">{r.category === "valve" || r.category === "flange" || r.category === "gasket" || r.category === "bolting" ? r.rating : r.schedule}</td>
          <td className="pms-col-ends">{r.endConnection}</td>
          <td className="pms-col-desc">{r.grade}{r.valveBody && r.category === "valve" ? ` / ${r.valveTrim} / ${r.valveSeat}` : ""}</td>
        </tr>
      ))}
    </>
  );
}

function PMSFooter({ page }: { page: string }) {
  return (
    <div className="pms-page-footer">
      <span>{DATASET_RELEASE_ATTESTATION_LINES.join(" | ")}</span>
      <span>{page}</span>
    </div>
  );
}

export const PMSPrintView = forwardRef<HTMLDivElement, PMSPrintViewProps>(
  ({ pms, revision }, ref) => {
    const db = pms.designBasis;
    const cats = categorizeMaterialRows(pms.materialTable);
    const revLabel = revision || db.date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

    return (
      <div ref={ref} className="pms-print-root">
        {/* ==================== PAGE 1 ==================== */}
        <div className="pms-page">
          <div className="pms-page-header">
            <div className="pms-header-left">
              <div className="pms-header-rev">Rev {db.revision} — {revLabel}</div>
            </div>
            <div className="pms-header-right">
              <div className="pms-header-spec">{db.specNumber}</div>
              <div className="pms-header-subtitle">Piping Material Specification</div>
            </div>
          </div>

          {/* Design Basis Grid */}
          <table className="pms-basis-table">
            <tbody>
              <tr>
                <td className="pms-basis-label">SPEC NUMBER:</td>
                <td className="pms-basis-value">{db.specNumber}</td>
                <td className="pms-basis-label">DESIGN CODE:</td>
                <td className="pms-basis-value">{db.designCode}</td>
              </tr>
              <tr>
                <td className="pms-basis-label">SERVICE:</td>
                <td className="pms-basis-value">{db.serviceType}</td>
                <td className="pms-basis-label">MATERIAL:</td>
                <td className="pms-basis-value">{db.materialGroup}</td>
              </tr>
              <tr>
                <td className="pms-basis-label">SPECIAL SERVICE:</td>
                <td className="pms-basis-value">{db.specialService}</td>
                <td className="pms-basis-label">FLUID PHASE:</td>
                <td className="pms-basis-value">{db.fluidPhase}</td>
              </tr>
              <tr>
                <td className="pms-basis-label">RATING CLASS:</td>
                <td className="pms-basis-value">{db.flangeRating}, {pms.ptRatingBlock?.standard || "ASME B16.5"}</td>
                <td className="pms-basis-label">REVISION:</td>
                <td className="pms-basis-value">{db.revision}</td>
              </tr>
              <tr>
                <td className="pms-basis-label">DESIGN PRESSURE:</td>
                <td className="pms-basis-value">{db.designPressure}</td>
                <td className="pms-basis-label">DESIGN TEMPERATURE:</td>
                <td className="pms-basis-value">{db.designTemperature}</td>
              </tr>
              <tr>
                <td className="pms-basis-label">TEST PRESSURE:</td>
                <td className="pms-basis-value">{db.testPressure}</td>
                <td className="pms-basis-label">TEST MEDIUM:</td>
                <td className="pms-basis-value">{db.testMedium}</td>
              </tr>
              <tr>
                <td className="pms-basis-label">CORROSION ALLOWANCE:</td>
                <td className="pms-basis-value">{db.corrosionAllowance}</td>
                <td className="pms-basis-label">STRESS RELIEF:</td>
                <td className="pms-basis-value">Per {db.designCode}</td>
              </tr>
            </tbody>
          </table>

          {/* P-T Rating Block */}
          {pms.ptRatingBlock && (
            <div className="pms-pt-block">
              <div className="pms-section-title">PRESSURE–TEMPERATURE RATING</div>
              <div className="pms-pt-info">{pms.ptRatingBlock.note}</div>
              {pms.ptRatingBlock.ratings.length > 0 ? (
                <table className="pms-pt-table">
                  <thead>
                    <tr>
                      <th>Temp (°C)</th>
                      {pms.ptRatingBlock.ratings.map((r, i) => (
                        <th key={i}>{r.tempC}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>P (bar)</strong></td>
                      {pms.ptRatingBlock.ratings.map((r, i) => (
                        <td key={i}>{r.pressureBar.toFixed(1)}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="pms-pt-info">Full flange rating per {pms.ptRatingBlock.standard}. Calculated for NPS ≥ 12 where applicable.</div>
              )}
            </div>
          )}

          {/* Material Table — Page 1: Pipe, Nipples, Fittings */}
          <table className="pms-material-table">
            <thead>
              <tr>
                <th className="pms-col-item">ITEM</th>
                <th className="pms-col-notes">NOTES</th>
                <th className="pms-col-nps">NPS</th>
                <th className="pms-col-sch">SCH/RAT</th>
                <th className="pms-col-ends">ENDS</th>
                <th className="pms-col-desc">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              <MaterialSection title="PIPE" rows={cats.pipe} />
              <MaterialSection title="NIPPLES" rows={cats.nipples} />
              <MaterialSection title="FITTINGS — SMALL BORE (≤ 2″)" rows={cats.fittingSb} />
              <MaterialSection title="FITTINGS — LARGE BORE (> 2″)" rows={cats.fittingLb} />
            </tbody>
          </table>

          <PMSFooter page="Page 1 of 4" />
        </div>

        {/* ==================== PAGE 2 ==================== */}
        <div className="pms-page">
          <div className="pms-page-header">
            <div className="pms-header-left">
              <div className="pms-header-spec-small">{db.specNumber}</div>
              <div className="pms-header-subtitle-small">Piping Material Specification</div>
            </div>
            <div className="pms-header-right">
              <div className="pms-header-rev">Rev {db.revision}</div>
            </div>
          </div>

          <table className="pms-material-table">
            <thead>
              <tr>
                <th className="pms-col-item">ITEM</th>
                <th className="pms-col-notes">NOTES</th>
                <th className="pms-col-nps">NPS</th>
                <th className="pms-col-sch">SCH/RAT</th>
                <th className="pms-col-ends">ENDS</th>
                <th className="pms-col-desc">DESCRIPTION / BODY / TRIM / SEAT</th>
              </tr>
            </thead>
            <tbody>
              <MaterialSection title="VALVES" rows={cats.valves} />
              <MaterialSection title="FLANGES" rows={cats.flanges} />
              <MaterialSection title="GASKETS" rows={cats.gaskets} />
              <MaterialSection title="BOLTING" rows={cats.bolting} />
            </tbody>
          </table>

          <PMSFooter page="Page 2 of 4" />
        </div>

        {/* ==================== PAGE 3 ==================== */}
        <div className="pms-page">
          <div className="pms-page-header">
            <div className="pms-header-left">
              <div className="pms-header-rev">Rev {db.revision}</div>
            </div>
            <div className="pms-header-right">
              <div className="pms-header-spec">{db.specNumber}</div>
              <div className="pms-header-subtitle">Branch Connection Table & Notes</div>
            </div>
          </div>

          <div className="pms-section-title">90° BRANCH CONNECTION</div>

          <div className="pms-matrix-wrapper">
            <table className="pms-matrix-table">
              <thead>
                <tr>
                  <th className="pms-matrix-corner"></th>
                  {pms.branchMatrix.headerSizes.map(h => (
                    <th key={h} className="pms-matrix-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pms.branchMatrix.branchSizes.map((branch, bi) => (
                  <tr key={branch}>
                    <td className="pms-matrix-branch">{branch}</td>
                    {pms.branchMatrix.grid[bi].map((code, hi) => (
                      <td key={hi} className={`pms-matrix-cell ${code ? `pms-cell-${code}` : ""}`}>{code}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pms-legend">
            {BRANCH_LEGEND.map(l => (
              <div key={l.code}><strong>{l.code}</strong> — {l.label}</div>
            ))}
          </div>

          {/* Notes */}
          <div className="pms-notes-section">
            <div className="pms-section-title">NOTES:</div>
            {pms.notes.map(note => (
              <div key={note.id} className="pms-note-row">
                <span className="pms-note-id">{String(note.id).padStart(2, "0")}</span>
                <span className="pms-note-text">{note.text}</span>
                <span className="pms-note-ref"> [{note.reference}]</span>
              </div>
            ))}
          </div>

          <PMSFooter page="Page 3 of 4" />
        </div>

        {/* ==================== PAGE 4 ==================== */}
        <div className="pms-page">
          <div className="pms-page-header">
            <div className="pms-header-left">
              <div className="pms-header-spec-small">{db.specNumber}</div>
            </div>
            <div className="pms-header-right">
              <div className="pms-header-rev">Rev {db.revision}</div>
            </div>
          </div>

          {/* References */}
          <div className="pms-section-title">APPLICABLE STANDARDS & REFERENCES</div>
          <table className="pms-ref-table">
            <thead>
              <tr>
                <th>Standard</th>
                <th>Title</th>
                <th>Applied To</th>
              </tr>
            </thead>
            <tbody>
              {pms.references.map((r, i) => (
                <tr key={i}>
                  <td><strong>{r.standard}</strong></td>
                  <td>{r.title}</td>
                  <td>{r.appliedTo}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Material Continuity */}
          <div className="pms-section-title" style={{ marginTop: "12px" }}>MATERIAL CONTINUITY CHECK</div>
          <table className="pms-ref-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Material</th>
                <th>Status</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {pms.materialContinuity.map((c, i) => (
                <tr key={i}>
                  <td>{c.component}</td>
                  <td>{c.material}</td>
                  <td style={{ color: c.compatible ? "#16a34a" : "#dc2626" }}>{c.compatible ? "✓ OK" : "⚠ Review"}</td>
                  <td>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <PMSFooter page="Page 4 of 4" />
        </div>
      </div>
    );
  }
);

PMSPrintView.displayName = "PMSPrintView";
