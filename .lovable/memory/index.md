# Project Memory

## Core
ASME B31.3 Process Piping Design Assistant. Dark theme, professional industrial aesthetic.
Engineering data must never be fabricated; use approved source libraries (ASME/ASTM) or user uploads.
Prioritize UI stability; focus enhancements on underlying engineering logic, not interface layouts.
Preloaded with B31.3, B16.5, B36.10M/B36.19M, B16.9, B16.11, and Sec II-D baselines.
EPC safety-first: min Sch 80 small bore, no NPS 2½"/3½", target 50-75% utilization.

## Memories
- [Traceability](mem://requirements/traceability) — 100% mapping completeness and clickable reference badges for all calculations
- [Disclaimer](mem://requirements/disclaimer) — Mandatory engineering disclaimer for all application outputs
- [User Roles](mem://auth/user-roles) — RBAC: Admin, Lead, Engineer, Checker, Viewer
- [Units](mem://features/units) — Bidirectional SI/Imperial conversion for all numeric inputs
- [Recommendation Engine](mem://features/recommendation-engine) — Real-time material/component suggestions with cascading updates
- [Manual Override](mem://features/manual-override) — Lock/unlock pattern and amber borders for system overrides
- [Automated Calculations](mem://features/automated-calculations) — Auto-calcs for mill tolerance, Ej, and hydrotest pressures
- [Service Classification](mem://features/service-classification) — Auto-determines fluid categories (Normal, M, Severe, etc.)
- [Compliance Screening](mem://features/compliance-screening) — B31.3 synchronized design checks with manual overrides
- [Support Span Estimation](mem://features/support-span-estimation) — Span estimation for empty/op/hydro using 2.5mm limit
- [Learning Mode](mem://features/learning-mode) — TeachBadge and deep-dive modals with code justifications
- [Source Management](mem://features/source-management) — Staging, OCR, import/export, and diff detection for datasets
- [Audit Trail](mem://features/audit-trail) — Tracks table updates and user justifications for overrides
- [Service Type Driver](mem://features/service-type-driver) — Service type drives material specs and default corrosion allowances
- [Engineering Interpolation](mem://features/engineering-interpolation) — Linear interpolation for ASME II-D and B16.5
- [Dataset Baseline](mem://features/dataset-baseline) — Immutable baselines with custom dataset overrides
- [Reporting Exports](mem://features/reporting-exports) — Generates 7 PDF/Excel/Word reports with on-the-fly calculations
- [Bolting Automation](mem://features/bolting-automation) — Auto bolt sizing and BOM generation per B16.5 Table E-1
- [Saved Projects](mem://features/saved-projects) — Unified interface for Cloud (Supabase) and Local saves
- [Batch Calculations](mem://features/pipe-schedule-batch-calculation) — 1/4" to 24" pipe schedule evaluation with Excel export
- [Form Utilities](mem://features/form-utilities) — Load sample data and clear fields
- [Print Output](mem://style/print-output) — Courier New, PIP-standard layout for PMS print/Word export
- [High Pressure Logic](mem://features/high-pressure-logic) — Flange class >= 900# defaults to RTJ
- [Flange Classes](mem://features/flange-class-set) — Restricted to 150-2500, Class 400 excluded
- [Material Classification](mem://features/material-classification-system) — 4-tier system (Best Match to Not Permissible) with color alerts
- [Spec Library](mem://features/spec-library) — CRUD for material specs, JSON import/export
- [Schedule Banding](mem://features/schedule-banding) — 4 categories (Band A to D) for standardized spec generation
- [Branch Connections](mem://features/branch-connection-logic) — T, R, W, S matrix with strict step-down rules
- [Dropdown Legibility](mem://style/dropdown-legibility) — Dark-theme color-scheme with explicit high-contrast colors
- [Flange Selection](mem://features/flange-selection-logic) — A105 default, SW for <= 1.5", WN for >= 2"
- [Schedule Engine](mem://features/pipe-schedule-decision-engine) — Multi-criteria scoring for pipe schedules
- [User Manual](mem://features/user-manual) — Module documentation and engineering tips
- [PMS Generator](mem://features/pms-generator) — PIP-standard rule-driven specification generator
- [NPS Boundaries](mem://constraints/nps-engineering-boundaries) — Small Bore (<= 1.5") SW/THD, Large Bore (>= 2") BW/Flanged
- [Security Hardening](mem://auth/security-hardening) — HIBP checked passwords in Supabase Auth
- [Valve Selection](mem://features/valve-selection-module) — Service-driven recommendations for body/trim/seat/packing
- [NPS Selector](mem://features/nps-selector) — Controlled dropdown 1/4" to 24" with decimal key mapping
- [B16.5 Design Basis](mem://features/pms-b165-design-basis) — Optional toggle to use B16.5 limits as design pressure
- [EPC NPS Standards](mem://features/epc-nps-standards) — Safety-first schedule scoring, excluded NPS 2½"/3½", min Sch 80 SB
