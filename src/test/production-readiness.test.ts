import { describe, expect, it } from "vitest";
import { resolvePaidEntitlement } from "@/lib/entitlements";
import { DATASET_RELEASE_ATTESTATION_LINES, RELEASE_ATTESTATION_VERSION } from "@/lib/appVersion";

describe("production readiness gates", () => {
  it("does not allow local paid override unless the build explicitly enables development override", () => {
    expect(resolvePaidEntitlement({
      hasPaidRole: false,
      devPaidOverride: true,
      allowDevOverride: false,
    })).toBe(false);
  });

  it("allows server-backed paid roles regardless of local override state", () => {
    expect(resolvePaidEntitlement({
      hasPaidRole: true,
      devPaidOverride: false,
      allowDevOverride: false,
    })).toBe(true);
  });

  it("allows development override only when the build flag permits it", () => {
    expect(resolvePaidEntitlement({
      hasPaidRole: false,
      devPaidOverride: true,
      allowDevOverride: true,
    })).toBe(true);
  });

  it("defines the production dataset release attestation", () => {
    expect(RELEASE_ATTESTATION_VERSION).toBe("1.0");
    expect(DATASET_RELEASE_ATTESTATION_LINES).toEqual([
      "Released by PipePro B31.3 Design Assistant",
      "Dataset Integrity Verified",
      "Version 1.0",
    ]);
  });
});
