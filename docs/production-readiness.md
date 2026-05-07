# Production Readiness

This app is production-gated by automated checks and live release procedures.

## Automated gates

Run before every release:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run prod:check
npm run build
npm run e2e
```

CI runs `npm run release:verify` and installs Chromium for the Playwright smoke suite.

## Required release evidence

- Engineering benchmark tests pass for ASME B31.3 pressure thickness, B36.10M/B36.19M schedules, B16.5 flange class selection, bolting/gasket fixtures, and PMS output traceability.
- Browser smoke tests pass on desktop and mobile Chromium.
- Supabase production verification checklist is completed.
- Payment setup is explicitly disabled or the future payment checklist is completed.
- Dataset governance checklist is completed for any reference-data changes.
- Security checklist is completed, including secret rotation confirmation.
- Rollback target is identified before deploy.
- Monitoring endpoint is configured and a test event is observed.
- Release attestation is present in About, dataset exports, reports, PMS print, and PMS Word exports.

## Current production controls

- Production builds ignore local paid-tier overrides.
- `.env` and `.env.*` are ignored; `.env.example` is the committed template. Production values must be supplied by GitHub/Lovable/hosting secrets.
- Cloud sync UI does not expose user IDs or raw cloud diagnostics.
- Runtime browser error monitoring is available via `VITE_MONITORING_ENDPOINT`.
- Supabase migrations include RLS policy contract tests.
- `npm run prod:check` statically verifies release docs, attestation text, no active payment provider config, RLS migrations, benchmark evidence, and rollback procedures.

## Production release decision

The app may be considered production-ready only when:

1. `npm run release:verify` passes from a clean checkout.
2. `docs/live-production-verification.md` is completed against the live Supabase project.
3. `docs/security-review.md` is completed and secrets are rotated or confirmed current.
4. `docs/release-runbook.md` and `docs/release-rollback.md` identify the exact artifact and rollback target.
5. External benchmark cases are reviewed and any dataset changes are governed under `docs/engineering-data-governance.md`.
