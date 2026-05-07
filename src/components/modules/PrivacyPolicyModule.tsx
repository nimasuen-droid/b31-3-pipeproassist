import { SUPPORT_EMAIL } from "@/lib/appVersion";
import { PRODUCT_NAME } from "@/lib/brand";

const SELLER = "Nosa Imasuen";
const TRADING = "EngLab by NOI";
const EFFECTIVE = "1 May 2026";

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return <h3 className="mt-5 mb-1.5 text-sm font-semibold text-foreground">{n}. {children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs leading-relaxed text-muted-foreground">{children}</p>;
}
function L({ children }: { children: React.ReactNode }) {
  return <li className="text-xs leading-relaxed text-muted-foreground">{children}</li>;
}

export function PrivacyPolicyModule() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Privacy Notice</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          How {SELLER} ({TRADING}) collects, uses, and shares your personal data.
        </p>
      </div>

      <section className="eng-card text-sm">
        <header className="mb-3 border-b border-border pb-3">
          <div className="font-mono text-[11px] text-muted-foreground">
            Controller: {SELLER} (trading as {TRADING}) - Effective: {EFFECTIVE}
          </div>
        </header>

        <H n={1}>Who We Are</H>
        <P>
          {SELLER}, trading as {TRADING}, is the data controller for personal data processed in connection
          with {PRODUCT_NAME}. Contact{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
        </P>

        <H n={2}>Data We Collect</H>
        <ul className="mb-2 list-disc space-y-1 pl-5">
          <L>Account data such as email address, hashed password, and display name.</L>
          <L>Authentication data such as session tokens and OAuth identifiers.</L>
          <L>Engineering inputs, project names, saved specifications, overrides, and source references.</L>
          <L>Support communications when you contact us.</L>
          <L>Usage, telemetry, error logs, device, browser, and connection data.</L>
          <L>Server-backed entitlement state when access is granted manually or by a future billing system.</L>
        </ul>

        <H n={3}>Purposes</H>
        <ul className="mb-2 list-disc space-y-1 pl-5">
          <L>Provide the Software, including account access, calculations, local storage, and cloud sync.</L>
          <L>Manage access entitlements.</L>
          <L>Provide customer support.</L>
          <L>Protect security, prevent abuse, and debug production issues.</L>
          <L>Comply with legal, accounting, and regulatory obligations.</L>
        </ul>

        <H n={4}>Sharing</H>
        <P>
          We do not sell personal data and do not share it for third-party advertising. We may share data
          with hosting and infrastructure providers, authentication providers, professional advisers, and
          authorities where required by law or necessary to protect our rights.
        </P>

        <H n={5}>Retention and Storage</H>
        <P>
          Account, entitlement, and engineering data are retained while your account is active and for a
          reasonable period afterwards. Support correspondence may be retained for up to 3 years. Telemetry
          and security logs may be retained for up to 12 months. Locally stored data remains on your device
          until you clear it.
        </P>

        <H n={6}>Your Rights</H>
        <P>
          Subject to applicable law, you may request access, rectification, erasure, restriction, objection,
          portability, or withdrawal of consent by contacting{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
        </P>

        <H n={7}>Security</H>
        <P>
          We use reasonable technical and organizational safeguards, including TLS, role-based access,
          authenticated APIs, audit logging, and least-privilege practices. No system is perfectly secure.
        </P>

        <H n={8}>No Active Payment Provider</H>
        <P>
          This build does not include an active payment provider and does not collect card, bank, or
          payment-method details.
        </P>

        <p className="mt-4 border-t border-border pt-3 text-[10px] italic text-muted-foreground">
          Copyright {new Date().getFullYear()} {SELLER} ({TRADING}). All rights reserved.
        </p>
      </section>
    </div>
  );
}
