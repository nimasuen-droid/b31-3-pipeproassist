/**
 * Valve Class Table Engine
 *
 * Produces a per-valve-type recommendation table driven by the PMS
 * material envelope (defined in Design Inputs / PMS) and then filtered
 * by valve-specific mechanical / sealing / leakage constraints.
 *
 * Logic:
 *  1. PMS material envelope (pipe family, flange class, service severity,
 *     temperature) defines the base allowable body / trim / seat envelope.
 *  2. Valve type then narrows that envelope to what is mechanically
 *     suitable for the valve's sealing method and application.
 *  3. We never hard-code a single material per valve type — body always
 *     follows the PMS family; trim and seat follow service constraints.
 *
 * References: ASME B16.34, B16.10, B16.5; API 600/602/608/594/623/602
 *             API 6D / 6FA / 607; NACE MR0175 / ISO 15156; CGA G-4.1
 */

import {
  classifyMaterialFamily,
  classifyServiceSeverity,
  type MaterialFamily,
  type ServiceSeverity,
} from "./engineeringClassification";

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export type ClassValveType =
  | "Ball Valve"
  | "Gate Valve"
  | "Globe Valve"
  | "Check Valve"
  | "Wafer Type Valve"
  | "Needle Valve";

export type WaferSubtype = "Wafer Check" | "Wafer Butterfly" | "Other Wafer Pattern";

export interface ValveClassRow {
  valveType: ClassValveType;
  npsRange: string;
  ratingClass: string;
  ends: string;
  body: string;
  smallBoreBody: string;
  largeBoreBody: string;
  bodyAlternatives: string[];
  trim: string;
  trimAlternatives: string[];
  seat: string;
  seatAlternatives: string[];
  basis: string;
  applicableStandard: string;
  reviewFlags: string[];
  /** Subtype clarification required (e.g. wafer) */
  requiresSubtype?: { prompt: string; options: string[] };
  /** Notes for treatment (e.g. needle = small bore only) */
  scopeNote?: string;
}

export interface ValveClassTableInputs {
  pipeMaterial: string;          // PMS base material (e.g. "A106-B")
  serviceType: string;
  corrosionSeverity: string;
  designTemperature: string;     // °C
  designPressure: string;        // bar
  serviceDescription?: string;
  flangeClass?: string;          // e.g. "150", "300", "600"
  fireSafeRequired?: boolean;
  bubbleTightRequired?: boolean;
  /** Wafer subtype (user-supplied) */
  waferSubtype?: WaferSubtype;
}

export interface ValveClassTableResult {
  rows: ValveClassRow[];
  pmsEnvelope: {
    family: MaterialFamily;
    severity: ServiceSeverity[];
    tempC: number;
    pressureBar: number;
    flangeClass: string;
  };
  globalWarnings: string[];
}

// ════════════════════════════════════════════════════════════════
// PMS-DRIVEN BODY MATERIAL ENVELOPE
// ════════════════════════════════════════════════════════════════

interface BodyEnvelope {
  cast: { primary: string; alternatives: string[] };
  forged: { primary: string; alternatives: string[] };
}

const BODY_ENVELOPE: Record<MaterialFamily, BodyEnvelope> = {
  "Carbon Steel": {
    cast: { primary: "ASTM A216 WCB", alternatives: ["ASTM A216 WCC", "ASTM A352 LCB (low temp)", "ASTM A352 LCC"] },
    forged: { primary: "ASTM A105", alternatives: ["ASTM A350 LF2 (low temp)", "ASTM A350 LF3"] },
  },
  "Low Alloy": {
    cast: { primary: "ASTM A217 WC6", alternatives: ["ASTM A217 WC9", "ASTM A217 C5", "ASTM A217 C12"] },
    forged: { primary: "ASTM A182 F11", alternatives: ["ASTM A182 F22", "ASTM A182 F5", "ASTM A182 F9"] },
  },
  "Stainless": {
    cast: { primary: "ASTM A351 CF8M (316)", alternatives: ["ASTM A351 CF8 (304)", "ASTM A351 CF3M (316L)", "ASTM A351 CG8M (317)"] },
    forged: { primary: "ASTM A182 F316", alternatives: ["ASTM A182 F304", "ASTM A182 F316L", "ASTM A182 F321", "ASTM A182 F347"] },
  },
  "Duplex": {
    cast: { primary: "ASTM A995 4A (CD3MN)", alternatives: ["ASTM A995 5A (CD3MWCuN)", "ASTM A995 6A"] },
    forged: { primary: "ASTM A182 F51 (UNS S31803)", alternatives: ["ASTM A182 F55 (Super Duplex)", "ASTM A182 F53"] },
  },
  "Nickel Alloy": {
    cast: { primary: "ASTM A494 CY40 (Inconel 600)", alternatives: ["ASTM A494 CW6MC (625)", "ASTM A494 N7M (Hastelloy B)"] },
    forged: { primary: "ASTM B564 UNS N06625 (Inconel 625)", alternatives: ["ASTM B564 N08825", "ASTM B564 N10276 (C-276)"] },
  },
};

