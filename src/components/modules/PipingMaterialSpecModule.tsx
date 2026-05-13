import { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, FileText, Layers, StickyNote, GitBranch, Printer, Eye, BookOpen, ShieldCheck, ChevronDown, Info, Thermometer, X, Download } from "lucide-react";
import { useDesignInputs } from "@/stores/designInputsStore";
import { generatePMS, type PipingMaterialSpec, BRANCH_LEGEND } from "./pms/pmsEngine";
import { SCHEDULE_BANDS } from "./pms/scheduleBandEngine";
import { EngineeringDisclaimer } from "@/components/EngineeringDisclaimer";
import { LearningMoment } from "@/components/LearningMoment";
import { PMSPrintView } from "./pms/PMSPrintView";
import { exportPMSToWord } from "./pms/pmsWordExport";
import "./pms/pmsPrint.css";
import { escapeHtml } from "@/lib/utils";

export function PipingMaterialSpecModule() {
  const { inputs, recommendations, activePipeMaterial, overrides, calculated } = useDesignInputs();
  const [activeSection, setActiveSection] = useState("design-basis");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [useB165AsDesignBasis, setUseB165AsDesignBasis] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const pms = useMemo<PipingMaterialSpec | null>(() => {
    if (!calculated) return null;
    return generatePMS(inputs, recommendations, activePipeMaterial, overrides, undefined, undefined, { useB165AsDesignBasis });
  }, [inputs, recommendations, activePipeMaterial, overrides, calculated, useB165AsDesignBasis]);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=1100");
    if (!printWindow) return;
    const styles = document.querySelectorAll("style");
    let cssText = "";
    styles.forEach(s => { cssText += s.innerHTML; });
    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>${escapeHtml(pms?.designBasis.specNumber || "PMS")}</title>
<style>${cssText}
body { margin: 0; padding: 0; }
.pms-print-root { position: static; }
.pms-page { border: none; margin: 0; }
@media print { body * { visibility: visible; } .pms-print-root { position: static; } }
</style></head><body>
<div class="pms-print-root">${printContents}</div>
</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  }, [pms]);

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  if (!calculated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Piping Material Specification</CardTitle>
          <CardDescription>PIP-format material spec generated from your design basis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm">Complete Design Inputs and click <strong>Calculate</strong> to generate the material specification.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pms) return null;

  const bandDef = SCHEDULE_BANDS.find(b => b.band === pms.scheduleBand);

  // Category labels for tabs
  const categoryGroups = [
    { key: "pipe", label: "Pipe", filter: (r: typeof pms.materialTable[0]) => r.category === "pipe" },
    { key: "nipple", label: "Nipples", filter: (r: typeof pms.materialTable[0]) => r.category === "nipple" },
    { key: "fitting-sb", label: "Fittings (SB)", filter: (r: typeof pms.materialTable[0]) => r.category === "fitting-sb" },
    { key: "fitting-lb", label: "Fittings (LB)", filter: (r: typeof pms.materialTable[0]) => r.category === "fitting-lb" },
    { key: "valve", label: "Valves", filter: (r: typeof pms.materialTable[0]) => r.category === "valve" },
    { key: "flange", label: "Flanges", filter: (r: typeof pms.materialTable[0]) => r.category === "flange" },
    { key: "gasket", label: "Gaskets", filter: (r: typeof pms.materialTable[0]) => r.category === "gasket" },
    { key: "bolting", label: "Bolting", filter: (r: typeof pms.materialTable[0]) => r.category === "bolting" },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                {pms.designBasis.specNumber}
              </CardTitle>
              <CardDescription>{pms.designBasis.specName}</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">{pms.designBasis.flangeRating}</Badge>
              <Badge variant="secondary" className="text-xs">{pms.designBasis.materialGroup}</Badge>
              {bandDef && <Badge className={`text-xs ${bandDef.color} bg-transparent border`}>Band {pms.scheduleBand}</Badge>}

              <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5"><Eye className="h-3.5 w-3.5" />Preview</Button>
                </DialogTrigger>
                <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
                  <DialogHeader className="sticky top-0 z-10 bg-background border-b p-4 flex flex-row items-center justify-between">
                    <DialogTitle className="text-sm font-medium">PIP Format — {pms.designBasis.specNumber}</DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="gap-1.5" onClick={handlePrint}><Printer className="h-3.5 w-3.5" />Print / PDF</Button>
                      <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => pms && exportPMSToWord(pms)}><Download className="h-3.5 w-3.5" />Word (.docx)</Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowPrintPreview(false)}><X className="h-3.5 w-3.5" />Close</Button>
                    </div>
                  </DialogHeader>
                  <div className="p-4 bg-muted/30">
                    <PMSPrintView ref={printRef} pms={pms} />
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="default" size="sm" className="gap-1.5" onClick={() => { setShowPrintPreview(true); setTimeout(handlePrint, 500); }}>
                <Printer className="h-3.5 w-3.5" />Print
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* B16.5 Design Basis Option */}
      <div className="flex items-start gap-3 p-3 rounded-md bg-muted/50 border border-border">
        <Checkbox
          id="b165-design-basis"
          checked={useB165AsDesignBasis}
          onCheckedChange={(checked) => setUseB165AsDesignBasis(checked === true)}
          className="mt-0.5"
        />
        <div>
          <label htmlFor="b165-design-basis" className="text-xs font-medium cursor-pointer">
            Use ASME B16.5 Pressure–Temperature Limits as Design Basis
          </label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            When enabled, the B16.5 rated pressure at the design temperature for the selected class and material group becomes the governing design pressure.
          </p>
        </div>
      </div>

      {useB165AsDesignBasis && pms.designBasis.b165Note && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/20">
          <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-foreground">{pms.designBasis.b165Note}</p>
        </div>
      )}

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-grid min-w-[720px] grid-cols-6 md:w-full md:max-w-3xl">
            <TabsTrigger value="design-basis" className="gap-1 text-xs"><Layers className="h-3 w-3" />Design Basis</TabsTrigger>
            <TabsTrigger value="material-table" className="gap-1 text-xs"><FileText className="h-3 w-3" />Materials</TabsTrigger>
            <TabsTrigger value="branch-matrix" className="gap-1 text-xs"><GitBranch className="h-3 w-3" />Branch</TabsTrigger>
            <TabsTrigger value="notes" className="gap-1 text-xs"><StickyNote className="h-3 w-3" />Notes</TabsTrigger>
            <TabsTrigger value="references" className="gap-1 text-xs"><BookOpen className="h-3 w-3" />References</TabsTrigger>
            <TabsTrigger value="continuity" className="gap-1 text-xs"><ShieldCheck className="h-3 w-3" />Continuity</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Design Basis ── */}
        <TabsContent value="design-basis">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Section 1 — Design Basis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                {Object.entries({
                  "Spec Number": pms.designBasis.specNumber,
                  "Revision": pms.designBasis.revision,
                  "Date": pms.designBasis.date,
                  "Design Code": pms.designBasis.designCode,
                  "Service Type": pms.designBasis.serviceType,
                  "Fluid Phase": pms.designBasis.fluidPhase,
                  "Design Pressure": pms.designBasis.designPressure,
                  "Design Temperature": pms.designBasis.designTemperature,
                  "Operating Pressure": pms.designBasis.operatingPressure,
                  "Operating Temperature": pms.designBasis.operatingTemperature,
                  "Test Pressure": pms.designBasis.testPressure,
                  "Test Medium": pms.designBasis.testMedium,
                  "Corrosion Allowance": pms.designBasis.corrosionAllowance,
                  "Material Group": pms.designBasis.materialGroup,
                  "Flange Rating": pms.designBasis.flangeRating,
                }).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <span className="text-xs font-medium text-foreground">{v || "—"}</span>
                  </div>
                ))}
              </div>

              {/* P-T Rating Block */}
              {pms.ptRatingBlock && (
                <div className="mt-4 p-3 rounded-md bg-muted/50 border border-border">
                  <h4 className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Thermometer className="h-3.5 w-3.5 text-primary" />
                    Pressure–Temperature Rating — Class {pms.ptRatingBlock.ratingClass} ({pms.ptRatingBlock.materialDescription})
                  </h4>
                  <p className="text-[11px] text-muted-foreground mb-2">{pms.ptRatingBlock.note}</p>
                  {pms.ptRatingBlock.ratings.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[10px]">
                        <thead>
                          <tr>
                            <th className="border border-border p-1 bg-muted font-semibold text-left">Temp (°C)</th>
                            {pms.ptRatingBlock.ratings.map((r, i) => (
                              <th key={i} className="border border-border p-1 bg-muted text-center font-semibold min-w-[40px]">{r.tempC}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-border p-1 font-semibold">P (bar)</td>
                            {pms.ptRatingBlock.ratings.map((r, i) => (
                              <td key={i} className="border border-border p-1 text-center">{r.pressureBar.toFixed(1)}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Band */}
              <div className="mt-4 p-3 rounded-md bg-muted/50 border border-border">
                <h4 className="text-xs font-semibold mb-1">Schedule Band Assignment</h4>
                <div className="flex items-center gap-3">
                  {SCHEDULE_BANDS.map(bd => (
                    <div key={bd.band} className={`flex items-center gap-1 text-xs ${bd.band === pms.scheduleBand ? "font-bold" : "text-muted-foreground"}`}>
                      <span className={`w-2 h-2 rounded-full ${bd.band === pms.scheduleBand ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      {bd.label}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{bandDef?.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Material Tables ── */}
        <TabsContent value="material-table">
          <div className="space-y-3">
            {categoryGroups.map(grp => {
              const rows = pms.materialTable.filter(grp.filter);
              return (
                <Card key={grp.key}>
                  <CardHeader className="pb-2 py-3">
                    <CardTitle className="text-sm">{grp.label} {rows.length === 0 && <Badge variant="outline" className="text-[10px] ml-2">Not used in this class</Badge>}</CardTitle>
                  </CardHeader>
                  {rows.length > 0 && (
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-[11px] w-44">Component</TableHead>
                              <TableHead className="text-[11px]">Grade</TableHead>
                              <TableHead className="text-[11px]">Size</TableHead>
                              <TableHead className="text-[11px]">Sch / Rating</TableHead>
                              <TableHead className="text-[11px]">Ends</TableHead>
                              {grp.key === "valve" && <TableHead className="text-[11px]">Trim / Seat / Bore</TableHead>}
                              <TableHead className="text-[11px]">Notes</TableHead>
                              <TableHead className="text-[11px] w-8"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row, i) => {
                              const globalIdx = pms.materialTable.indexOf(row);
                              const isExpanded = expandedRows.has(globalIdx);
                              return (
                                <>
                                  <TableRow key={globalIdx} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                                    <TableCell className="text-xs font-medium">{row.component}</TableCell>
                                    <TableCell className="text-xs font-mono">{row.grade}</TableCell>
                                    <TableCell className="text-xs">{row.size}</TableCell>
                                    <TableCell className="text-xs">{row.category === "valve" || row.category === "flange" || row.category === "gasket" || row.category === "bolting" ? row.rating : row.schedule}</TableCell>
                                    <TableCell className="text-xs">{row.endConnection}</TableCell>
                                    {grp.key === "valve" && (
                                      <TableCell className="text-xs text-muted-foreground">
                                        {row.valveTrim} / {row.valveSeat} / {row.valveBore}
                                      </TableCell>
                                    )}
                                    <TableCell className="text-xs text-muted-foreground">{row.notes}</TableCell>
                                    <TableCell>
                                      {row.traceability && (
                                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => toggleRow(globalIdx)}>
                                          <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && row.traceability && (
                                    <TableRow key={`trace-${globalIdx}`}>
                                      <TableCell colSpan={grp.key === "valve" ? 8 : 7} className="bg-primary/5 border-l-2 border-primary/30">
                                        <div className="py-1 space-y-1">
                                          <div className="flex items-start gap-1.5">
                                            <Info className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                                            <div>
                                              <p className="text-[11px] font-semibold text-primary">Why Selected</p>
                                              <p className="text-[11px] text-foreground">{row.traceability.whySelected}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-1.5">
                                            <BookOpen className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                              <p className="text-[11px] text-muted-foreground"><strong>Governing Rule:</strong> {row.traceability.governingRule}</p>
                                              {row.traceability.sourceField && (
                                                <p className="text-[10px] text-muted-foreground">Source field: {row.traceability.sourceField}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Branch Matrix ── */}
        <TabsContent value="branch-matrix">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-4 w-4" /> 90° Branch Connection Table
              </CardTitle>
              <CardDescription className="text-xs">Logic-driven branch selection based on header/branch size ratio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-3 p-2 rounded-md bg-muted/50 border border-border">
                {BRANCH_LEGEND.map(l => (
                  <div key={l.code} className="flex items-center gap-1.5 text-xs">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border
                      ${l.code === "T" ? "bg-primary/15 text-primary border-primary/30" :
                        l.code === "W" ? "bg-amber-500/15 text-amber-700 border-amber-500/30" :
                        l.code === "S" ? "bg-blue-500/15 text-blue-700 border-blue-500/30" :
                        "bg-green-500/15 text-green-700 border-green-500/30"}`}>
                      {l.code}
                    </span>
                    <span className="text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[10px]">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-muted z-10 border border-border p-1 text-[9px] font-semibold min-w-[40px]">Branch ↓ / Header →</th>
                      {pms.branchMatrix.headerSizes.map(h => (
                        <th key={h} className="border border-border p-1 text-center font-semibold bg-muted min-w-[28px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pms.branchMatrix.branchSizes.map((branch, bi) => (
                      <tr key={branch}>
                        <td className="sticky left-0 bg-muted z-10 border border-border p-1 font-semibold">{branch}</td>
                        {pms.branchMatrix.grid[bi].map((code, hi) => (
                          <td key={hi} className={`border border-border p-1 text-center font-bold
                            ${code === "T" ? "bg-primary/10 text-primary" :
                              code === "W" ? "bg-amber-500/10 text-amber-700" :
                              code === "S" ? "bg-blue-500/10 text-blue-700" :
                              code === "R" ? "bg-green-500/10 text-green-700" :
                              "text-muted-foreground/20"}`}>
                            {code}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-semibold mb-2">Connection Rules</h4>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-[11px]">Header Size</TableHead>
                      <TableHead className="text-[11px]">Branch Size</TableHead>
                      <TableHead className="text-[11px]">Connection Type</TableHead>
                      <TableHead className="text-[11px]">Reinforcement</TableHead>
                      <TableHead className="text-[11px]">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pms.branchRules.map((rule, i) => (
                      <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                        <TableCell className="text-xs">{rule.headerSize}</TableCell>
                        <TableCell className="text-xs">{rule.branchSize}</TableCell>
                        <TableCell className="text-xs font-medium">{rule.connectionType}</TableCell>
                        <TableCell className="text-xs">{rule.reinforcement}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{rule.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><StickyNote className="h-4 w-4" /> Engineering Notes</CardTitle>
              <CardDescription className="text-xs">Condition-triggered notes with traceability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pms.notes.map(note => (
                  <Collapsible key={note.id}>
                    <div className="flex gap-3 py-1.5 border-b border-border/50 last:border-0">
                      <Badge variant="outline" className="text-[10px] h-5 shrink-0">Note {note.id}</Badge>
                      <div className="flex-1">
                        <p className="text-xs">{note.text}</p>
                        <span className="text-[10px] text-muted-foreground">Ref: {note.reference}</span>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-4 px-1.5 ml-2 text-[10px] text-primary">
                            <ChevronDown className="h-2.5 w-2.5 mr-0.5" /> Why triggered
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-1 p-2 rounded bg-primary/5 border border-primary/20 text-[11px]">
                            <p><strong>Trigger:</strong> {note.triggerCondition}</p>
                            <p className="text-muted-foreground mt-0.5"><strong>Linked to:</strong> {note.linkedRows.join(", ")}</p>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── References ── */}
        <TabsContent value="references">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Applicable Standards & References</CardTitle>
              <CardDescription className="text-xs">Auto-generated from applied engineering rules</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px]">Standard</TableHead>
                    <TableHead className="text-[11px]">Title</TableHead>
                    <TableHead className="text-[11px]">Applied To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pms.references.map((ref, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <TableCell className="text-xs font-semibold">{ref.standard}</TableCell>
                      <TableCell className="text-xs">{ref.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ref.appliedTo}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Material Continuity ── */}
        <TabsContent value="continuity">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Material Continuity Check</CardTitle>
              <CardDescription className="text-xs">Pipe → Fittings → Flanges → Valves → Bolting consistency</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-[11px]">Component</TableHead>
                    <TableHead className="text-[11px]">Material</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                    <TableHead className="text-[11px]">Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pms.materialContinuity.map((c, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      <TableCell className="text-xs font-medium">{c.component}</TableCell>
                      <TableCell className="text-xs font-mono">{c.material}</TableCell>
                      <TableCell>
                        <Badge variant={c.compatible ? "default" : "destructive"} className="text-[10px]">
                          {c.compatible ? "✓ Compatible" : "⚠ Review Required"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden print view */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <PMSPrintView ref={printRef} pms={pms} />
      </div>

      <LearningMoment
        title="What a Piping Material Spec really is"
        principle="A PMS is the procurement and construction 'recipe' for one combination of fluid, pressure-temperature envelope, and materials. It locks in pipe, fittings, flanges, gaskets, bolts, valves, branch tables, and end connections so every fabricator builds the same thing. Schedule banding (A/B/C/D) groups NPS ranges that share a wall thickness, simplifying the BOM. Branch tables (T/R/W/S) tell the welder whether to use a tee, reinforced pad, weldolet, or sockolet at each header × branch intersection — based on size ratio and reinforcement requirements per §304.3."
        reference="PIP PNSM0001 PMS standard • ASME B31.3 §304.3 branch reinforcement"
      />

      <EngineeringDisclaimer />
    </div>
  );
}
