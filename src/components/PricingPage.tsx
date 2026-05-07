import { Check, Clock, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SUPPORT_EMAIL } from "@/lib/appVersion";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PRODUCT_NAME, PRODUCT_POSITIONING } from "@/lib/brand";

const FEATURES = [
  "Full PMS Generator with traceable source references",
  "Valve class and material selection workflows",
  "Bolting and gasket selection support",
  "Branch connection and design-check workflows",
  "Batch pipe schedule calculations",
  "Spec Library with import/export",
  "Reports, audit trail, and source traceability",
  "Custom datasets and overrides",
  "Training workflow for young piping engineers",
];

export function PricingPage() {
  const { isPaid } = useEntitlements();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-3 text-2xl font-bold md:text-3xl">
          {isPaid ? "Licensed Engineering Workspace Active" : "Licensed Workspace Access"}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          {PRODUCT_NAME} is positioned as an {PRODUCT_POSITIONING}. Payment checkout is not active in
          this build; server-backed licensed workspace roles remain in place for future commercial rollout.
        </p>
      </div>

      {isPaid && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/10 p-4 text-center text-sm">
          <Sparkles className="mr-2 inline-block h-4 w-4" />
          Your account currently has licensed workspace access from the server entitlement system.
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs text-amber-500">
              <Clock className="h-3.5 w-3.5" />
              Commercial setup pending
            </div>
            <h2 className="text-lg font-semibold">{PRODUCT_NAME}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The current release keeps custom-project modules in a licensed workspace. Contact support
              if you need access while payment setup is being finalized.
            </p>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Pipe%20Design%20Pro%20Access`}>
              <Mail className="h-4 w-4" />
              Request Workspace Access
            </a>
          </Button>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        No payment provider is active in this build. Codex will add production payment processing later.
      </p>
    </div>
  );
}
