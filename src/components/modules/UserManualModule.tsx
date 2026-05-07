import { useState } from "react";
import { PRODUCT_NAME, PRODUCT_POSITIONING, ENGINEERING_REVIEW_NOTICE } from "@/lib/brand";
import { DATASET_RELEASE_ATTESTATION_TEXT } from "@/lib/appVersion";
import {
  Home, FileInput, Layers, Calculator, Ruler, CircleDot, Wrench,
  Bolt, ClipboardCheck, FileOutput, BookOpen, FolderOpen, FileText,
  Library, ChevronDown, ChevronRight, HelpCircle, Rocket, Lock,
  WifiOff, ShieldCheck, Settings2, Database, GitCompare, MonitorSmartphone,
} from "lucide-react";

interface ManualSection {
  id: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  content: string[];
  review?: string[];
  tips?: string[];
}

const manualSections: ManualSection[] = [
  {
    id: "purpose",
    icon: ShieldCheck,
    title: "Purpose & Review Responsibility",
    summary: "What the platform is, what it is not, and how outputs should be used.",
    content: [
      `${PRODUCT_NAME} is an ${PRODUCT_POSITIONING}. It helps users organize inputs, run engineering calculations, compare options, generate traceable outputs, and learn the reasoning behind piping decisions.`,
      "The platform is not an official ASME product, certification tool, engineering approval system, checker sign-off system, or substitute for licensed engineering judgment.",
      "Recommendations are decision-support outputs. They must be reviewed against the governing code edition, client specifications, project design basis, jurisdictional requirements, and licensed source documents before use on a real project.",
      "Imported data, edited values, overrides, and generated reports remain review items. The app records source references and rationale so the responsible project reviewer can see what was used.",
    ],
    review: [
      ENGINEERING_REVIEW_NOTICE,
      "No checker sign-off is performed inside the app. The app prepares review evidence; it does not approve engineering work.",
    ],
  },
  {
    id: "home",
    icon: Home,
    title: "Home",
    summary: "Dashboard for project status, source readiness, warnings, and workflow entry points.",
    content: [
      "Use Home to confirm the current project, active line NPS, loaded source state, calculation progress, and open warnings.",
      "Quick-start cards route users to Source Library for data readiness or Design Inputs for a new engineering workflow.",
      "Supported Standards shows the reference families used by the app once their source data is available.",
    ],
    tips: [
      "Review the warning count before exporting any output for discussion.",
      "If a calculation refuses to run, check source readiness first.",
    ],
  },
  {
    id: "projects",
    icon: FolderOpen,
    title: "Engineering Workspace & Saved Projects",
    summary: "Create, save, load, switch, and organize design work without losing traceability.",
    content: [
      "A project stores the design basis, inputs, overrides, calculations, selections, generated PMS records, report state, and source traceability.",
      "The Active Project bar shows what workspace you are editing. Change switches projects; Clear starts a fresh session without deleting saved records.",
      "Local autosave protects the current browser session. A formal project record is created or updated only when the user explicitly saves.",
      "Signed-in users can sync projects through the cloud when configured. Offline work remains available locally and can sync after reconnection.",
      "Specs saved from the Spec Library can be filed under the active project, another project, a new project, or the global Spec Library.",
    ],
    review: [
      "Project names and descriptions should identify the design basis clearly enough for later review.",
      "Before sharing a saved project, confirm that imported datasets and overrides are suitable for that project.",
    ],
  },
  {
    id: "datasets",
    icon: Database,
    title: "Default, Custom & Licensed Datasets",
    summary: "Understand how source data enters the workflow and how default data can be restored.",
    content: [
      "Default Engineering Dataset records are bundled for reference workflows, training, and familiarization. Their displayed edition is shown as Default.",
      "Custom Engineering Dataset records are created when users import, stage, edit, or replace source data. They must include source references and review notes where applicable.",
      "Licensed Engineering Dataset records may represent organization-controlled or server-backed datasets when entitlement and cloud workflows are configured.",
      "Users can revert a dataset type back to the app default data where a default exists. If a dataset is deleted, the record remains visible as Deleted for audit continuity.",
      "External data is staged, validated, and explicitly accepted before it is used in calculations. The app should fail closed when required data is missing.",
    ],
    review: [
      "The app does not certify imported tables. Users must verify source edition, table scope, units, transcription accuracy, and project applicability.",
      "Do not treat sample or default datasets as project authority unless the responsible project reviewer accepts them for that project.",
    ],
  },
  {
    id: "source-library",
    icon: BookOpen,
    title: "Source & Reference Library",
    summary: "Manage standards references, uploaded source documents, staged tables, and audit history.",
    content: [
      "The Source Library tracks reference documents, source type, standard family, dataset status, mapping completeness, and audit history.",
      "Users can upload source files, manually register references, paste table data, create structured tables, filter by source type, and review source details.",
      "Source records can be marked reviewed for workflow tracking, activated for use, reverted to default data, or retained as Deleted for audit visibility.",
      "Reference badges throughout the app show where a value or rule came from, including default rules, imported tables, and user overrides.",
    ],
    review: [
      "Source records are evidence and traceability aids; they are not proof of code compliance by themselves.",
      "When using standards, verify against licensed documents and project-required editions.",
    ],
  },
  {
    id: "learning",
    icon: HelpCircle,
    title: "Learning Mode & Training Support",
    summary: "Use explanations, teaching panels, and rationale to build engineering judgment.",
    content: [
      "Learning Moments explain the engineering principle behind each major selection or calculation.",
      "Field tooltips explain what each input affects downstream, including material compatibility, schedule selection, flange class, valve philosophy, and report outputs.",
      "The platform is intended to help young engineers understand why a recommendation appears, not just copy the answer.",
    ],
    tips: [
      "Read rationale before overriding a value.",
      "Use sample workflows for training discussions, then switch to project-specific inputs and sources for real work.",
    ],
  },
  {
    id: "inputs",
    icon: FileInput,
    title: "Design Inputs",
    summary: "Define the design basis that drives every downstream calculation and recommendation.",
    content: [
      "Inputs include project metadata, NPS, design pressure, design temperature, pipe material, service type, fluid, corrosion allowance, joint factor, mill tolerance, and related design-basis values.",
      "Smart recommendations appear where the app can infer a value from selected service, material, temperature, or source rules.",
      "Overrides are allowed and visibly tracked. Override use should be intentional and supported by project-specific reasoning.",
      "Calculate runs the downstream engines for wall thickness, pipe schedule, material selection, flange rating, bolting/gasket, valves, support span, PMS continuity, and design review checks.",
      "Load Sample Data fills a reference workflow for familiarization. Clear All Fields resets the current input form.",
    ],
    review: [
      "Service Type is a governing input. It affects corrosion allowance, material compatibility, valve trim/seat/body philosophy, gasket selection, schedule philosophy, and warnings.",
      "Wrong pressure, temperature, NPS, material, or corrosion allowance will propagate into every module.",
    ],
  },
  {
    id: "material",
    icon: Layers,
    title: "Material Selection",
    summary: "Review pipe, fittings, flanges, valves, bolting, and gasket material continuity.",
    content: [
      "Material Selection compares candidates using service conditions, temperature range, material family, corrosion concerns, and reference rules.",
      "Selections are presented as recommendations with rationale, not automatic approvals.",
      "Material continuity checks compare the pipe-to-fitting-to-flange-to-valve-to-bolting chain and flag mismatches.",
      "Valve material descriptions should align with the valve body/trim/seat selections generated by service-driven logic.",
    ],
    review: [
      "Confirm all selected materials against the project piping material specification, corrosion philosophy, client restrictions, and procurement requirements.",
      "Restricted alternatives require documented engineering review before use.",
    ],
  },
  {
    id: "thickness",
    icon: Calculator,
    title: "Wall Thickness Calculation",
    summary: "Calculate pressure design thickness and corrosion-adjusted required wall.",
    content: [
      "The wall-thickness workflow follows ASME B31.3 pressure-design logic for straight pipe using pressure, diameter, stress, coefficient, weld joint factor, corrosion allowance, and mill tolerance inputs.",
      "Results show required pressure thickness, corrosion-adjusted thickness, mill-tolerance adjusted thickness, selected schedule thickness, and utilization or margin where available.",
      "The calculated requirement feeds the Pipe Schedule module and PMS schedule validation so the PMS should not select a schedule below the calculated requirement.",
    ],
    review: [
      "Verify stress values, temperature basis, joint factor, Y coefficient, and corrosion allowance against licensed source documents and project specifications.",
      "If calculated thickness exceeds available standard schedules, the app should flag the condition rather than invent a schedule.",
    ],
  },
  {
    id: "schedule",
    icon: Ruler,
    title: "Pipe Schedule",
    summary: "Select mechanically realistic pipe schedules using shared schedule logic.",
    content: [
      "The schedule engine compares the required wall against available schedules from the applicable pipe dimension standard.",
      "Carbon steel and alloy steel pipe dimensions draw from ASME B36.10M; stainless steel pipe dimensions draw from ASME B36.19M where applicable.",
      "The recommendation considers required wall, available thickness, service-specific small-bore philosophy, common-use schedules, stock rationalization, and project review warnings.",
      "Batch calculation can evaluate multiple NPS values for line-list and PMS development.",
    ],
    review: [
      "The selected PMS schedule must be equal to or thicker than the calculated required schedule for each line size.",
      "Instrument air and other utility services may use a service-specific philosophy; review overschedule warnings against the client PMS and maintenance practice.",
    ],
  },
  {
    id: "flanges",
    icon: CircleDot,
    title: "Flanges & Fittings",
    summary: "Evaluate flange class, flange material, fitting type, end connection, and applicable size standard.",
    content: [
      "Flange logic considers design pressure, design temperature, material group, pressure-temperature rating data, NPS range, and service severity.",
      "ASME B16.5 is used for applicable flange size ranges; ASME B16.47 applies where larger-size logic is needed.",
      "Fittings and branch decisions consider small-bore versus large-bore practice, SW/BW philosophy, fitting family, pressure class, and material continuity.",
      "Missing fitting or bolting data should fail closed with a warning rather than fabricate values.",
    ],
    review: [
      "Confirm rating class, facing, end connection, and fitting pressure class against the governing PMS and client details.",
      "Class, material group, and gasket facing decisions should be reviewed together.",
    ],
  },
  {
    id: "valves",
    icon: Settings2,
    title: "Valves & Valve Datasheets",
    summary: "Generate service-driven body, trim, seat, packing, bore, and fire-test recommendations.",
    content: [
      "Valve recommendations use service type, fluid severity, temperature, pressure class, size range, and material family.",
      "Body, trim, seat, packing, bore type, fire-test requirement, and critical-service notes are generated from service-driven logic instead of a single global default.",
      "The valve class table and datasheet views should remain consistent with the material selection and PMS material continuity tables.",
      "Soft seat, metal seat, oxygen-cleaned, sour-service, high-temperature, cryogenic, and fire-test recommendations include rationale and caution notes where applicable.",
    ],
    review: [
      "Vendor datasheets, project valve specifications, NACE suitability, oxygen-cleaning documentation, fugitive-emission requirements, and fire-test qualifications remain project review items.",
      "Do not treat a valve datasheet generated by the app as a purchase approval.",
    ],
  },
  {
    id: "bolting",
    icon: Bolt,
    title: "Bolting & Gasket",
    summary: "Review bolt grade, nut grade, gasket type, facing, class, size, and service compatibility.",
    content: [
      "Bolting and gasket logic considers flange rating, temperature, service condition, sour-service limits, gasket facing, and material compatibility.",
      "The module should use referenced table data for supported combinations and warn when the requested NPS/class combination is outside the loaded dataset.",
      "Generated BOM values are decision-support quantities and should be checked against flange standard tables and project bolting practice.",
    ],
    review: [
      "Confirm bolt material, coating, hardness limits, gasket filler/winding/ring materials, and insulation kit needs against project requirements.",
      "For sour, oxygen, cyclic, high-temperature, or low-temperature service, require documented suitability from the responsible project workflow.",
    ],
  },
  {
    id: "support",
    icon: Wrench,
    title: "Support Span",
    summary: "Estimate support spacing for empty, operating, and hydrotest conditions.",
    content: [
      "Support-span calculations consider pipe size, wall thickness, material, contents, insulation, operating case, hydrotest case, and deflection limits.",
      "The output gives useful layout guidance for early design and training, but it is not a replacement for project stress analysis or pipe support engineering.",
      "Use the result to identify likely support needs, then review with the responsible layout/stress/support workflow.",
    ],
    review: [
      "Special loads, vibration, wind, seismic, slug flow, equipment nozzle loads, shoe details, guides, anchors, and expansion loops require project-specific review.",
    ],
  },
  {
    id: "checks",
    icon: ClipboardCheck,
    title: "B31.3 Design Review Checks",
    summary: "Structured review prompts aligned to the B31.3 workflow.",
    content: [
      "Design Review Checks summarize calculated values, input basis, reference points, warning states, and review status.",
      "Checks can show pass, fail, warning, review, or missing states. These states help organize review; they are not formal engineering approval.",
      "Expanded rows show the input data used by each check and whether values came from loaded inputs, automatic recommendations, or overrides.",
      "Use the comments field to record project reasoning, assumptions, or follow-up items.",
    ],
    review: [
      "A clear check screen does not guarantee code compliance. Final review must consider the full design basis, code edition, client specification, and project context.",
      "Warnings and overrides should be resolved, justified, or carried as formal review comments before sharing outputs.",
    ],
  },
  {
    id: "pms",
    icon: FileText,
    title: "Material Spec / PMS Generator",
    summary: "Build traceable piping material specification drafts from shared engineering logic.",
    content: [
      "The PMS generator assembles pipe, nipples, fittings, valves, flanges, gaskets, bolting, branch connections, design basis, notes, continuity checks, and print/export views.",
      "PMS pipe schedules use the shared schedule engine so PMS schedule choices align with wall-thickness and Pipe Schedule results.",
      "Branch connection logic applies the T/R/W/S matrix and step-down philosophy for the configured size ranges.",
      "Continuity tables compare material families and highlight mismatches, including valve body/trim/seat consistency.",
      "Print Preview and Word export provide professional review packages with source references and engineering-review wording.",
    ],
    review: [
      "Treat PMS output as a draft/specification assistant package until checked against the project PMS, client standards, material availability, and responsible engineering review.",
      "Do not remove review notes, source references, or disclaimers from exported PMS outputs.",
    ],
  },
  {
    id: "reports",
    icon: FileOutput,
    title: "Reports & Exports",
    summary: "Generate traceable PDF, Excel, Word, PMS, and dataset outputs for review.",
    content: [
      "Reports are generated from the current app state and include source references, assumptions, warnings, and engineering-review wording where applicable.",
      "Typical outputs include wall thickness, pipe schedule, material selection, flanges/fittings, bolting/gasket, support span, design review summary, PMS, valve datasheet content, and dataset exports.",
      "Exports help communicate design basis and calculation evidence. They do not certify the design or replace formal checking procedures.",
    ],
    review: [
      "Before sharing a report, confirm project name, input basis, source dataset, warnings, overrides, units, and revision context.",
      "Reports generated from default or training datasets should be clearly understood as reference/training outputs unless project-specific data has been accepted.",
    ],
  },
  {
    id: "spec-library",
    icon: Library,
    title: "Spec Library",
    summary: "Save, compare, import, export, and reuse material specifications.",
    content: [
      "The Spec Library stores PMS outputs and reusable specification records for project or global workspace use.",
      "Users can compare specs side by side to understand changes in class, schedule, material family, branch philosophy, valve requirements, and service notes.",
      "JSON import/export supports portability between devices or workspaces.",
    ],
    review: [
      "Reusable specs should be reviewed before reuse on a new project because design pressure, temperature, corrosion allowance, client requirements, and service severity may change.",
    ],
  },
  {
    id: "auth",
    icon: Lock,
    title: "Account, Cloud Sync & Licensed Workspace",
    summary: "Understand sign-in, entitlement state, access messaging, and future payment separation.",
    content: [
      "The app can run locally with offline-first storage. Signing in enables account-linked features such as cloud sync when the backend is configured.",
      "Licensed Workspace messaging describes entitlement-backed access without presenting the app as restricted evaluation software.",
      "Payment checkout is not active in this build. Production payment processing can be configured later without changing engineering calculations.",
      "Default Engineering Dataset workflows remain available for reference and training; custom/licensed workspace behavior is used when users import or edit their own data.",
    ],
    review: [
      "Cloud sync and entitlement behavior should be verified in the live production environment before commercial release.",
      "Do not store secrets or licensed standard documents in client-side code.",
    ],
  },
  {
    id: "offline",
    icon: WifiOff,
    title: "Offline, PWA & Desktop Use",
    summary: "Use the app on desktop and mobile with offline-first behavior.",
    content: [
      "The PWA can cache the application shell and bundled reference workflows for offline use.",
      "The browser only offers native installation when the browser confirms the app is installable on that device.",
      "Local projects and datasets are stored in browser storage/IndexedDB. If cloud sync is configured, signed-in changes can sync after reconnection.",
      "Desktop and mobile layouts are designed for touch targets, readable text, horizontal table scrolling, and module navigation.",
    ],
    review: [
      "Offline users should verify they are working with the intended dataset version before relying on outputs for project review.",
      "Browser storage can be affected by device policies or manual clearing; important project records should be synced or exported where appropriate.",
    ],
  },
  {
    id: "mobile",
    icon: MonitorSmartphone,
    title: "Mobile & Desktop UI",
    summary: "Use the same engineering workflow across phones, tablets, and desktop screens.",
    content: [
      "On mobile, primary navigation uses touch-friendly controls and horizontally scrollable tables where required.",
      "Compact engineering tables remain available, but users should open detail panels and exports for deeper review.",
      "Desktop layouts provide denser tables and side-by-side review where screen space allows.",
    ],
    tips: [
      "Use mobile for review, training, field reference, and light edits. Use desktop for detailed PMS/report review when possible.",
    ],
  },
  {
    id: "qa",
    icon: GitCompare,
    title: "QA, Regression & Engineering Validation",
    summary: "How to think about test coverage and engineering confidence.",
    content: [
      "The app includes automated tests for engineering data integrity, workflow continuity, schedule/PMS alignment, report wording, production readiness, accessibility, and smoke coverage.",
      "Regression tests help prevent known mismatches, such as PMS schedules falling below calculated requirements or valve materials diverging across modules.",
      "Testing increases confidence, but independent benchmark cases and project-specific review remain necessary for production engineering use.",
      `Final release dataset packages should carry this attestation: ${DATASET_RELEASE_ATTESTATION_TEXT.replace(/\n/g, " / ")}.`,
    ],
    review: [
      "For production release, maintain signed engineering dataset governance, source versioning, change logs, regression fixtures, external benchmark cases, monitoring/error tracking, security review evidence, and rollback procedures.",
      "The release attestation verifies bundled dataset package integrity for the app release. It does not approve project use of the dataset or replace engineering review.",
    ],
  },
];

