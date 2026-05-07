import { useState, lazy, Suspense, useEffect, useRef } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import {
  Home, FileInput, Layers, Calculator, Ruler, CircleDot, Wrench,
  Bolt, Gauge, ClipboardCheck, FileOutput, BookOpen,
  ChevronLeft, ChevronRight, FolderOpen, FileText, Library, HelpCircle,
  Disc, Sparkles, Info, Scale, Lock, Crown, Shield, Receipt,
  Menu,
} from "lucide-react";
import { OnboardingTour, useOnboarding } from "@/components/OnboardingTour";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import { EulaGate } from "@/components/EulaGate";
import { InstallBanner } from "@/components/InstallBanner";
import { InstallButton } from "@/components/InstallButton";
import { PricingPage } from "@/components/PricingPage";
import { DATASET_VERSION, APP_VERSION } from "@/lib/appVersion";
import { PRODUCT_NAME, PRODUCT_SHORT_NAME } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useDesignInputs, DesignInputsProvider } from "@/stores/designInputsStore";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { ChangeProjectDialog } from "@/components/ChangeProjectDialog";
import { EntitlementsProvider, useEntitlements } from "@/hooks/useEntitlements";
import { PaidGate } from "@/components/PaidGate";
import { FREE_MODULE_IDS } from "@/hooks/useEntitlements";
import { TraceabilityPanel } from "@/components/TraceabilityPanel";
import { HomeModule } from "@/components/modules/HomeModule";
// Eager-load small/lightweight modules — avoids Suspense flash for these tabs.
import { AboutModule } from "@/components/modules/AboutModule";
import { EulaModule } from "@/components/modules/EulaModule";
import { UserManualModule } from "@/components/modules/UserManualModule";
import { SupportSpanModule } from "@/components/modules/SupportSpanModule";
import { BoltingGasketModule } from "@/components/modules/BoltingGasketModule";
import { PrivacyPolicyModule } from "@/components/modules/PrivacyPolicyModule";
import { RefundPolicyModule } from "@/components/modules/RefundPolicyModule";

// Lazy-loaded modules — each becomes its own chunk. Importers are stored
// so we can prefetch on hover (warm the chunk before the user clicks).
const importers: Record<string, () => Promise<unknown>> = {
  inputs: () => import("@/components/modules/DesignInputsModule"),
  thickness: () => import("@/components/modules/WallThicknessModule"),
  checks: () => import("@/components/modules/DesignChecksModule"),
  "source-library": () => import("@/components/modules/SourceLibraryModule"),
  reports: () => import("@/components/modules/ReportsModule"),
  material: () => import("@/components/modules/MaterialSelectionModule"),
  schedule: () => import("@/components/modules/PipeScheduleModule"),
  flanges: () => import("@/components/modules/FlangesModule"),
  valves: () => import("@/components/modules/ValvesModule"),
  projects: () => import("@/components/modules/SavedProjectsModule"),
  pms: () => import("@/components/modules/PipingMaterialSpecModule"),
  "spec-library": () => import("@/components/modules/SpecLibraryModule"),
};

const prefetched = new Set<string>();
const prefetchModule = (id: string) => {
  if (prefetched.has(id)) return;
  const fn = importers[id];
  if (!fn) return;
  prefetched.add(id);
  fn().catch(() => prefetched.delete(id));
};

const DesignInputsModule = lazy(() => importers.inputs().then((m: any) => ({ default: m.DesignInputsModule })));
const WallThicknessModule = lazy(() => importers.thickness().then((m: any) => ({ default: m.WallThicknessModule })));
const DesignChecksModule = lazy(() => importers.checks().then((m: any) => ({ default: m.DesignChecksModule })));
const SourceLibraryModule = lazy(() => importers["source-library"]().then((m: any) => ({ default: m.SourceLibraryModule })));
const ReportsModule = lazy(() => importers.reports().then((m: any) => ({ default: m.ReportsModule })));
const MaterialSelectionModule = lazy(() => importers.material().then((m: any) => ({ default: m.MaterialSelectionModule })));
const PipeScheduleModule = lazy(() => importers.schedule().then((m: any) => ({ default: m.PipeScheduleModule })));
const FlangesModule = lazy(() => importers.flanges().then((m: any) => ({ default: m.FlangesModule })));
const ValvesModule = lazy(() => importers.valves().then((m: any) => ({ default: m.ValvesModule })));
const SavedProjectsModule = lazy(() => importers.projects().then((m: any) => ({ default: m.SavedProjectsModule })));
const PipingMaterialSpecModule = lazy(() => importers.pms().then((m: any) => ({ default: m.PipingMaterialSpecModule })));
const SpecLibraryModule = lazy(() => importers["spec-library"]().then((m: any) => ({ default: m.SpecLibraryModule })));

