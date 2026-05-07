export function resolvePaidEntitlement({
  hasPaidRole,
  devPaidOverride,
  allowDevOverride,
}: {
  hasPaidRole: boolean;
  devPaidOverride: boolean;
  allowDevOverride: boolean;
}): boolean {
  return hasPaidRole || (allowDevOverride && devPaidOverride);
}