const quickStartSteps = [
  {
    title: "Confirm the workflow basis",
    body: "Start on Home. Confirm the active project, dataset state, warning count, and whether you are using default, custom, or licensed workspace data.",
  },
  {
    title: "Review source data",
    body: "Open Source & Reference Library. Confirm the standards, tables, default data, imported data, deleted records, and revert-to-default options before calculations.",
  },
  {
    title: "Create or open a project",
    body: "Use the Active Project workflow to create, select, or clear a project. Clear resets the working session without deleting saved records.",
  },
  {
    title: "Enter the design basis",
    body: "In Design Inputs, define NPS, pressure, temperature, material, service type, fluid, corrosion allowance, and related design parameters.",
  },
  {
    title: "Calculate and review",
    body: "Run calculations, then review Wall Thickness, Pipe Schedule, Material Selection, Flanges/Fittings, Bolting/Gasket, Valves, Support Span, and Design Review Checks.",
  },
  {
    title: "Generate PMS and reports",
    body: "Use the PMS Generator, Reports, Valve Datasheet, and Spec Library outputs as traceable review packages, not automatic engineering approvals.",
  },
  {
    title: "Resolve warnings and overrides",
    body: "Review every warning, missing value, and override. Record comments or project reasoning where the app provides comment fields.",
  },
  {
    title: "Save, sync, or export",
    body: "Save the project locally, sync when signed in and configured, or export records for review. Keep source references and review wording intact.",
  },
];