const ModuleFallback = () => (
  <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
    <div className="animate-pulse">Loading module…</div>
  </div>
);

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "projects", label: "Saved Projects", icon: FolderOpen },
  { id: "inputs", label: "Inputs", icon: FileInput },
  { id: "material", label: "Material Selection", icon: Layers },
  { id: "thickness", label: "Thickness Calc", icon: Calculator },
  { id: "schedule", label: "Pipe Schedule", icon: Ruler },
  { id: "flanges", label: "Flanges & Fittings", icon: CircleDot },
  { id: "bolting", label: "Bolting & Gasket", icon: Bolt },
  { id: "valves", label: "Valves", icon: Disc },
  { id: "support", label: "Support Span", icon: Wrench },
  { id: "checks", label: "B31.3 Checks", icon: ClipboardCheck },
  { id: "reports", label: "Reports", icon: FileOutput },
  { id: "pms", label: "Material Spec", icon: FileText },
  { id: "spec-library", label: "Spec Library", icon: Library },
  { id: "source-library", label: "Source Library", icon: BookOpen },
  { id: "manual", label: "User Manual", icon: HelpCircle },
  { id: "pricing", label: "Request Access", icon: Crown },
  { id: "about", label: "About & Release", icon: Info },
  { id: "eula", label: "Terms (EULA)", icon: Scale },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "refund", label: "Refund Policy", icon: Receipt },
];

const workflowTabIds = [
  "inputs",
  "material",
  "thickness",
  "schedule",
  "flanges",
  "bolting",
  "valves",
  "support",
  "checks",
  "reports",
  "pms",
];

