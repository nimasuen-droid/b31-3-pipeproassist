const NPS_CANONICAL: Record<string, string> = {
  ".25": "1/4",
  "0.25": "1/4",
  "1/4": "1/4",
  ".5": "1/2",
  "0.5": "1/2",
  "1/2": "1/2",
  ".75": "3/4",
  "0.75": "3/4",
  "3/4": "3/4",
  "1.25": "1-1/4",
  "1-1/4": "1-1/4",
  "1 1/4": "1-1/4",
  "1.5": "1-1/2",
  "1-1/2": "1-1/2",
  "1 1/2": "1-1/2",
  "2.5": "2-1/2",
  "2-1/2": "2-1/2",
  "2 1/2": "2-1/2",
  "3.5": "3-1/2",
  "3-1/2": "3-1/2",
  "3 1/2": "3-1/2",
};

export function cleanNps(nps: string | undefined | null): string {
  return String(nps ?? "")
    .replace(/[″"]/g, "")
    .replace(/[′']/g, "")
    .trim();
}

export function normalizeNpsForPicker(nps: string | undefined | null): string {
  const clean = cleanNps(nps)
    .replace(/\s+/g, " ")
    .replace("¼", "1/4")
    .replace("½", "1/2")
    .replace("¾", "3/4");
  return NPS_CANONICAL[clean] || clean;
}

export function normalizeNpsForDataKey(nps: string | undefined | null): string {
  const picker = normalizeNpsForPicker(nps);
  const map: Record<string, string> = {
    "1/4": '0.25"',
    "1/2": '0.5"',
    "3/4": '0.75"',
    "1-1/4": '1.25"',
    "1-1/2": '1.5"',
    "2-1/2": '2.5"',
    "3-1/2": '3.5"',
  };
  return map[picker] || `${picker.replace(/"/g, "")}"`;
}