function SectionCard({ section }: { section: ManualSection }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = section.icon;

  return (
    <div className="eng-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full min-h-10 flex items-start gap-3 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 shrink-0 mt-0.5">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{section.title}</h3>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{section.summary}</p>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 ml-0 sm:ml-11 space-y-3">
          <div className="space-y-2">
            {section.content.map((para, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">{para}</p>
            ))}
          </div>
          {section.review && section.review.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
              <div className="text-[10px] font-semibold text-foreground uppercase tracking-wide mb-1.5">Review Notes</div>
              <ul className="space-y-1">
                {section.review.map((note, i) => (
                  <li key={i} className="text-xs text-foreground/85 flex gap-2">
                    <span className="text-amber-400 shrink-0">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {section.tips && section.tips.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded p-3">
              <div className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1.5">Tips</div>
              <ul className="space-y-1">
                {section.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function UserManualModule() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">How to Use</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          A task-oriented guide to {PRODUCT_NAME}: engineering decision support, training, traceability, and review preparation.
        </p>
      </div>

      <div className="eng-card bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Rocket className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Recommended Workflow</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Follow these steps to keep the engineering basis, datasets, calculations, PMS outputs, reports, and review notes aligned.
        </p>
        <ol className="space-y-2">
          {quickStartSteps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary font-mono text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-semibold">{s.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
          Complete Module Reference
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Expand each section for scope, usage, traceability, and review notes. The manual intentionally uses decision-support language because the app does not provide engineering approval, certification, or official standards endorsement.
        </p>
        <div className="space-y-3">
          {manualSections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}