// ════════════════════════════════════════════════════════════════
// TRIM / SEAT MATRIX (service-driven)
// ════════════════════════════════════════════════════════════════

interface MaterialChoice {
  primary: string;
  alternatives: string[];
}

interface BodyPhilosophy {
  smallBore: MaterialChoice;
  largeBore: MaterialChoice;
  display: string;
  basis: string;
}

function serviceTag(choice: MaterialChoice, tag: string): MaterialChoice {
  return {
    primary: `${choice.primary} ${tag}`,
    alternatives: choice.alternatives.map((alt) => `${alt} ${tag}`),
  };
}

function selectBodyPhilosophy(
  family: MaterialFamily,
  severity: Set<ServiceSeverity>,
  tempC: number,
): BodyPhilosophy {
  const envelope = BODY_ENVELOPE[family];
  let smallBore = envelope.forged;
  let largeBore = envelope.cast;
  const basis: string[] = [
    "Small-bore valves use forged bodies; large-bore valves use cast bodies unless the valve standard or project datasheet specifies otherwise.",
  ];

  if (severity.has("cryogenic") || tempC < -29) {
    if (family === "Carbon Steel") {
      smallBore = { primary: "ASTM A350 LF2", alternatives: ["ASTM A350 LF3"] };
      largeBore = { primary: "ASTM A352 LCB", alternatives: ["ASTM A352 LCC"] };
    }
    basis.push("Low-temperature service requires impact-qualified body materials.");
  }

  if (severity.has("sour")) {
    smallBore = serviceTag(smallBore, "(NACE MR0175 qualified)");
    largeBore = serviceTag(largeBore, "(NACE MR0175 qualified)");
    basis.push("Sour service requires NACE MR0175/ISO 15156 qualification, hardness control, and documented material condition.");
  }

  if (severity.has("oxygen")) {
    basis.push("Oxygen service requires oxygen-cleaned wetted parts and non-hydrocarbon lubricants per CGA G-4.1.");
  }

  if (severity.has("hydrogen")) {
    basis.push("Hydrogen service requires material confirmation against API RP 941 / hydrogen embrittlement risk.");
  }

  if (severity.has("corrosive") && family === "Carbon Steel") {
    basis.push("Corrosive service on carbon steel is conditional; confirm corrosion allowance or upgrade the PMS material family.");
  }

  return {
    smallBore,
    largeBore,
    display: `SB: ${smallBore.primary} / LB: ${largeBore.primary}`,
    basis: basis.join(" "),
  };
}

function selectTrim(
  family: MaterialFamily,
  valveType: ClassValveType,
  severity: Set<ServiceSeverity>,
  tempC: number,
): MaterialChoice {
  void valveType;

  // NACE / sour service
  if (severity.has("sour")) {
    return {
      primary: "Trim 8 (13Cr / Stellite hardfaced) — NACE MR0175",
      alternatives: ["Trim 5 (13Cr)", "Inconel 625 overlay (Trim 18)", "Hastelloy C-276 (Trim 19)"],
    };
  }
  if (severity.has("hydrogen")) {
    return {
      primary: "Trim 5 (13Cr) — verify H₂ embrittlement per API 941",
      alternatives: ["Inconel 625", "316 SS (low strength)"],
    };
  }
  if (tempC > 425) {
    return {
      primary: "Trim 12 (Stellite 6 hardfaced) — high temperature",
      alternatives: ["Trim 16 (Inconel hardfaced)", "Trim 8"],
    };
  }
  if (family === "Stainless" || family === "Duplex") {
    return {
      primary: family === "Duplex" ? "Duplex (UNS S31803) trim" : "316 SS / Stellite hardfaced (Trim 10)",
      alternatives: ["Trim 8 (13Cr/Stellite)", "Trim 5 (13Cr)"],
    };
  }
  if (family === "Nickel Alloy") {
    return { primary: "Inconel 625 trim", alternatives: ["Hastelloy C-276", "Monel 400"] };
  }
  return {
    primary: "Trim 8 (13Cr / Stellite hardfaced)",
    alternatives: ["Trim 5 (13Cr)", "Trim 1 (13Cr, soft)"],
  };
}

