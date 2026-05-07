import {
  APP_VERSION,
  APP_BUILD_DATE,
  DATASET_VERSION,
  DATASET_LAST_UPDATED,
  DATASET_RELEASE_ATTESTATION_LINES,
  SUPPORT_EMAIL,
} from "@/lib/appVersion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Wifi, WifiOff, Shield, FileText, Mail, Database, Package, Scale, Sparkles } from "lucide-react";
import { EngineeringDisclaimer } from "@/components/EngineeringDisclaimer";
import { getEulaAcceptance, EULA_VERSION } from "@/lib/eula";
import { useEntitlements } from "@/hooks/useEntitlements";
import { appEnv } from "@/lib/env";
import { DATASET_WORKFLOW_NOTICE, ENGINEERING_REVIEW_NOTICE, PRODUCT_NAME, PRODUCT_OWNER, PRODUCT_POSITIONING } from "@/lib/brand";
import { sendReleaseHealthcheck } from "@/lib/monitoring";

function Row({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-mono">{value}</div>
    </div>
  );
}

interface AboutModuleProps {
  onNavigate?: (tab: string) => void;
}

export function AboutModule({ onNavigate }: AboutModuleProps = {}) {
  const online = useOnlineStatus();
  const eula = getEulaAcceptance();
  const { tier, isPaid, devPaidOverride, setDevPaidOverride, demoRunsUsed, demoRunsLimit, resetDemoRuns, sampleDataMode, sampleDataModified } = useEntitlements();
  const showDevAccessControls = appEnv.allowDevEntitlementOverride;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold">About {PRODUCT_NAME}</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {PRODUCT_POSITIONING}. Version, dataset, and release information for this build.
        </p>
      </div>

      <EngineeringDisclaimer />

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Workspace Access
        </div>
        <Row icon={Sparkles} label="Workspace" value={
          <span className={isPaid ? "text-green-400" : "text-amber-300"}>{isPaid ? "LICENSED" : "REFERENCE"}{showDevAccessControls && devPaidOverride ? " (dev override)" : ""}</span>
        } />
        <Row icon={Shield} label="Reference dataset" value={sampleDataMode ? (sampleDataModified ? "Edited / custom workspace" : "Active") : "Not loaded"} />
        <Row icon={Database} label="Reference workflow runs" value={Number.isFinite(demoRunsLimit) ? `${demoRunsUsed} / ${demoRunsLimit}` : `${demoRunsUsed} (unlimited)`} />
        <div className="flex flex-wrap gap-2 pt-3">
          {showDevAccessControls && (
            <button
              onClick={() => setDevPaidOverride(!devPaidOverride)}
              className="min-h-10 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary/50"
            >
              {devPaidOverride ? "Disable" : "Enable"} dev paid override
            </button>
          )}
          <button
            onClick={resetDemoRuns}
            className="min-h-10 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary/50"
          >
            Reset reference runs
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Licensed workspace access is granted from server-backed roles. Default engineering datasets remain available for reference workflows and training.
          {showDevAccessControls ? " Dev override is enabled for this development build only." : ""}
        </p>
      </section>

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-primary" /> Application
        </div>
        <Row icon={Package} label="App version" value={APP_VERSION} />
        <Row icon={FileText} label="Build date" value={APP_BUILD_DATE} />
        <Row
          icon={online ? Wifi : WifiOff}
          label="Connection"
          value={
            <span className={online ? "text-green-600" : "text-accent"}>
              {online ? "Online" : "Offline (full functionality)"}
            </span>
          }
        />
      </section>

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-primary" /> Engineering Datasets
        </div>
        <Row icon={Database} label="Bundled dataset version" value={DATASET_VERSION} />
        <Row icon={FileText} label="Last updated" value={DATASET_LAST_UPDATED} />
        <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-primary mb-1">Release Attestation</div>
          <div className="space-y-0.5 font-mono text-xs text-foreground">
            {DATASET_RELEASE_ATTESTATION_LINES.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            This attestation applies to the bundled application dataset package for this release. It is not project approval or checker sign-off.
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          {DATASET_WORKFLOW_NOTICE} Includes ASME B36.10M (pipe schedules), ASME B16.5 (flange P-T ratings),
          and ASME Section II-D (allowable stress) reference data. All baseline
          datasets are available offline. Project-specific overrides and saved
          specs are stored on this device.
        </p>
      </section>

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-primary" /> Production Release Controls
        </div>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>Signed engineering dataset governance and source-version change logs.</li>
          <li>External benchmark cases for B31.3, B36.10M, B36.19M, B16.5, bolting/gasket, fittings, valves, PMS, and reports.</li>
          <li>Production monitoring, error tracking, incident triage, and release rollback procedure.</li>
          <li>Security review, secret-rotation confirmation, cloud/RLS verification, and entitlement verification before commercial rollout.</li>
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground">
          These controls support release quality. They do not convert app outputs into certified engineering deliverables.
        </p>
        <button
          type="button"
          onClick={sendReleaseHealthcheck}
          disabled={!appEnv.monitoringEndpoint}
          className="mt-3 min-h-10 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-secondary/50 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          title={appEnv.monitoringEndpoint ? "Send a release healthcheck event to the configured monitoring endpoint" : "Configure VITE_MONITORING_ENDPOINT to enable monitoring healthcheck"}
        >
          Send monitoring healthcheck
        </button>
      </section>

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-primary" /> Privacy
        </div>
        <p className="text-xs text-muted-foreground">
          Engineering inputs, saved projects, and the spec library are stored locally in your browser
          (IndexedDB / localStorage) and never transmitted unless you explicitly sign in to enable cloud
          sync. Reference tables and calculations execute entirely on-device. No payment provider is active
          in this build.
        </p>
        <button
          onClick={() => onNavigate?.("privacy")}
          className="mt-2 min-h-10 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-secondary/50 text-foreground"
        >
          View full Privacy Notice
        </button>
      </section>

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary" /> Terms & Disclaimer
        </div>
        <p className="text-xs text-muted-foreground">
          {ENGINEERING_REVIEW_NOTICE}
        </p>
      </section>

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-primary" /> End User License Agreement
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          The full EULA governs your use of this application, including disclaimers,
          limitation of liability, and data-storage responsibilities.
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] font-mono text-muted-foreground">
            EULA v{EULA_VERSION} ·{" "}
            {eula
              ? <span className="text-green-600">Accepted {new Date(eula.acceptedAt).toLocaleDateString()}</span>
              : <span className="text-accent">Not accepted</span>}
          </div>
          <button
            onClick={() => onNavigate?.("eula")}
            className="min-h-10 text-xs px-2.5 py-1.5 rounded-md border border-border hover:bg-secondary/50 text-foreground"
          >
            View EULA
          </button>
        </div>
      </section>

      <section className="eng-card">
        <div className="eng-label mb-2 flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-primary" /> Support
        </div>
        <p className="text-xs text-muted-foreground">
          For questions, defect reports, or dataset update requests, contact{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        {PRODUCT_NAME} · by {PRODUCT_OWNER}
      </p>
    </div>
  );
}
