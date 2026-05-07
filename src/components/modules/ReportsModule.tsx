import { FileDown, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { EngineeringDisclaimer } from "../EngineeringDisclaimer";
import { useDesignInputs } from "@/stores/designInputsStore";
import { toast } from "sonner";
import {
  getReportContent,
  downloadAsText,
  downloadAsCsv,
  printReport,
  type ReportId,
  type ReportData,
} from "./reports/reportGenerator";

const reports: { id: ReportId; title: string; description: string; icon: typeof FileText }[] = [
  { id: "line-summary", title: "Line Design Summary", description: "Complete design basis and recommendation package", icon: FileText },
  { id: "thickness", title: "Pipe Thickness Calculation Sheet", description: "Step-by-step wall thickness calculation with references", icon: FileText },
  { id: "material", title: "Material/Component Recommendation", description: "Pipe, flange, fitting, bolting, and gasket selections", icon: FileText },
  { id: "flange-bolt", title: "Flange & Bolting Datasheet", description: "Flange rating, bolt count, bolt length, gasket details", icon: FileText },
  { id: "support", title: "Support Recommendation Sheet", description: "Span recommendations and support type suggestions", icon: FileText },
  { id: "b313-checklist", title: "B31.3 Design Review Checklist", description: "Compliance check status with references", icon: FileText },
  { id: "audit-trail", title: "Audit Trail Report", description: "All sources used, assumptions made, and review status", icon: FileText },
];

export function ReportsModule() {
  const { inputs, recommendations, overrides, activePipeMaterial, calculated } = useDesignInputs();

  const buildData = (): ReportData => ({
    inputs,
    recommendations,
    overrides: overrides as Record<string, boolean>,
    activePipeMaterial,
    calculated,
  });

  const handleDownload = (id: ReportId, format: "txt" | "csv" | "print") => {
    try {
      const data = buildData();
      const { content, title } = getReportContent(id, data);
      const ts = new Date().toISOString().slice(0, 10);
      const filename = `${title}_${ts}`;

      if (format === "txt") {
        downloadAsText(content, `${filename}.txt`);
        toast.success(`Downloaded ${title.replace(/_/g, " ")}`);
      } else if (format === "csv") {
        downloadAsCsv(content, `${filename}.csv`);
        toast.success(`Downloaded ${title.replace(/_/g, " ")} (CSV)`);
      } else {
        printReport(content, title.replace(/_/g, " "));
      }
    } catch (e) {
      toast.error("Failed to generate report — ensure design data is populated");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Design Output Reports</h2>
        <p className="text-sm text-muted-foreground">Generate downloadable reports with full source traceability</p>
      </div>

      <div className="eng-card border-accent/30 bg-accent/5">
        <p className="text-xs text-accent">
          Reports include ASME B31.3 basis, user-entered values, imported source references, assumptions, and calculation steps.
          No checker sign-off is enforced; TXT, CSV, and print outputs require design data to be populated across modules.
        </p>
      </div>

      <div className="grid gap-3">
        {reports.map((report) => (
          <div key={report.id} className="eng-card flex items-center justify-between group hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <report.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{report.title}</div>
                <div className="text-xs text-muted-foreground">{report.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleDownload(report.id, "txt")}
                className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-[10px] flex items-center gap-1 hover:opacity-80"
                title="Export text report"
              >
                <FileDown className="h-3 w-3" />
                TXT
              </button>
              <button
                onClick={() => handleDownload(report.id, "csv")}
                className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-[10px] flex items-center gap-1 hover:opacity-80"
                title="Export CSV"
              >
                <FileSpreadsheet className="h-3 w-3" />
                CSV
              </button>
              <button
                onClick={() => handleDownload(report.id, "print")}
                className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-[10px] flex items-center gap-1 hover:opacity-80"
                title="Print"
              >
                <Printer className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <EngineeringDisclaimer />
    </div>
  );
}