function selectServiceTrim(
  family: MaterialFamily,
  valveType: ClassValveType,
  severity: Set<ServiceSeverity>,
  tempC: number,
): MaterialChoice {
  const metalSeatedValve = valveType === "Gate Valve" || valveType === "Globe Valve" || valveType === "Check Valve";
  const quarterTurnValve = valveType === "Ball Valve" || valveType === "Wafer Type Valve";

  if (severity.has("sour")) {
    return {
      primary: metalSeatedValve
        ? "Trim 8 (13Cr / Stellite hardfaced) - NACE MR0175"
        : "316 SS / 13Cr trim with NACE-qualified stem and ball/disc",
      alternatives: ["Trim 5 (13Cr)", "Inconel 625 overlay (Trim 18)", "Hastelloy C-276 (Trim 19)"],
    };
  }

  if (severity.has("oxygen")) {
    return {
      primary: quarterTurnValve ? "Monel / 316 SS oxygen-clean trim" : "316 SS / Stellite oxygen-clean trim",
      alternatives: ["Monel 400", "Inconel 625", "316 SS"],
    };
  }

  if (metalSeatedValve) {
    return {
      primary: family === "Nickel Alloy" ? "Inconel 625 hardfaced trim" : "Trim 8 (13Cr / Stellite hardfaced)",
      alternatives: ["Trim 5 (13Cr)", "Trim 12 (Stellite 6)", "Inconel 625 overlay"],
    };
  }

  return selectTrim(family, valveType, severity, tempC);
}

function selectSeat(
  valveType: ClassValveType,
  severity: Set<ServiceSeverity>,
  tempC: number,
  fireSafe: boolean,
  bubbleTight: boolean,
): MaterialChoice {
  const hot = tempC > 200 || severity.has("high_temp");
  const cold = severity.has("cryogenic") || tempC < -29;
  const oxygen = severity.has("oxygen");

  // Globe / Gate / Check inherently use metal-to-metal seats
  if (valveType === "Globe Valve" || valveType === "Gate Valve" || valveType === "Check Valve") {
    return {
      primary: "Stellite 6 hardfaced metal seat",
      alternatives: ["13Cr (integral)", "Inconel 625 hardfaced", "Stellite 21"],
    };
  }

  // Needle: usually integral metal stem-tip
  if (valveType === "Needle Valve") {
    return {
      primary: "Integral metal seat (316/Monel/Hastelloy per body)",
      alternatives: ["PEEK insert (instrument service ≤ 200°C)"],
    };
  }

  // Ball / Wafer (butterfly): seat options dominate
  if (oxygen) {
    return {
      primary: "PCTFE / oxygen-clean PTFE (CGA G-4.1)",
      alternatives: ["Kel-F", "Devlon V (degreased)"],
    };
  }
  if (cold) {
    return {
      primary: "PCTFE (cryogenic) / RPTFE",
      alternatives: ["UHMW-PE", "PEEK"],
    };
  }
  if (hot || fireSafe) {
    if (bubbleTight) {
      return {
        primary: "PEEK or Devlon with Stellite secondary (fire-safe API 607)",
        alternatives: ["Metal seat with graphite secondary", "Nitrided 17-4PH"],
      };
    }
    return {
      primary: "Metal seat (Stellite 6) per API 607",
      alternatives: ["PEEK (≤ 250°C)", "Inconel 625 hardfaced"],
    };
  }
  return {
    primary: "RPTFE (15% glass-filled PTFE) — bubble-tight",
    alternatives: ["PTFE virgin", "PEEK", "Devlon V", "Nylon (low-temp utility)"],
  };
}

// ════════════════════════════════════════════════════════════════
// VALVE TYPE DEFINITIONS (mechanical envelope)
// ════════════════════════════════════════════════════════════════

interface ValveDef {
  npsRange: string;
  defaultEnds: string;
  smallBoreEnds: string;
  applicableStandards: string[];
  basisIntro: string;
  preferredCast: boolean; // cast body preferred for large bore
  scopeNote?: string;
  requiresSubtype?: { prompt: string; options: string[] };
}

