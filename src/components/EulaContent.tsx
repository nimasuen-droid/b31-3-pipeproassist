import {
  EULA_APP_NAME,
  EULA_OWNER,
  EULA_EFFECTIVE_DATE,
  EULA_LAST_UPDATED,
  EULA_VERSION,
  EULA_GOVERNING_LAW,
} from "@/lib/eula";
import { APP_VERSION, DATASET_VERSION, SUPPORT_EMAIL } from "@/lib/appVersion";

function H({ n, children }: { n: number; children: React.ReactNode }) {
  return <h3 className="mt-5 mb-1.5 text-sm font-semibold text-foreground">{n}. {children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs leading-relaxed text-muted-foreground">{children}</p>;
}

export function EulaContent() {
  return (
    <div className="text-sm">
      <header className="mb-3 border-b border-border pb-3">
        <h2 className="text-base font-semibold">End User License Agreement (EULA)</h2>
        <div className="mt-1 space-y-0.5 font-mono text-[11px] text-muted-foreground">
          <div>Application: {EULA_APP_NAME}</div>
          <div>Owner / Developer: {EULA_OWNER}</div>
          <div>App Version: {APP_VERSION} - Dataset: DS {DATASET_VERSION}</div>
          <div>EULA Version: {EULA_VERSION}</div>
          <div>Effective Date: {EULA_EFFECTIVE_DATE} - Last Updated: {EULA_LAST_UPDATED}</div>
        </div>
      </header>

      <P>
        This End User License Agreement is a binding legal agreement between you and {EULA_OWNER}
        governing your use of {EULA_APP_NAME}. By installing, accessing, or using the Software, you agree
        to this Agreement. If you do not agree, you must not use the Software.
      </P>

      <H n={1}>License Grant</H>
      <P>
        Subject to this Agreement, the Owner grants you a limited, non-exclusive, non-transferable,
        revocable license to use the Software for internal engineering screening, education, and
        design-support purposes. You may not sublicense, rent, sell, redistribute, reverse engineer,
        decompile, or create derivative works except where applicable law expressly permits it.
      </P>

      <H n={2}>Engineering Disclaimer</H>
      <P>
        <strong className="text-foreground">The Software is a decision-support tool only.</strong> It does
        not replace professional engineering judgment, qualified review, or compliance verification against
        the latest approved revisions of project codes, client specifications, and governing standards,
        including ASME B31.3. Outputs must be independently verified by a responsible user or qualified
        piping engineer before use for procurement, fabrication, construction, commissioning, or operation.
        The Software does not enforce a checker sign-off workflow.
      </P>

      <H n={3}>Data Storage and Cloud Sync</H>
      <P>
        The Software stores design inputs, saved projects, specifications, and overrides locally using
        browser storage. Cloud sync is optional and available only when you sign in. You remain responsible
        for backing up authoritative engineering data and resolving sync conflicts.
      </P>

      <H n={4}>Paid Access</H>
      <P>
        In-app payment checkout is not active in this build. Some modules may remain restricted behind
        server-backed entitlements while payment processing is prepared for a later release. The Software
        does not collect card, bank, or payment-method details in this version.
      </P>

      <H n={5}>No Warranties</H>
      <P>
        THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS,
        IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
        PURPOSE, ACCURACY, RELIABILITY, OR NON-INFRINGEMENT.
      </P>

      <H n={6}>Limitation of Liability</H>
      <P>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE OWNER SHALL NOT BE LIABLE FOR DIRECT, INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM USE OF THE
        SOFTWARE, INCLUDING DESIGN ERRORS, INCORRECT MATERIAL SELECTION, EQUIPMENT FAILURE, PROJECT DELAYS,
        FINANCIAL LOSS, LOSS OF DATA, PERSONAL INJURY, ENVIRONMENTAL DAMAGE, OR PROPERTY DAMAGE.
      </P>

      <H n={7}>Intellectual Property</H>
      <P>
        The Software, including source code, user interface, engineering logic, compiled datasets,
        documentation, and branding, is the property of the Owner and is protected by applicable
        intellectual property laws. References to ASME, API, ISO, and other standards are used only for
        identification and remain the property of their respective organizations.
      </P>

      <H n={8}>Privacy</H>
      <P>
        Your use of the Software is governed by the Privacy Notice in the application, which describes
        personal data categories, processing purposes, sharing, retention, and your rights.
      </P>

      <H n={9}>Termination and Updates</H>
      <P>
        The Owner may suspend or terminate access if you breach this Agreement, create security or fraud
        risk, or repeatedly violate applicable policies. The Owner may release updates to the Software,
        reference datasets, or this Agreement. Continued use after a material update constitutes acceptance.
      </P>

      <H n={10}>Governing Law and Contact</H>
      <P>
        This Agreement is governed by the laws of the {EULA_GOVERNING_LAW}. For questions, defect reports,
        dataset update requests, access requests, or legal notices, contact{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
      </P>

      <p className="mt-4 border-t border-border pt-3 text-[10px] italic text-muted-foreground">
        Copyright {new Date().getFullYear()} {EULA_OWNER}. All rights reserved.
      </p>
    </div>
  );
}
