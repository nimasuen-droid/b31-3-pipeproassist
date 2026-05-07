# Pipe Design Pro — ASME B31.3 Process Piping Design Assistant

A professional-grade, browser-based engineering assistant for **process piping design per ASME B31.3**. Built for piping engineers, checkers, and EPC project teams who need fast, traceable, code-compliant calculations and specification generation — online or fully offline (PWA + optional Electron desktop).

> **Live:** https://pipe-pro-assist.lovable.app · https://www.pipeproassist.com
> **Stack:** React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui + Lovable Cloud (Supabase)
> **Built with:** [Lovable](https://lovable.dev) — bidirectional GitHub sync; edits in either place stay in sync.

---

## 🎯 What this project aims to achieve

Process piping design today is fragmented across spreadsheets, PDFs, and tribal knowledge. Pipe Design Pro consolidates the routine engineering decisions of ASME B31.3 into a **single, auditable, traceable workflow**:

- **Eliminate fabricated data** — every calculation is backed by an approved source (ASME B31.3, B16.5, B36.10M/B36.19M, B16.9, B16.11, Section II-D) with clickable reference badges.
- **Make code reasoning visible** — Learning Mode shows the formula, the clause, and the justification behind every recommendation.
- **Keep engineers in control** — automatic recommendations cascade from inputs, but every value can be manually overridden (with audit trail and amber-border indicators).
- **Produce deliverables, not just numbers** — generates PIP-standard Piping Material Specifications (PMS), 7 report types (PDF / Excel / Word), and full BOMs.
- **Work offline** — engineering datasets and calculations run on-device. Cloud sync is optional.

---

## ✨ What's been built

### Engineering modules
| Module | Purpose |
|---|---|
| **Design Inputs** | Service-driven inputs (fluid category, design P/T, corrosion allowance, mill tolerance, Ej, hydrotest pressures auto-calculated). |
| **Wall Thickness** | ASME B31.3 §304.1 wall thickness per NPS, with batch evaluation 1/4"–24" and Excel export. *(Free tier)* |
| **Pipe Schedule** | Multi-criteria scoring engine recommending schedules across the full NPS range. |
| **Material Selection** | 4-tier classification (Best Match → Not Permissible) with color alerts and Section II-D interpolation. |
| **Flanges** | B16.5 P-T rating interpolation; A105 default; SW for ≤1.5", WN for ≥2"; RTJ default for class ≥900#. |
| **Bolting & Gasket** | Auto bolt sizing and BOM per B16.5 Table E-1. |
| **Branch Connections** | T / R / W / S matrix with strict step-down rules. |
| **Support Span** | Empty / operating / hydrotest span estimation using the 2.5 mm deflection limit. |
| **Valve Selection** | Service-driven body / trim / seat / packing recommendations. |
| **Design Checks** | Synchronized B31.3 compliance screening with manual override workflow. |
| **PMS Generator** | PIP-standard, rule-driven Piping Material Specifications with print/Word export (Courier New, PIP layout). |
| **Spec Library** | CRUD for material specs + JSON import/export. |
| **Reports** | 7 report types (PDF / Excel / Word) generated on-the-fly. |
| **Source Library** | Staging, OCR, import/export and diff detection for engineering datasets. |
| **Saved Projects** | Unified Cloud (Supabase) + local save interface. |

### Cross-cutting features
- **Bidirectional SI ↔ Imperial** unit conversion for every numeric input.
- **Recommendation engine** with cascading updates and manual override (lock/unlock + amber borders).
- **Traceability** — 100% mapping from result to source clause; clickable reference badges throughout.
- **Learning Mode** — `TeachBadge` and deep-dive modals with code justifications.
- **Audit Trail** — tracks table updates and user justifications for overrides.
- **Mandatory engineering disclaimer** on every output.
- **PWA + offline** — datasets and calcs run on-device; installable.
- **Electron desktop build** — optional Windows installer (see `.github/workflows/build-windows-installer.yml`, `electron-builder.yml`).

### Auth, roles & billing
- **Lovable Cloud** (Supabase) backend: auth (email + Google), Postgres, RLS, edge functions.
- **RBAC**: Admin · Lead · Engineer · Checker · Viewer (roles in dedicated `user_roles` table — never on profiles).
- **Paddle** Merchant-of-Record subscriptions (monthly / yearly Pro). Webhook → `supabase/functions/payments-webhook`.
- **Free tier**: Wall Thickness module + unlimited sample-data demo. **Pro**: every module + reports + custom datasets.
- **HIBP-checked passwords** enforced in Supabase Auth.

### Bundled engineering datasets (immutable baselines)
ASME **B31.3**, **B16.5**, **B36.10M / B36.19M**, **B16.9**, **B16.11**, **Section II-D**. Custom datasets can be layered on top without mutating the baseline.

---

## 🏗️ Tech stack

- **Framework:** React 18 + Vite 5 + TypeScript 5
- **UI:** Tailwind CSS v3 (semantic HSL tokens — no raw colors in components), shadcn/ui, framer-motion, lucide-react
- **State / data:** TanStack Query, React Hook Form + Zod, custom stores (`src/stores/*`)
- **Backend:** Lovable Cloud — Supabase (Postgres + RLS + Auth + Edge Functions + Storage)
- **Payments:** Paddle (MoR) via edge functions
- **Reports:** `docx`, `file-saver`, custom PDF/Excel generators
- **Desktop:** Electron + electron-builder (Windows installer via GitHub Actions)
- **Testing:** Vitest, Testing Library, Playwright
- **PWA:** vite-plugin-pwa + Workbox

---

## 📁 Project structure

```
src/
├── components/
│   ├── modules/            # Top-level engineering modules (one per tab)
│   │   ├── designInputs/   # Recommendation engine, source data, teaching DBs
│   │   └── pms/            # PMS generator, print view, Word export
│   └── ui/                 # shadcn primitives
├── hooks/                  # useAuth, useEntitlements, usePaddleCheckout, ...
├── stores/                 # designInputsStore, datasetManager, sourceRegistry, learningMode
├── lib/                    # appVersion, unitConversion, cloudSync, paddle, eula, pwa
├── integrations/supabase/  # AUTO-GENERATED — do not edit
└── pages/                  # Index, ResetPassword, NotFound

supabase/
├── functions/              # payments-webhook, get-paddle-price
└── config.toml             # Project-level Supabase config

electron/                   # Desktop wrapper
.github/workflows/          # CI: Windows installer build
```

---

## 🚀 Getting started (collaborators)

### Prerequisites
- **Node.js 18+** and **npm** (or `bun`)
- A Lovable account if you want to use the visual editor (optional — pure code workflow works fine)

### Local development
```bash
git clone <this-repo>
cd <repo>
npm install
npm run dev          # starts Vite on http://localhost:5173
```

### Environment variables
The `.env` files are **auto-managed by Lovable Cloud** and contain:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```
Do **not** edit `.env`, `src/integrations/supabase/client.ts`, or `src/integrations/supabase/types.ts` — they are regenerated automatically.

For Paddle / payments testing, secrets live in Supabase Edge Function env (set via Lovable → Connectors → Cloud).

### Useful scripts
```bash
npm run dev           # Vite dev server
npm run build         # Production build
npm run build:dev     # Dev-mode build (source maps, no minify)
npm run lint          # ESLint
npm run test          # Vitest (unit)
npm run test:watch    # Vitest watch mode
npx playwright test   # E2E (Playwright)
```

### Working with the Electron desktop build
See `CODE_SIGNING.md` and `.github/workflows/build-windows-installer.yml`.

---

## 🤝 Contributing — where to start

1. **Read the engineering rules first.** Project memory is in `.lovable/memory/index.md` — it documents every gating rule, classification system, and engineering boundary the app enforces. Treat it as the spec.
2. **Never fabricate engineering data.** Every value must trace to ASME / ASTM or a user-uploaded source. Add new data through `src/stores/sourceRegistry.tsx` and the Source Library module — not as inline constants.
3. **UI stability matters.** Prioritize improvements to underlying engineering logic over layout reshuffles. Use semantic Tailwind tokens from `index.css` / `tailwind.config.ts` — never hardcode colors in components.
4. **Roles in their own table.** Auth roles live in `user_roles` (never on profiles or `auth.users`) and are checked via a `SECURITY DEFINER` `has_role()` function to avoid recursive RLS. Don't change this pattern.
5. **Add a clickable reference badge for any new calculation.** 100% traceability is a hard requirement.
6. **Include the engineering disclaimer** on any new output surface.

### Workflow
- Branch from `main`, open a PR. Small, focused PRs preferred.
- The repo is bidirectionally synced with Lovable: pushing to GitHub updates the Lovable project, and edits in Lovable push back here.
- Run `npm run lint` and `npm run test` before opening a PR.

### Good first issues
- New material additions to the Spec Library
- Additional report templates
- Localization / i18n scaffolding
- Expanding the Valve Selection rule set
- More engineering teaching content in `calculationTeachingDatabase.ts`

---

## ⚖️ Engineering disclaimer

This software is provided for **engineering screening and educational support only**. Outputs are **not a substitute** for review by a qualified piping engineer, nor for compliance verification against the latest approved revisions of project codes, client specifications, and governing standards (including ASME B31.3). The authors and contributors disclaim all liability arising from use of this tool. See the in-app EULA for the full text.

---

## 📜 License & legal

- End User License Agreement: in-app (`/eula` route) — version tracked in `src/lib/eula.ts`.
- Privacy Notice: in-app (`/privacy`).
- Refund Policy: 30-day money-back guarantee (in-app).
- Payments processed by **Paddle** (Merchant of Record).

---

## 📬 Support

- Email: **nimasuen@gmail.com**
- Built by **EngLab by NOI**