const VALVE_DEFS: Record<ClassValveType, ValveDef> = {
  "Ball Valve": {
    npsRange: '½" – 36"',
    defaultEnds: "RF Flanged (BW for ≥ 600#)",
    smallBoreEnds: "SW / NPT (forged)",
    applicableStandards: ["API 608 (Floating)", "API 6D (Trunnion)", "ASME B16.34", "API 607 (Fire-Safe)"],
    basisIntro: "Quarter-turn isolation with bubble-tight shutoff. Body follows PMS; seat selected for service & leakage class.",
    preferredCast: false,
  },
  "Gate Valve": {
    npsRange: '½" – 48"',
    defaultEnds: "RF Flanged / BW",
    smallBoreEnds: "SW / NPT (API 602 forged)",
    applicableStandards: ["API 600 (Cast, Flanged)", "API 602 (Forged, Compact)", "ASME B16.34"],
    basisIntro: "Full-bore on/off isolation. Cast body for ≥ 2\", forged for ≤ 1½\". Metal-to-metal wedge seat.",
    preferredCast: true,
  },
  "Globe Valve": {
    npsRange: '½" – 24"',
    defaultEnds: "RF Flanged",
    smallBoreEnds: "SW / NPT",
    applicableStandards: ["API 623 (Cast)", "BS 1873", "API 602 (Forged)", "ASME B16.34"],
    basisIntro: "Throttling and tight-shutoff service. Disc moves perpendicular to seat for fine flow control.",
    preferredCast: true,
  },
  "Check Valve": {
    npsRange: '½" – 48"',
    defaultEnds: "RF Flanged / BW / Wafer",
    smallBoreEnds: "SW / NPT (lift / piston)",
    applicableStandards: ["API 594 (Wafer / Dual-Plate)", "API 6D", "BS 1868 (Swing)", "ASME B16.34"],
    basisIntro: "Non-return device — body matches PMS, seat selected to avoid slam and bubble-tight where required.",
    preferredCast: true,
  },
  "Wafer Type Valve": {
    npsRange: '2" – 48"',
    defaultEnds: "Wafer (between flanges) / Lugged",
    smallBoreEnds: "Not typical — confirm subtype",
    applicableStandards: ["API 594 (Wafer Check)", "MSS SP-67 (Butterfly)", "API 609", "ASME B16.34"],
    basisIntro: "Compact, short face-to-face design. Subtype dictates sealing and pressure envelope.",
    preferredCast: false,
    requiresSubtype: {
      prompt: "Wafer pattern is ambiguous — confirm subtype:",
      options: ["Wafer Check", "Wafer Butterfly", "Other Wafer Pattern"],
    },
  },
  "Needle Valve": {
    npsRange: '¼" – 2"',
    defaultEnds: "NPT / SW / Tube fitting (compression)",
    smallBoreEnds: "NPT / SW / Tube fitting",
    applicableStandards: ["ASME B16.34", "MSS SP-99 (Instrument)", "MSS SP-83"],
    basisIntro: "Small-bore precise throttling, vent / drain, and instrument isolation only.",
    preferredCast: false,
    scopeNote: "Treated as small-bore / instrument / vent / drain service unless explicitly specified otherwise.",
  },
};

// ════════════════════════════════════════════════════════════════
// FLAGS & VALIDATION
// ════════════════════════════════════════════════════════════════

