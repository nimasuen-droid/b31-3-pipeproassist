import { useState } from "react";
import { Home, FileInput, Calculator, Ruler, MoreHorizontal, Lock } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useEntitlements, FREE_MODULE_IDS } from "@/hooks/useEntitlements";

type Tab = { id: string; label: string; icon: React.ComponentType<{ className?: string }> };

const PRIMARY: Tab[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "inputs", label: "Inputs", icon: FileInput },
  { id: "thickness", label: "Calc", icon: Calculator },
  { id: "schedule", label: "Schedule", icon: Ruler },
];

interface Props {
  activeTab: string;
  onChange: (id: string) => void;
  allTabs: Tab[];
}

export function MobileBottomNav({ activeTab, onChange, allTabs }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { isPaid } = useEntitlements();
  const primaryIds = new Set(PRIMARY.map((t) => t.id));
  const moreTabs = allTabs.filter((t) => !primaryIds.has(t.id));
  const moreActive = !primaryIds.has(activeTab);

  const renderBtn = (tab: Tab, active: boolean, onClick: () => void) => {
    const locked = !isPaid && !FREE_MODULE_IDS.has(tab.id);
    return (
      <button
        key={tab.id}
        onClick={onClick}
        aria-label={`${tab.label}${locked ? " paid module" : ""}`}
        className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition-colors ${
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
        }`}
      >
        <div className="relative">
          <tab.icon className="h-5 w-5" aria-hidden="true" />
          {locked && <Lock className="absolute -right-2 -top-1 h-3 w-3 text-amber-400" aria-hidden="true" />}
        </div>
        <span className="max-w-[72px] truncate leading-tight">{tab.label}</span>
      </button>
    );
  };

  return (
    <nav data-onboarding="nav" className="z-40 flex shrink-0 items-stretch gap-1.5 border-t border-border bg-card px-2 pt-1.5 shadow-2xl shadow-black/30 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
      {PRIMARY.map((tab) => renderBtn(tab, activeTab === tab.id, () => onChange(tab.id)))}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Open all modules"
            className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium transition-colors ${
              moreActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span className="leading-tight">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[82vh] overflow-y-auto p-0">
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background p-4 text-left">
            <SheetTitle>All Modules</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2.5 p-3 sm:grid-cols-3 sm:p-4">
            {moreTabs.map((tab) => {
              const locked = !isPaid && !FREE_MODULE_IDS.has(tab.id);
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onChange(tab.id);
                    setMoreOpen(false);
                  }}
                  className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-md border p-2 text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <div className="relative">
                    <tab.icon className="h-5 w-5" aria-hidden="true" />
                    {locked && <Lock className="absolute -right-2 -top-1 h-3.5 w-3.5 text-amber-400" aria-hidden="true" />}
                  </div>
                  <span className="text-center leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
