# Live Production Verification

These checks require access to the production Supabase project. Payment checkout is not active in this build; do not mark a paid release production-ready until a future payment provider checklist is added and completed.

## Supabase auth and RLS

1. Create two normal test users: `engineer-a` and `engineer-b`.
2. Sign in as `engineer-a`, save one project and one PMS spec, then sync.
3. Sign in as `engineer-b`; confirm `engineer-a` project/spec is not visible.
4. Attempt direct `saved_specs` insert/update/delete with a mismatched `user_id`; confirm RLS rejects it.
5. Confirm realtime updates refresh `user_roles` for the signed-in user only.
6. Confirm a signed-out user cannot read `saved_specs` or `user_roles`.

## Payment flow

Payment checkout is intentionally disabled for this build. Codex will add a provider-specific checklist when production billing is implemented later.

## Cloud sync

1. Save a project/spec offline, then sign in and sync.
2. Reload on a second browser profile/device and confirm pull.
3. Modify the same spec independently on two devices and confirm conflict status appears.
4. Resolve conflict by choosing local and cloud versions in separate test runs.

## Evidence

Attach screenshots/log links to the release issue:

- Paid role row
- Locked-to-unlocked module transition
- Cross-user RLS rejection
- Cloud sync pull/push/conflict
- Monitoring event received through `VITE_MONITORING_ENDPOINT`
- Release attestation visible in About and one exported report
- Rollback target artifact identified

Do not mark the release production-ready until these live checks are complete. Static CI and local tests cannot prove production Supabase, monitoring, hosting, or rollback behavior without live access.