function buildFlags(
  valveType: ClassValveType,
  body: MaterialChoice,
  trim: MaterialChoice,
  seat: MaterialChoice,
  family: MaterialFamily,
  severity: Set<ServiceSeverity>,
  tempC: number,
  fireSafe: boolean,
  bubbleTight: boolean,
  waferSubtype?: WaferSubtype,
): string[] {
  const flags: string[] = [];

  // Body conflicts with PMS
  const bodyTxt = body.primary.toLowerCase();
  if (severity.has("sour") && (bodyTxt.includes("a216 wcb") || bodyTxt.includes("a105"))) {
    flags.push("WCB / A105 in sour service — verify NACE MR0175 hardness ≤ 22 HRC and supplementary CVN testing.");
  }
  if (severity.has("cryogenic") && (bodyTxt.includes("a216 wcb") || bodyTxt.includes("a105"))) {
    flags.push("WCB / A105 not impact-tested below -29°C — switch to LCB / LCC / LF2 for low-temperature service.");
  }
  if (severity.has("corrosive") && family === "Carbon Steel") {
    flags.push("Carbon steel body in corrosive service — confirm corrosion allowance and consider CRA upgrade.");
  }

  // Seat / PTFE flags
  const seatTxt = seat.primary.toLowerCase();
  const isSoftSeat = /(ptfe|rptfe|tfe|peek|devlon|nylon|uhmw|pctfe|kel-?f)/.test(seatTxt);
  const isPTFEFamily = /(ptfe|rptfe|tfe)/.test(seatTxt);

  // Soft seat must NOT be applied to gate / globe / check valves (mechanically metal-to-metal)
  if (isSoftSeat && (valveType === "Gate Valve" || valveType === "Globe Valve" || valveType === "Check Valve")) {
    flags.push(
      `Soft seat (${seat.primary}) on ${valveType.toLowerCase()} — these are inherently metal-to-metal sealing valves. ` +
      "Switch to a hardfaced metal seat (Stellite 6 / 13Cr) unless explicitly justified by project specification.",
    );
  }

  if (isPTFEFamily) {
    if (tempC > 200) flags.push("PTFE / RPTFE seat above 200°C — creep & sealing loss; switch to PEEK or metal seat.");
    if (fireSafe && valveType === "Ball Valve" && !seatTxt.includes("secondary") && !seatTxt.includes("api 607")) {
      flags.push("Ball valve with PTFE seat in fire-safe service — confirm documented metal secondary seat fire-test qualification per API 607 / API 6FA.");
    }
    if (fireSafe && valveType !== "Ball Valve") {
      flags.push("PTFE seat with fire-safe requirement — must have documented metal secondary seal fire-test qualification to API 607 / 6FA.");
    }
    if (severity.has("oxygen") && !seatTxt.includes("oxygen")) flags.push("PTFE in O₂ service must be specifically oxygen-cleaned per CGA G-4.1.");
  }

  // Trim definition validation — trim must reference 13Cr / Stellite / CRA, never plain carbon steel
  const trimTxt = trim.primary.toLowerCase();
  const trimLooksLikeCS = /(carbon steel|a105|a216|wcb|a350)/.test(trimTxt);
  const trimNamesCRA = /(13cr|stellite|inconel|hastelloy|monel|duplex|316|stainless|nace|trim\s*\d+)/.test(trimTxt);
  if (trimLooksLikeCS || !trimNamesCRA) {
    flags.push(
      "Trim definition appears inconsistent with API 600 / API 602 / B16.34 trim numbers — " +
      "trim must be a hardfaced / corrosion-resistant material (e.g. 13Cr, Stellite 6, Inconel 625), not plain carbon steel.",
    );
  }

  // Bubble-tight + metal seat (no soft secondary)
  if (bubbleTight && seatTxt.includes("metal") && !seatTxt.includes("secondary")) {
    flags.push("Metal seat where bubble-tight shutoff is required — confirm leakage class (ISO 5208 Rate A / FCI 70-2 Class VI).");
  }

  // Wafer subtype not specified
  if (valveType === "Wafer Type Valve" && !waferSubtype) {
    flags.push("Wafer subtype not specified — clarify Wafer Check, Wafer Butterfly, or other wafer pattern.");
  }

  // Needle valve scope
  if (valveType === "Needle Valve" && severity.has("normal") === false && severity.size > 1) {
    flags.push("Needle valve specified outside small-bore / instrument scope — confirm intended service.");
  }

  // Trim degradation
  if (severity.has("sour") && !trim.primary.toLowerCase().includes("nace") && !trim.primary.toLowerCase().includes("13cr")) {
    flags.push("Trim does not reference NACE-compliant material for sour service — verify per MR0175 / ISO 15156.");
  }

  return flags;
}

// ════════════════════════════════════════════════════════════════
// ENDS SELECTION
// ════════════════════════════════════════════════════════════════

function selectEnds(def: ValveDef, flangeClass: string): string {
  const cls = parseInt(flangeClass.replace(/[^\d]/g, ""), 10) || 150;
  if (cls >= 900) {
    // High pressure → BW or RTJ flanged
    return def.defaultEnds.replace("RF", "RTJ").replace("Flanged", "Flanged / BW");
  }
  return def.defaultEnds;
}

// ════════════════════════════════════════════════════════════════
// MAIN ENTRY
// ════════════════════════════════════════════════════════════════

