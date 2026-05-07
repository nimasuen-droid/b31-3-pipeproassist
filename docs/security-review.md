# Security Review

## Secrets

- `.env` and `.env.*` must never be committed.
- Rotate Supabase anon keys if they were previously committed or shared outside the deployment environment.
- Supabase service-role keys must exist only in Supabase edge function secrets or CI secret stores that require admin access.

## Client exposure

Allowed in the browser:

- Supabase URL.
- Supabase publishable/anon key.
- Future payment provider publishable/client token, once billing is implemented.

Never expose in the browser:

- Supabase service-role key.
- Future payment provider webhook signing secret.
- Future payment provider API key.

## RLS

The app depends on Supabase RLS for cloud data isolation. CI statically checks that migrations enable RLS and define owner-scoped policies, but production must still be verified live.

## Monitoring

Set `VITE_MONITORING_ENDPOINT` to a HTTPS endpoint that accepts JSON browser error events. The payload intentionally excludes engineering inputs and user identifiers.

## Production checklist

- Run `npm run prod:check`.
- Confirm `.env.production`, `.env.example`, and CI contain no payment provider token until billing is intentionally added.
- Confirm `VITE_ALLOW_DEV_ENTITLEMENT_OVERRIDE=false` in production.
- Confirm `VITE_MONITORING_ENDPOINT` is configured to HTTPS in the production host.
- Confirm Supabase RLS policies reject cross-user access in the live project.
- Confirm no source maps containing secrets are published to a public bucket.
- Confirm service-role keys, webhook secrets, and admin credentials are rotated or documented as current for this release.
- Confirm Electron signing materials are stored only in CI/release secrets, not in the repository.
