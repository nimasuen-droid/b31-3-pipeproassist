# Release Rollback

Rollback is a planned production control for PipePro B31.3 Design Assistant. A release must not go live without a known-good rollback artifact and dataset package.

## Rollback triggers

- Cross-user project or spec visibility.
- Supabase RLS failure or entitlement leakage.
- Incorrect B36.10M/B36.19M schedule standard selection.
- PMS schedule below calculated required schedule.
- Missing source references, engineering-review wording, or release attestation in reports/PMS exports.
- Production startup, save/sync, or export errors that affect normal use.
- Monitoring shows repeated unhandled errors after release.

## Required rollback assets

- Previous deployed web artifact or hosting deployment id.
- Previous desktop installer artifact, if desktop release was shipped.
- Previous `APP_VERSION`, `DATASET_VERSION`, and release attestation package.
- Database migration rollback plan or forward-fix SQL reviewed in staging.
- Communication note for users describing the rollback as a software release action, not an engineering approval change.

## Procedure

1. Pause promotion of the current release.
2. Disable new entitlements or checkout links if access control is involved.
3. Redeploy the previous known-good web artifact.
4. Re-issue the previous desktop installer if the desktop artifact is affected.
5. Apply only tested rollback or forward-fix SQL. Do not manually edit production tables unless documented in the incident record.
6. Re-run production smoke: sign-in, project save/sync, PMS generation, report export, offline reload, and monitoring event check.
7. Record incident cause, affected versions, rollback time, and verification evidence.

## Dataset rollback

If a dataset release is affected:

1. Restore the previous bundled dataset package.
2. Confirm the About page and exports show the restored `DATASET_VERSION`.
3. Re-run external benchmark cases for ASME B31.3, B36.10M, B36.19M, B16.5, bolting/gasket, fittings, valves, PMS, and reports.
4. Keep the affected dataset package archived for investigation.