function SessionHeader({ mobileMenuOpen, setMobileMenuOpen, onStartTour }: { mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void; onStartTour: () => void }) {
  const { sessionSource, calculated, inputs, setSessionSource } = useDesignInputs();
  const { selectedProject, selectedProjectId, setSelectedProjectId } = useSelectedProject();
  const [changeOpen, setChangeOpen] = useState(false);
  const activeNps = inputs.nominalPipeSize?.replace(/['"]/g, "").trim() || "—";

  // Prefer the persisted selected project as the source of truth for the active project label.
  const activeProjectName = selectedProject?.name ?? (sessionSource.type === "project" ? sessionSource.name : null);
  const activeSpecName = sessionSource.type === "spec" ? sessionSource.name : null;

  const handleClearProject = () => {
    setSelectedProjectId(null);
    setSessionSource({ type: "unsaved", name: "New Session" });
  };

  return (
    <header className="h-14 md:h-12 bg-card border-b border-border flex items-center px-3 md:px-4 shrink-0 justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <Gauge className="h-5 w-5 text-primary shrink-0" />
        <span className="font-semibold text-sm tracking-tight truncate">
          <span className="hidden sm:inline">{PRODUCT_NAME}</span>
          <span className="sm:hidden">{PRODUCT_SHORT_NAME}</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground hidden md:inline">by Nosa Imasuen</span>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 md:gap-2 text-xs text-muted-foreground">
        <span className="hidden lg:inline">v{APP_VERSION}</span>
        <span className="hidden lg:inline opacity-50">·</span>
        <span className="hidden lg:inline" title="Bundled engineering dataset version">DS {DATASET_VERSION}</span>
        <span className="hidden lg:inline opacity-50">|</span>

        {activeProjectName ? (
          <span className="hidden md:inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary max-w-[260px]">
            <FolderOpen className="h-3 w-3 shrink-0" />
            <span className="truncate">Active Project: {activeProjectName}</span>
            <button
              onClick={() => setChangeOpen(true)}
              className="ml-1 underline-offset-2 hover:underline"
              title="Switch to a different project"
            >Change</button>
            <span className="opacity-40">·</span>
            <button
              onClick={handleClearProject}
              className="hover:underline underline-offset-2"
              title="Clear active project (does not delete it)"
            >Clear</button>
          </span>
        ) : (
          <span className="hidden md:inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
            <FolderOpen className="h-3 w-3 shrink-0" />
            No active project
            <button
              onClick={() => setChangeOpen(true)}
              className="ml-1 underline-offset-2 hover:underline"
            >Select</button>
          </span>
        )}

        {activeSpecName && (
          <Badge variant="default" className="text-[10px] hidden md:inline-flex">
            <FileText className="h-3 w-3 mr-1" /> Spec: {activeSpecName}
          </Badge>
        )}

        <Badge
          variant="outline"
          className="text-[10px] inline-flex border-primary/40 text-primary"
          title="Active design-basis pipe size for this line. Set on the Inputs tab."
        >
          <span className="hidden sm:inline">Active Line NPS:&nbsp;</span>
          <span className="sm:hidden">NPS&nbsp;</span>
          <span className="font-mono">{activeNps}{activeNps !== "—" ? "\"" : ""}</span>
        </Badge>
        {calculated && <Badge variant="outline" className="text-[10px] hidden md:inline-flex text-green-600 border-green-600/30">Calculated</Badge>}
        <span className="hidden sm:inline-flex">
          <InstallButton />
        </span>
        <button
          data-onboarding="help"
          onClick={onStartTour}
          className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary/50"
          title="How to use this app"
          aria-label="How to use this app"
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">How to Use</span>
        </button>
      </div>

      <ChangeProjectDialog
        open={changeOpen}
        onOpenChange={setChangeOpen}
        currentId={selectedProjectId}
        onSelect={(p) => {
          setSelectedProjectId(p.id);
          setSessionSource({ type: "project", name: p.name, id: p.id });
        }}
      />
    </header>
  );
}

function NavTabButton({ tab, active, collapsed, onClick, onPrefetch }: {
  tab: { id: string; label: string; icon: React.ComponentType<{ className?: string }> };
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
  onPrefetch: () => void;
}) {
  const { isPaid } = useEntitlements();
  const isLocked = !isPaid && !FREE_MODULE_IDS.has(tab.id);
  return (
    <button
      onClick={onClick}
      aria-label={`${tab.label}${isLocked ? " licensed workspace module" : ""}`}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
      onTouchStart={onPrefetch}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
        active
          ? "text-primary bg-primary/10 border-r-2 border-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      } ${collapsed ? "justify-center px-0" : ""}`}
      title={collapsed ? `${tab.label}${isLocked ? " (Licensed workspace)" : ""}` : isLocked ? "Licensed workspace module - reference dataset access available" : undefined}
    >
      <tab.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate flex-1 text-left">{tab.label}</span>}
      {!collapsed && isLocked && <Lock className="h-3 w-3 shrink-0 text-amber-400" aria-hidden="true" />}
    </button>
  );
}

function FloatingWorkflowNav({
  activeTab,
  onNavigate,
}: {
  activeTab: string;
  onNavigate: (id: string) => void;
}) {
  const { calculated } = useDesignInputs();
  const { isPaid } = useEntitlements();
  const [open, setOpen] = useState(false);
  const workflowTabs = workflowTabIds
    .map((id) => tabs.find((tab) => tab.id === id))
    .filter(Boolean) as typeof tabs;
  const activeIndex = workflowTabs.findIndex((tab) => tab.id === activeTab);
  const previousTab = activeIndex > 0 ? workflowTabs[activeIndex - 1] : undefined;
  const nextTab = activeIndex >= 0 ? workflowTabs[activeIndex + 1] : workflowTabs[0];

  const go = (id: string) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <div className="sticky bottom-3 z-50 mt-4 flex items-end justify-between gap-2 pointer-events-none md:bottom-6 md:flex-col md:items-end">
      <div className="flex min-w-0 max-w-[calc(100vw-6rem)] flex-wrap gap-2 pointer-events-none md:max-w-full md:flex-col md:items-end">
        {previousTab && (
          <button
            onClick={() => go(previousTab.id)}
            className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-amber-400/50 bg-amber-950 px-4 py-2.5 text-sm font-semibold text-amber-100 shadow-lg shadow-black/35 ring-1 ring-amber-300/20 hover:bg-amber-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Back: {previousTab.label}
          </button>
        )}
        {calculated && nextTab && (
          <button
            onClick={() => go(nextTab.id)}
            className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-black/35 ring-1 ring-primary/30 hover:brightness-110"
          >
            Next: {nextTab.label}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="pointer-events-auto ml-auto inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-lg shadow-black/35 hover:bg-secondary">
            <Menu className="h-5 w-5" />
            <span className="hidden sm:inline">Workflow</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[min(92vw,380px)] overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background p-4 text-left">
            <SheetTitle>Workflow Navigation</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 p-3">
            {workflowTabs.map((tab, index) => {
              const locked = !isPaid && !FREE_MODULE_IDS.has(tab.id);
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => go(tab.id)}
                  className={`flex w-full min-h-14 items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-mono">
                    {index + 1}
                  </span>
                  <tab.icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{tab.label}</span>
                    {locked && <span className="block text-xs text-amber-300">Licensed workspace module</span>}
                  </span>
                  {active && <Badge variant="outline" className="text-[10px]">Current</Badge>}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}


export default function Index() {
  const [activeTab, setActiveTab] = useLocalStorage<string>("ui:active-tab", "home");
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>("ui:sidebar-collapsed", false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const onboarding = useOnboarding();

  // After mount, prefetch commonly used module chunks during browser idle time
  // so the first click on each tab is instant.
  useEffect(() => {
    const ric: any =
      (typeof window !== "undefined" && (window as any).requestIdleCallback) ||
      ((cb: () => void) => setTimeout(cb, 1500));
    const priority = ["inputs", "material", "thickness", "schedule", "flanges", "checks", "reports", "pms"];
    ric(() => {
      priority.forEach((id, i) => setTimeout(() => prefetchModule(id), i * 150));
      setTimeout(() => Object.keys(importers).forEach(prefetchModule), priority.length * 150 + 500);
    });
  }, []);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const tabLabel = (id: string) => tabs.find(t => t.id === id)?.label ?? id;
  const gate = (id: string, node: React.ReactNode) =>
    FREE_MODULE_IDS.has(id)
      ? node
      : <PaidGate
          moduleId={id}
          moduleName={tabLabel(id)}
          onGoToInputs={() => setActiveTab("inputs")}
          onGoToPricing={() => setActiveTab("pricing")}
        >{node}</PaidGate>;

  const renderModule = () => {
    switch (activeTab) {
      case "home": return <HomeModule onNavigate={setActiveTab} />;
      case "projects": return <SavedProjectsModule />;
      case "inputs": return <DesignInputsModule />;
      case "material": return gate("material", <MaterialSelectionModule />);
      case "thickness": return <WallThicknessModule />;
      case "schedule": return gate("schedule", <PipeScheduleModule />);
      case "flanges": return gate("flanges", <FlangesModule />);
      case "bolting": return gate("bolting", <BoltingGasketModule />);
      case "valves": return gate("valves", <ValvesModule />);
      case "support": return gate("support", <SupportSpanModule />);
      case "checks": return gate("checks", <DesignChecksModule />);
      case "source-library": return <SourceLibraryModule />;
      case "reports": return gate("reports", <ReportsModule />);
      case "pms": return gate("pms", <PipingMaterialSpecModule />);
      case "spec-library": return gate("spec-library", <SpecLibraryModule />);
      case "manual": return <UserManualModule />;
      case "pricing": return <PricingPage />;
      case "about": return <AboutModule onNavigate={setActiveTab} />;
      case "eula": return <EulaModule />;
      case "privacy": return <PrivacyPolicyModule />;
      case "refund": return <RefundPolicyModule />;
      default: return <HomeModule onNavigate={setActiveTab} />;
    }
  };

  return (
    <DesignInputsProvider>
      <EntitlementsProvider>
      <EulaGate>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <SessionHeader mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} onStartTour={onboarding.start} />
        <OfflineBanner />

        <div className="flex flex-1 overflow-hidden">
          <nav data-onboarding="desktop-nav" className={`${sidebarCollapsed ? "w-12" : "w-48"} bg-card border-r border-border flex-col shrink-0 transition-all duration-200 hidden md:flex`}>
            <div className="flex-1 py-2 overflow-y-auto">
              {tabs.map((tab) => (
                <NavTabButton
                  key={tab.id}
                  tab={tab}
                  active={activeTab === tab.id}
                  collapsed={sidebarCollapsed}
                  onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                  onPrefetch={() => prefetchModule(tab.id)}
                />
              ))}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex items-center justify-center py-2 border-t border-border text-muted-foreground hover:text-foreground"
              aria-label={sidebarCollapsed ? "Expand module navigation" : "Collapse module navigation"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
            </button>
          </nav>

          <div className="relative flex min-w-0 flex-1">
            <main ref={mainRef} data-onboarding="main" className="flex-1 overflow-y-auto p-3 pb-6 sm:p-4 sm:pb-8 md:p-6 md:pb-8">
              <div className="mx-auto max-w-5xl">
                <Suspense fallback={<ModuleFallback />}>
                  {renderModule()}
                </Suspense>
                <FloatingWorkflowNav activeTab={activeTab} onNavigate={setActiveTab} />
              </div>
            </main>
          </div>

          <div data-onboarding="output" className="hidden lg:flex">
            <TraceabilityPanel />
          </div>
        </div>
        <MobileBottomNav activeTab={activeTab} onChange={setActiveTab} allTabs={tabs} />
        <OnboardingTour open={onboarding.open} onClose={onboarding.close} onNavigate={setActiveTab} />
        <InstallBanner enabled={!onboarding.open} />
      </div>
      </EulaGate>
      </EntitlementsProvider>
    </DesignInputsProvider>
  );
}
