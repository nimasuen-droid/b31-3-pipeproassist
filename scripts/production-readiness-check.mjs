import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function requireFile(path) {
  try {
    const full = join(root, path);
    if (!statSync(full).isFile()) throw new Error("not a file");
    return readFileSync(full, "utf8");
  } catch {
    failures.push(`Missing required production file: ${path}`);
    return "";
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const packageJson = JSON.parse(read("package.json"));
const appVersion = read("src/lib/appVersion.ts");
const envExample = requireFile(".env.example");
const ci = requireFile(".github/workflows/ci.yml");
const productionReadiness = requireFile("docs/production-readiness.md");
const dataGovernance = requireFile("docs/engineering-data-governance.md");
const liveVerification = requireFile("docs/live-production-verification.md");
const releaseRunbook = requireFile("docs/release-runbook.md");
const securityReview = requireFile("docs/security-review.md");
const rollbackRunbook = requireFile("docs/release-rollback.md");
const benchmarkEvidence = requireFile("docs/external-benchmark-cases.md");

const migrations = readdirSync(join(root, "supabase", "migrations"))
  .filter((name) => name.endsWith(".sql"))
  .map((name) => readFileSync(join(root, "supabase", "migrations", name), "utf8"))
  .join("\n");

assert(packageJson.scripts?.["prod:check"] === "node scripts/production-readiness-check.mjs", "package.json must expose npm run prod:check");
assert(packageJson.scripts?.["release:verify"]?.includes("npm run prod:check"), "package.json must expose release:verify including prod:check");

for (const envName of ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_MONITORING_ENDPOINT", "VITE_ALLOW_DEV_ENTITLEMENT_OVERRIDE"]) {
  assert(envExample.includes(`${envName}=`), `.env.example missing ${envName}`);
}

for (const text of [envExample, ci]) {
  assert(!/PADDLE|PAYMENTS_CLIENT_TOKEN|payment_audit|subscriptions/i.test(text), "Payment provider configuration must remain absent from production env/CI until billing is intentionally added");
}

assert(appVersion.includes('"Released by PipePro B31.3 Design Assistant"'), "Release attestation missing Released by line");
assert(appVersion.includes('"Dataset Integrity Verified"'), "Release attestation missing dataset integrity line");
assert(appVersion.includes("Version ${RELEASE_ATTESTATION_VERSION}") && appVersion.includes('RELEASE_ATTESTATION_VERSION = "1.0"'), "Release attestation missing Version 1.0 line");

assert(migrations.includes("alter table public.user_roles enable row level security"), "Supabase user_roles RLS migration is missing");
assert(migrations.includes("alter table public.saved_specs enable row level security"), "Supabase saved_specs RLS migration is missing");
assert(migrations.includes("auth.uid() = user_id"), "Supabase owner-scoped RLS policy is missing");

for (const doc of [
  productionReadiness,
  dataGovernance,
  liveVerification,
  releaseRunbook,
  securityReview,
  rollbackRunbook,
  benchmarkEvidence,
]) {
  assert(doc.includes("PipePro B31.3 Design Assistant") || doc.includes("Production") || doc.includes("Benchmark"), "Production documents must be populated with release-control content");
}

assert(dataGovernance.includes("Dataset Integrity Verified"), "Dataset governance must include the release attestation");
assert(benchmarkEvidence.includes("ASME B31.3") && benchmarkEvidence.includes("B36.10M") && benchmarkEvidence.includes("B36.19M") && benchmarkEvidence.includes("B16.5"), "Benchmark evidence must cover core standards");
assert(releaseRunbook.toLowerCase().includes("rollback"), "Release runbook must include rollback requirements");
assert(rollbackRunbook.toLowerCase().includes("redeploy"), "Rollback runbook must include redeploy procedure");
assert(securityReview.toLowerCase().includes("secret") && securityReview.toLowerCase().includes("rls"), "Security review must cover secrets and RLS");
assert(productionReadiness.includes("monitoring") && productionReadiness.includes("rollback"), "Production readiness doc must cover monitoring and rollback");

if (failures.length > 0) {
  console.error("Production readiness check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Production readiness static checks passed.");