export function buildValveClassTable(inputs: ValveClassTableInputs): ValveClassTableResult {
  const family = classifyMaterialFamily(inputs.pipeMaterial);
  const tempC = parseFloat(inputs.designTemperature) || 20;
  const pressureBar = parseFloat(inputs.designPressure) || 0;
  const flangeClass = inputs.flangeClass || "150";

  const severity = classifyServiceSeverity({
    serviceType: inputs.serviceType,
    corrosionSeverity: inputs.corrosionSeverity,
    designTempC: tempC,
    serviceDescription: inputs.serviceDescription,
  });

  const fireSafe = inputs.fireSafeRequired
    ?? (inputs.serviceType?.includes("Hydrocarbon") || severity.has("sour"));
  const bubbleTight = inputs.bubbleTightRequired ?? true;

  const rows: ValveClassRow[] = (Object.keys(VALVE_DEFS) as ClassValveType[]).map(vt => {
    const def = VALVE_DEFS[vt];
    const isNeedle = vt === "Needle Valve";
    const bodyPhilosophy = selectBodyPhilosophy(family, severity, tempC);
    // The body philosophy below replaces any single global body default.
    const useForged = isNeedle || def.npsRange.includes("¼") && !def.preferredCast;

    // Body: cast for large-bore, forged for small-bore / needle
    const bodyChoice: MaterialChoice = isNeedle ? bodyPhilosophy.smallBore : {
      primary: bodyPhilosophy.display,
      alternatives: [...bodyPhilosophy.smallBore.alternatives, ...bodyPhilosophy.largeBore.alternatives],
    };

    const trim = selectServiceTrim(family, vt, severity, tempC);
    const seat = selectSeat(vt, severity, tempC, fireSafe, bubbleTight);
    const flags = buildFlags(vt, bodyChoice, trim, seat, family, severity, tempC, fireSafe, bubbleTight, inputs.waferSubtype);
    const ends = isNeedle ? def.smallBoreEnds : selectEnds(def, flangeClass);

    let basis = `${def.basisIntro} PMS family: ${family}; flange class: ${flangeClass}#; design ${tempC}°C @ ${pressureBar} bar.`;
    basis += ` ${bodyPhilosophy.basis}`;
    if (vt === "Wafer Type Valve" && inputs.waferSubtype) {
      basis += ` Subtype: ${inputs.waferSubtype}.`;
    }
    if (isNeedle) basis += " Restricted to small-bore / instrument / vent / drain service.";

    return {
      valveType: vt,
      npsRange: def.npsRange,
      ratingClass: `Class ${flangeClass}# (ASME B16.34)`,
      ends,
      body: bodyChoice.primary,
      smallBoreBody: bodyPhilosophy.smallBore.primary,
      largeBoreBody: isNeedle ? bodyPhilosophy.smallBore.primary : bodyPhilosophy.largeBore.primary,
      bodyAlternatives: bodyChoice.alternatives,
      trim: trim.primary,
      trimAlternatives: trim.alternatives,
      seat: seat.primary,
      seatAlternatives: seat.alternatives,
      basis,
      applicableStandard: def.applicableStandards.join(" • "),
      reviewFlags: flags,
      requiresSubtype: vt === "Wafer Type Valve" && !inputs.waferSubtype ? def.requiresSubtype : undefined,
      scopeNote: def.scopeNote,
    };
  });

  // Global validation
  const globalWarnings: string[] = [];
  const allSeats = new Set(rows.map(r => r.seat));
  if (allSeats.size === 1) {
    globalWarnings.push(
      "Same seat material applied to every valve type — valve-specific sealing requirements have not been considered. " +
      "Gate/Globe/Check require metal-to-metal seating; Ball/Wafer seat selection should be service-specific.",
    );
  }
  const softSeatValves = rows.filter(r => r.valveType === "Ball Valve" || r.valveType === "Wafer Type Valve");
  const metalValves = rows.filter(r =>
    r.valveType === "Gate Valve" || r.valveType === "Globe Valve" || r.valveType === "Check Valve",
  );
  const overlap = softSeatValves.some(s => metalValves.some(m => m.seat === s.seat));
  if (overlap && allSeats.size > 1) {
    globalWarnings.push(
      "Soft-seat-capable valves share seat material with metal-only valves — verify each valve type was evaluated independently.",
    );
  }
  // Trim consistency across rows
  const allTrims = new Set(rows.map(r => r.trim));
  if (allTrims.size === 1 && rows.length > 1) {
    globalWarnings.push(
      "Identical trim used across all valve types — confirm trim is appropriate per API 600/602/623 for each valve.",
    );
  }

  return {
    rows,
    pmsEnvelope: {
      family,
      severity: [...severity],
      tempC,
      pressureBar,
      flangeClass,
    },
    globalWarnings,
  };
}
