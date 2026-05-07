# Release Runbook

## Pre-release

1. Confirm `main` CI is green and `npm run release:verify` passes from a clean checkout.
2. Confirm `.env` values are supplied by GitHub/Lovable/host secrets, not committed files.
3. Run live production verification in `docs/live-production-verification.md`.
4. Confirm engineering data governance in `docs/engineering-data-governance.md`.
5. Confirm monitoring endpoint is configured.
6. Confirm `docs/external-benchmark-cases.md` evidence is complete for changed engineering logic or data.
7. Confirm `docs/security-review.md` is complete and secrets have been rotated or explicitly confirmed.
8. Record rollback target from `docs/release-rollback.md`.
9. Confirm release attestation appears in About, Dataset Management, dataset exports, reports, PMS print, and PMS Word export:

```text
Released by PipePro B31.3 Design Assistant
Dataset Integrity Verified
Version 1.0
```

## Deploy

1. Build from a clean checkout.
2. Deploy the generated `dist` artifact or package the desktop installer.
3. Apply Supabase migrations before enabling the matching app build.
4. Confirm app version and dataset version in About.

## Post-release smoke

1. Load the production URL on desktop and mobile.
2. Run one free-user wall-thickness calculation.
3. Run one paid-user PMS generation.
4. Export one report.
5. Save/sync one spec.
6. Confirm monitoring receives no new startup errors.
7. Trigger one controlled browser error event in staging/production diagnostics and confirm the monitoring endpoint receives it without engineering inputs or user identifiers.

## Rollback

Rollback if any of these occur:

- Wrong schedule standard is selected for B36.10M/B36.19M.
- Paid access is granted without server-backed entitlement.
- Cross-user data is visible.
- Reports/PMS omit source references.
- Production startup errors affect normal users.

Rollback procedure:

1. Disable new checkout links if entitlement behavior is affected.
2. Redeploy the previous known-good app artifact.
3. Revert or patch Supabase migrations only with a tested SQL rollback.
4. Re-run post-release smoke.
5. Follow the detailed steps in `docs/release-rollback.md`.
