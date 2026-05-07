/**
 * ASME/ASTM Material Reference Database
 * 
 * Sources:
 * - Pipe: ASTM A106, A335, A312, A333, A671, A358 per ASME B31.3 Table A-1
 * - Flanges: ASTM A105, A182, A350 per ASME B16.5 Table 1A/2
 * - Fittings: ASTM A234, A403, A420 per ASME B16.9/B16.11
 * - Bolts: ASTM A193, A320 per ASME B16.5 Table 6
 * - Nuts: ASTM A194 per ASME B16.5 Table 6
 * - Gaskets: ASME B16.20 (Spiral Wound), B16.21 (Non-metallic)
 * 
 * Temperature ranges from ASME B31.3 Table A-1 & ASME Section II Part D
 */

export interface MaterialSpec {
  id: string;
  designation: string;
  description: string;
  materialGroup: string; // "Carbon Steel" | "Low Alloy" | "Stainless" | "Duplex" | "Nickel Alloy"
  minTempC: number;
  maxTempC: number;
  standard: string;
  source: string;
  castEquivalent?: string; // Cast equivalent designation (preferred for NPS ≥ 2")
}

// ─── Pipe Materials ───────────────────────────────────────────────
export const PIPE_MATERIALS: MaterialSpec[] = [
  { id: "A106-B", designation: "A106 Gr.B", description: "Carbon steel, seamless pipe", materialGroup: "Carbon Steel", minTempC: -29, maxTempC: 427, standard: "ASTM A106", source: "ASME B31.3 Table A-1, ASTM A106/A106M" },
  { id: "A106-C", designation: "A106 Gr.C", description: "Carbon steel, seamless, higher tensile", materialGroup: "Carbon Steel", minTempC: -29, maxTempC: 427, standard: "ASTM A106", source: "ASME B31.3 Table A-1, ASTM A106/A106M" },
  { id: "A333-6", designation: "A333 Gr.6", description: "Carbon steel, low-temperature service", materialGroup: "Carbon Steel", minTempC: -46, maxTempC: 343, standard: "ASTM A333", source: "ASME B31.3 Table A-1, ASTM A333/A333M" },
  { id: "A335-P5", designation: "A335 P5", description: "5Cr-½Mo alloy, elevated temp", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A335", source: "ASME B31.3 Table A-1, ASTM A335/A335M" },
  { id: "A335-P9", designation: "A335 P9", description: "9Cr-1Mo alloy, elevated temp", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A335", source: "ASME B31.3 Table A-1, ASTM A335/A335M" },
  { id: "A335-P11", designation: "A335 P11", description: "1¼Cr-½Mo alloy, elevated temp", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A335", source: "ASME B31.3 Table A-1, ASTM A335/A335M" },
  { id: "A335-P22", designation: "A335 P22", description: "2¼Cr-1Mo alloy, elevated temp", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A335", source: "ASME B31.3 Table A-1, ASTM A335/A335M" },
  { id: "A335-P91", designation: "A335 P91", description: "9Cr-1Mo-V modified, high temp", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 649, standard: "ASTM A335", source: "ASME B31.3 Table A-1, ASTM A335/A335M" },
  { id: "A312-304", designation: "A312 TP304", description: "18Cr-8Ni austenitic stainless", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A312", source: "ASME B31.3 Table A-1, ASTM A312/A312M" },
  { id: "A312-304L", designation: "A312 TP304L", description: "Low carbon 304, weld corrosion resistant", materialGroup: "Stainless", minTempC: -254, maxTempC: 427, standard: "ASTM A312", source: "ASME B31.3 Table A-1, ASTM A312/A312M" },
  { id: "A312-316", designation: "A312 TP316", description: "16Cr-12Ni-2Mo austenitic stainless", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A312", source: "ASME B31.3 Table A-1, ASTM A312/A312M" },
  { id: "A312-316L", designation: "A312 TP316L", description: "Low carbon 316, corrosion resistant", materialGroup: "Stainless", minTempC: -254, maxTempC: 427, standard: "ASTM A312", source: "ASME B31.3 Table A-1, ASTM A312/A312M" },
  { id: "A312-321", designation: "A312 TP321", description: "Ti-stabilized austenitic stainless", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A312", source: "ASME B31.3 Table A-1, ASTM A312/A312M" },
  { id: "A312-347", designation: "A312 TP347", description: "Cb-stabilized austenitic stainless", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A312", source: "ASME B31.3 Table A-1, ASTM A312/A312M" },
  { id: "A790-S31803", designation: "A790 S31803", description: "22Cr duplex stainless (2205)", materialGroup: "Duplex", minTempC: -46, maxTempC: 316, standard: "ASTM A790", source: "ASME B31.3 Table A-1, ASTM A790/A790M" },
  { id: "A790-S32750", designation: "A790 S32750", description: "25Cr super duplex (2507)", materialGroup: "Duplex", minTempC: -46, maxTempC: 316, standard: "ASTM A790", source: "ASME B31.3 Table A-1, ASTM A790/A790M" },
  { id: "B167-600", designation: "B167 UNS N06600", description: "Alloy 600 (Inconel 600)", materialGroup: "Nickel Alloy", minTempC: -254, maxTempC: 816, standard: "ASTM B167", source: "ASME B31.3 Table A-1, ASTM B167" },
  { id: "B444-625", designation: "B444 UNS N06625", description: "Alloy 625 (Inconel 625)", materialGroup: "Nickel Alloy", minTempC: -254, maxTempC: 816, standard: "ASTM B444", source: "ASME B31.3 Table A-1, ASTM B444" },
];

// ─── Material Compatibility Map: Pipe → Flange/Fitting/Bolt/Gasket ─────────
export interface CompatibleSet {
  flanges: string[];      // designations
  fittings: string[];
  bolts: string[];
  gaskets: string[];
}

export const FLANGE_MATERIALS: MaterialSpec[] = [
  { id: "A105", designation: "A105", description: "Carbon steel forged", materialGroup: "Carbon Steel", minTempC: -29, maxTempC: 538, standard: "ASTM A105", source: "ASME B16.5 Table 1A, ASTM A105/A105M", castEquivalent: "A216 WCB" },
  { id: "A350-LF2", designation: "A350 LF2", description: "Carbon steel, low temp forged", materialGroup: "Carbon Steel", minTempC: -46, maxTempC: 343, standard: "ASTM A350", source: "ASME B16.5 Table 1A, ASTM A350/A350M", castEquivalent: "A352 LCB" },
  { id: "A182-F5", designation: "A182 F5", description: "5Cr-½Mo alloy forged", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A217 C5" },
  { id: "A182-F9", designation: "A182 F9", description: "9Cr-1Mo alloy forged", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A217 C12" },
  { id: "A182-F11", designation: "A182 F11 Cl.2", description: "1¼Cr-½Mo alloy forged", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A182", source: "ASME B16.5 Table 2-1.8, ASTM A182/A182M", castEquivalent: "A217 WC6" },
  { id: "A182-F22", designation: "A182 F22 Cl.3", description: "2¼Cr-1Mo alloy forged", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A182", source: "ASME B16.5 Table 2-1.9, ASTM A182/A182M", castEquivalent: "A217 WC9" },
  { id: "A182-F91", designation: "A182 F91", description: "9Cr-1Mo-V modified forged", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 649, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A217 C12A" },
  { id: "A182-F304", designation: "A182 F304", description: "304 SS forged", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A351 CF8" },
  { id: "A182-F304L", designation: "A182 F304L", description: "304L SS forged", materialGroup: "Stainless", minTempC: -254, maxTempC: 427, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A351 CF3" },
  { id: "A182-F316", designation: "A182 F316", description: "316 SS forged", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A351 CF8M" },
  { id: "A182-F316L", designation: "A182 F316L", description: "316L SS forged", materialGroup: "Stainless", minTempC: -254, maxTempC: 427, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A351 CF3M" },
  { id: "A182-F321", designation: "A182 F321", description: "321 SS forged", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A351 CF8C" },
  { id: "A182-F51", designation: "A182 F51", description: "Duplex 2205 forged", materialGroup: "Duplex", minTempC: -46, maxTempC: 316, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A995 4A" },
  { id: "A182-F53", designation: "A182 F53", description: "Super duplex 2507 forged", materialGroup: "Duplex", minTempC: -46, maxTempC: 316, standard: "ASTM A182", source: "ASME B16.5 Table 2, ASTM A182/A182M", castEquivalent: "A995 5A" },
  { id: "B564-N06600", designation: "B564 N06600", description: "Alloy 600 forged", materialGroup: "Nickel Alloy", minTempC: -254, maxTempC: 816, standard: "ASTM B564", source: "ASME B16.5 Table 2, ASTM B564", castEquivalent: "A494 CY40" },
  { id: "B564-N06625", designation: "B564 N06625", description: "Alloy 625 forged", materialGroup: "Nickel Alloy", minTempC: -254, maxTempC: 816, standard: "ASTM B564", source: "ASME B16.5 Table 2, ASTM B564", castEquivalent: "A494 CW-6MC" },
];

export const FITTING_MATERIALS: MaterialSpec[] = [
  { id: "A234-WPB", designation: "A234 WPB", description: "Carbon steel butt-weld fittings", materialGroup: "Carbon Steel", minTempC: -29, maxTempC: 427, standard: "ASTM A234", source: "ASME B16.9, ASTM A234/A234M" },
  { id: "A234-WPC", designation: "A234 WPC", description: "Carbon steel butt-weld, higher tensile", materialGroup: "Carbon Steel", minTempC: -29, maxTempC: 427, standard: "ASTM A234", source: "ASME B16.9, ASTM A234/A234M" },
  { id: "A420-WPL6", designation: "A420 WPL6", description: "Carbon steel, low temp fittings", materialGroup: "Carbon Steel", minTempC: -46, maxTempC: 343, standard: "ASTM A420", source: "ASME B16.9, ASTM A420/A420M" },
  { id: "A234-WP5", designation: "A234 WP5", description: "5Cr-½Mo alloy fittings", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A234", source: "ASME B16.9, ASTM A234/A234M" },
  { id: "A234-WP9", designation: "A234 WP9", description: "9Cr-1Mo alloy fittings", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A234", source: "ASME B16.9, ASTM A234/A234M" },
  { id: "A234-WP11", designation: "A234 WP11", description: "1¼Cr-½Mo alloy fittings", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A234", source: "ASME B16.9, ASTM A234/A234M" },
  { id: "A234-WP22", designation: "A234 WP22", description: "2¼Cr-1Mo alloy fittings", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 593, standard: "ASTM A234", source: "ASME B16.9, ASTM A234/A234M" },
  { id: "A234-WP91", designation: "A234 WP91", description: "9Cr-1Mo-V modified fittings", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 649, standard: "ASTM A234", source: "ASME B16.9, ASTM A234/A234M" },
  { id: "A403-WP304", designation: "A403 WP304", description: "304 SS fittings", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A403", source: "ASME B16.9, ASTM A403/A403M" },
  { id: "A403-WP304L", designation: "A403 WP304L", description: "304L SS fittings", materialGroup: "Stainless", minTempC: -254, maxTempC: 427, standard: "ASTM A403", source: "ASME B16.9, ASTM A403/A403M" },
  { id: "A403-WP316", designation: "A403 WP316", description: "316 SS fittings", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A403", source: "ASME B16.9, ASTM A403/A403M" },
  { id: "A403-WP316L", designation: "A403 WP316L", description: "316L SS fittings", materialGroup: "Stainless", minTempC: -254, maxTempC: 427, standard: "ASTM A403", source: "ASME B16.9, ASTM A403/A403M" },
  { id: "A403-WP321", designation: "A403 WP321", description: "321 SS fittings", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A403", source: "ASME B16.9, ASTM A403/A403M" },
];

export const BOLT_MATERIALS: MaterialSpec[] = [
  { id: "A193-B7", designation: "A193 B7 / A194 2H", description: "Standard Cr-Mo stud bolt with heavy hex nut", materialGroup: "Carbon Steel", minTempC: -40, maxTempC: 400, standard: "ASTM A193/A194", source: "ASME B16.5 Table 6, ASTM A193/A194" },
  { id: "A193-B7M", designation: "A193 B7M / A194 2HM", description: "Reduced hardness for sour service (HRC ≤ 22)", materialGroup: "Carbon Steel", minTempC: -40, maxTempC: 400, standard: "ASTM A193/A194", source: "NACE MR0175/ISO 15156, ASTM A193" },
  { id: "A193-B16", designation: "A193 B16 / A194 Gr.4", description: "Cr-Mo-V for elevated temperature", materialGroup: "Low Alloy", minTempC: -29, maxTempC: 538, standard: "ASTM A193/A194", source: "ASME B31.3 Table A-2, ASTM A193" },
  { id: "A193-B8", designation: "A193 B8 Cl.1 / A194 Gr.8", description: "304 SS stud bolt, solution annealed", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A193/A194", source: "ASME B16.5 Table 6, ASTM A193" },
  { id: "A193-B8M", designation: "A193 B8M Cl.1 / A194 Gr.8M", description: "316 SS stud bolt, solution annealed", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A193/A194", source: "ASME B16.5 Table 6, ASTM A193" },
  { id: "A320-L7", designation: "A320 L7 / A194 Gr.4", description: "Low-temperature Cr-Mo stud bolt", materialGroup: "Carbon Steel", minTempC: -101, maxTempC: 400, standard: "ASTM A320/A194", source: "ASME B31.3 §323.2.2, ASTM A320" },
  { id: "A320-L7M", designation: "A320 L7M / A194 2HM", description: "Low-temp, sour service (HRC ≤ 22)", materialGroup: "Carbon Steel", minTempC: -101, maxTempC: 400, standard: "ASTM A320/A194", source: "NACE MR0175, ASTM A320" },
  { id: "A320-B8", designation: "A320 B8 Cl.1 / A194 Gr.8", description: "304 SS low-temperature bolt", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASTM A320/A194", source: "ASTM A320" },
];

export const GASKET_TYPES: MaterialSpec[] = [
  { id: "SW-CS-FG", designation: "Spiral Wound, CS/Flex.Graphite", description: "CS windings + flexible graphite filler, 150-2500# flanges", materialGroup: "Carbon Steel", minTempC: -100, maxTempC: 538, standard: "ASME B16.20", source: "ASME B16.20, B31.3 §323.4.2" },
  { id: "SW-SS304-FG", designation: "Spiral Wound, SS304/Flex.Graphite", description: "304 SS windings + flexible graphite filler", materialGroup: "Stainless", minTempC: -254, maxTempC: 538, standard: "ASME B16.20", source: "ASME B16.20" },
  { id: "SW-SS316-FG", designation: "Spiral Wound, SS316/Flex.Graphite", description: "316 SS windings + flexible graphite filler", materialGroup: "Stainless", minTempC: -254, maxTempC: 538, standard: "ASME B16.20", source: "ASME B16.20" },
  { id: "SW-SS316-PTFE", designation: "Spiral Wound, SS316/PTFE", description: "316 SS windings + PTFE filler, chemical service", materialGroup: "Stainless", minTempC: -200, maxTempC: 260, standard: "ASME B16.20", source: "ASME B16.20" },
  { id: "SW-SS321-FG", designation: "Spiral Wound, SS321/Flex.Graphite", description: "321 SS windings + flexible graphite", materialGroup: "Stainless", minTempC: -254, maxTempC: 538, standard: "ASME B16.20", source: "ASME B16.20" },
  { id: "RTJ-SOFT-IRON", designation: "RTJ Soft Iron (R-type)", description: "Ring-type joint, soft iron, for high-pressure", materialGroup: "Carbon Steel", minTempC: -29, maxTempC: 427, standard: "ASME B16.20", source: "ASME B16.20, API 6A" },
  { id: "RTJ-SS304", designation: "RTJ SS304 (R-type)", description: "Ring-type joint, 304 SS", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASME B16.20", source: "ASME B16.20" },
  { id: "RTJ-SS316", designation: "RTJ SS316 (R-type)", description: "Ring-type joint, 316 SS", materialGroup: "Stainless", minTempC: -254, maxTempC: 816, standard: "ASME B16.20", source: "ASME B16.20" },
  { id: "CAF", designation: "Compressed Asbestos-Free (CAF)", description: "Non-metallic sheet gasket, low pressure", materialGroup: "Carbon Steel", minTempC: -50, maxTempC: 200, standard: "ASME B16.21", source: "ASME B16.21" },
  { id: "PTFE-ENVELOPE", designation: "PTFE Envelope Gasket", description: "PTFE enclosed, chemical resistance", materialGroup: "Stainless", minTempC: -200, maxTempC: 230, standard: "ASME B16.21", source: "ASME B16.21" },
];

// ─── Compatibility mapping: pipe material → compatible components ────────────
// Based on ASME B31.3 material grouping and standard industry practice
export const PIPE_COMPATIBILITY: Record<string, CompatibleSet> = {
  "A106-B": { flanges: ["A105"], fittings: ["A234 WPB"], bolts: ["A193 B7 / A194 2H"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A106-C": { flanges: ["A105"], fittings: ["A234 WPC"], bolts: ["A193 B7 / A194 2H"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A333-6": { flanges: ["A350 LF2"], fittings: ["A420 WPL6"], bolts: ["A320 L7 / A194 Gr.4"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A335-P5": { flanges: ["A182 F5"], fittings: ["A234 WP5"], bolts: ["A193 B16 / A194 Gr.4", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A335-P9": { flanges: ["A182 F9"], fittings: ["A234 WP9"], bolts: ["A193 B16 / A194 Gr.4", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A335-P11": { flanges: ["A182 F11 Cl.2"], fittings: ["A234 WP11"], bolts: ["A193 B16 / A194 Gr.4", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A335-P22": { flanges: ["A182 F22 Cl.3"], fittings: ["A234 WP22"], bolts: ["A193 B16 / A194 Gr.4", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A335-P91": { flanges: ["A182 F91"], fittings: ["A234 WP91"], bolts: ["A193 B16 / A194 Gr.4"], gaskets: ["Spiral Wound, CS/Flex.Graphite"] },
  "A312-304": { flanges: ["A182 F304"], fittings: ["A403 WP304"], bolts: ["A193 B8 Cl.1 / A194 Gr.8", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, SS304/Flex.Graphite", "Spiral Wound, SS316/PTFE"] },
  "A312-304L": { flanges: ["A182 F304L"], fittings: ["A403 WP304L"], bolts: ["A193 B8 Cl.1 / A194 Gr.8", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, SS304/Flex.Graphite", "Spiral Wound, SS316/PTFE"] },
  "A312-316": { flanges: ["A182 F316"], fittings: ["A403 WP316"], bolts: ["A193 B8M Cl.1 / A194 Gr.8M", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, SS316/Flex.Graphite", "Spiral Wound, SS316/PTFE"] },
  "A312-316L": { flanges: ["A182 F316L"], fittings: ["A403 WP316L"], bolts: ["A193 B8M Cl.1 / A194 Gr.8M", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, SS316/Flex.Graphite", "Spiral Wound, SS316/PTFE"] },
  "A312-321": { flanges: ["A182 F321"], fittings: ["A403 WP321"], bolts: ["A193 B8 Cl.1 / A194 Gr.8", "A193 B7 / A194 2H"], gaskets: ["Spiral Wound, SS321/Flex.Graphite"] },
  "A312-347": { flanges: ["A182 F304", "A182 F316"], fittings: ["A403 WP304", "A403 WP316"], bolts: ["A193 B8 Cl.1 / A194 Gr.8"], gaskets: ["Spiral Wound, SS304/Flex.Graphite"] },
  "A790-S31803": { flanges: ["A182 F51"], fittings: ["A403 WP304L", "A403 WP316L"], bolts: ["A193 B7 / A194 2H", "A193 B7M / A194 2HM"], gaskets: ["Spiral Wound, SS316/Flex.Graphite"] },
  "A790-S32750": { flanges: ["A182 F53"], fittings: ["A403 WP316L"], bolts: ["A193 B7 / A194 2H", "A193 B7M / A194 2HM"], gaskets: ["Spiral Wound, SS316/Flex.Graphite"] },
  "B167-600": { flanges: ["B564 N06600"], fittings: ["A403 WP304"], bolts: ["A193 B7 / A194 2H"], gaskets: ["Spiral Wound, SS316/Flex.Graphite"] },
  "B444-625": { flanges: ["B564 N06625"], fittings: ["A403 WP316L"], bolts: ["A193 B7 / A194 2H"], gaskets: ["Spiral Wound, SS316/Flex.Graphite"] },
};

/**
 * Get compatible materials for a given pipe material selection
 */
export function getCompatibleMaterials(pipeId: string): CompatibleSet | null {
  return PIPE_COMPATIBILITY[pipeId] || null;
}

/**
 * Find pipe material ID from designation string
 */
export function findPipeIdByDesignation(designation: string): string | null {
  const pipe = PIPE_MATERIALS.find(p => p.designation === designation);
  return pipe ? pipe.id : null;
}

/**
 * Get all dropdown options for a given material category, filtered by temperature
 */
export function getFilteredPipeMaterials(designTempC: number): MaterialSpec[] {
  return PIPE_MATERIALS.filter(m => designTempC >= m.minTempC && designTempC <= m.maxTempC);
}
