import { SUPPORT_EMAIL } from "@/lib/appVersion";

const SELLER = "Nosa Imasuen";
const TRADING = "EngLab by NOI";
const EFFECTIVE = "1 May 2026";

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return <h3 className="mt-5 mb-1.5 text-sm font-semibold text-foreground">{n}. {children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

export function RefundPolicyModule() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Refund Policy</h2>
        <p className="mt-1 text-xs text-muted-foreground">Payment checkout is not active in this build.</p>
      </div>

      <section className="eng-card text-sm">
        <header className="mb-3 border-b border-border pb-3">
          <div className="font-mono text-[11px] text-muted-foreground">
            Seller: {SELLER} (trading as {TRADING}) - Effective: {EFFECTIVE}
          </div>
        </header>

        <H n={1}>No Active In-App Payments</H>
        <P>
          This build does not include an active payment provider or in-app checkout. The Software does not
          collect card, bank, or payment-method details in this version.
        </P>

        <H n={2}>Future Payment Setup</H>
        <P>
          Codex will configure production payment processing later. When billing is enabled, this policy
          should be updated before release to describe the active provider, refund window, cancellation
          process, and support path.
        </P>

        <H n={3}>Access Questions</H>
        <P>
          For access requests or billing-related questions before payment setup is active, contact{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
        </P>

        <p className="mt-4 border-t border-border pt-3 text-[10px] italic text-muted-foreground">
          Copyright {new Date().getFullYear()} {SELLER} ({TRADING}). All rights reserved.
        </p>
      </section>
    </div>
  );
}
