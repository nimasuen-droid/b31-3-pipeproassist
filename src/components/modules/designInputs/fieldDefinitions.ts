/**
 * Field Definitions Database
 * Teaching content for every input field in the Design Inputs module
 */

export interface FieldDefinition {
  label: string;
  definition: string;
  codeContext: string;
  whyMatters: string;
  impact: string;
  typicalRange: string;
  commonMistakes: string;
  whenConservative: string;
}

export const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  // === Service Classification ===
  fluidPhase: {
    label: "Fluid Phase",
    definition: "The physical state of the process fluid: liquid, gas, two-phase (mixed), steam, or slurry.",
    codeContext: "ASME B31.3 §300.2 — fluid phase affects service classification, test medium selection, and support span loading.",
    whyMatters: "Phase determines fluid density (affects support loads), compressibility (affects test risk), and flow regime (affects erosion).",
    impact: "Gas/steam → lighter operating load but pneumatic test risk. Liquid → heavier loads. Two-phase → erosion/vibration risk. Slurry → high erosion allowance needed.",
    typicalRange: "Liquid (water, oil, chemicals), Gas (natural gas, air, nitrogen), Steam (utility/process), Two-Phase (flashing, condensing), Slurry (mining, FGD).",
    commonMistakes: "Assuming single phase when flashing or condensation occurs. Ignoring two-phase flow vibration risk.",
    whenConservative: "When phase is uncertain, design for the heavier phase (liquid for loads, gas for test pressure considerations).",
  },
  pipingCategory: {
    label: "Piping Category",
    definition: "ASME B31.3 classification that determines the level of design, examination, and testing rigor applied to a piping system.",
    codeContext: "ASME B31.3 §300.2 defines Normal Fluid Service (default), Category D (low-risk), Category M (lethal), and High Pressure (Chapter IX).",
    whyMatters: "Category drives ALL downstream requirements: materials, joints, examination extent, test type, and documentation level.",
    impact: "Category M → 100% RT, no socket welds, hydrostatic test mandatory. Category D → reduced examination. High Pressure → Chapter IX special design.",
    typicalRange: "Most process piping = Normal Fluid Service. Utility water/air under 150 psig = Category D. Lethal chemicals = Category M.",
    commonMistakes: "Defaulting to Normal when Category M should apply. Applying Category D to flammable services (not permitted).",
    whenConservative: "When unsure between Normal and Category M, classify as Category M. The owner/operator makes the final determination.",
  },
  specialService: {
    label: "Special Service / Line Function",
    definition: "The piping line function or special service modifier, such as process, drain, vent, sample point, chemical injection, instrument connection, relief/flare, flushing, or bypass.",
    codeContext: "This is not a replacement for ASME B31.3 fluid service classification. It is a design-basis modifier used to drive PMS notes, small-bore connection details, valve/plug requirements, and commissioning/operability review.",
    whyMatters: "Drain and vent points are common leak and operability risks. Capturing the line function prevents missing small-bore valves, plugs, caps, high-point vents, low-point drains, and special safety notes in the piping material specification.",
    impact: "Drain/vent selections add PMS notes for valve plus plug/cap, orientation, hazardous-fluid handling, and hydrotest/commissioning review. Injection, sample, relief, and instrument functions add their own specialist review prompts.",
    typicalRange: "Process, Drain, Vent, Sample Point, Utility Connection, Chemical Injection, Instrument Connection, Relief / Flare, Temporary Flushing, Bypass.",
    commonMistakes: "Using service type to mean drain or vent. Service type should describe the process/utility fluid, while this field describes what the line or connection does.",
    whenConservative: "If a small-bore connection can release hazardous process fluid, choose Drain or Vent rather than Process so the PMS carries isolation and plugging/capping notes.",
  },
  categoryM: {
    label: "Category M Fluid Service",
    definition: "A fluid service where exposure to even small quantities of the fluid is judged to produce serious irreversible harm to persons on breathing or bodily contact, even with prompt restorative measures.",
    codeContext: "ASME B31.3 §300.2 and Chapter VIII. The owner designates Category M based on toxicity assessment per process safety review.",
    whyMatters: "Triggers the most stringent requirements in B31.3: enhanced examination, mandatory hydrostatic test, restricted joint types, and special materials.",
    impact: "100% radiography on girth welds. Socket welds require MT/PT. Pneumatic test NOT permitted. Materials per §323.5. Leak testing required per §M345.8.",
    typicalRange: "Examples: HF (hydrofluoric acid), phosgene, chlorine, anhydrous ammonia, hydrogen cyanide, concentrated H₂S.",
    commonMistakes: "Assuming Category M only applies to 'toxic' fluids. The definition is broader — it includes any fluid causing serious irreversible harm. Must be confirmed by process safety, not assumed by piping engineer.",
    whenConservative: "Always classify as Category M when there is any doubt about lethality. The cost of enhanced examination is minor compared to the risk of a lethal leak.",
  },
  highPressure: {
    label: "High Pressure Piping",
    definition: "Piping systems where the design pressure exceeds the ratings available in ASME B16.5 Class 2500, typically above ~6250 psig (431 barg).",
    codeContext: "ASME B31.3 Chapter IX (K-designation). Separate design equations, examination, and testing requirements apply.",
    whyMatters: "Standard component ratings don't apply. Special design equations in §K304 must be used. 100% volumetric examination required.",
    impact: "All components must be designed per Chapter IX rules. Flanges may require special engineering per §K304.5. Welding procedures need enhanced qualification.",
    typicalRange: "Typically seen in: wellhead piping, high-pressure injection, supercritical applications, hydraulic systems. Generally >2500 psig.",
    commonMistakes: "Using B16.5 ratings beyond their scope. Failing to recognize when design pressure exceeds standard component ratings.",
    whenConservative: "If pressure is near the B16.5 Class 2500 limit, evaluate Chapter IX applicability early. Don't wait until detailed design.",
  },
  cyclicService: {
    label: "Cyclic Service",
    definition: "Service where the piping system experiences significant pressure or temperature fluctuations during operation.",
    codeContext: "ASME B31.3 §300.2 — if displacement stress range SE exceeds 0.8 × Sa or the system sees >7000 equivalent full-range thermal cycles, severe cyclic conditions apply.",
    whyMatters: "Cyclic loading causes fatigue. If severe cyclic conditions exist, additional fatigue analysis and enhanced examination are required.",
    impact: "Severe cyclic → fatigue analysis per §302.3.5(d), socket welds prohibited (§328.2.2), enhanced NDE per §341.5.4.",
    typicalRange: "Batch processes, steam-out operations, daily startup/shutdown, temperature cycling services.",
    commonMistakes: "Ignoring cyclic service for intermittent operations. Not counting thermal cycles over the design life (typically 20-30 years).",
    whenConservative: "If startup/shutdown cycles exceed ~200/year over 30-year life = 6000 cycles. Add partial cycles and evaluate against 7000 threshold.",
  },
  severeCyclic: {
    label: "Severe Cyclic Conditions",
    definition: "A B31.3 designation for piping where fatigue is a governing failure mode, requiring formal fatigue analysis and enhanced construction/examination.",
    codeContext: "ASME B31.3 §300.2 — triggered when SE > 0.8 × Sa or equivalent thermal cycles exceed 7000.",
    whyMatters: "Socket welds are prohibited, enhanced NDE is required, and formal fatigue curves (from ASME VIII Div 2) may need to be used.",
    impact: "No socket welds. Full penetration welds required. 100% volumetric NDE on all butt welds. Fatigue curves must show adequate life.",
    typicalRange: "Power piping with daily cycling, chemical batch reactors, steam tracing with frequent on/off, offshore risers with wave loading.",
    commonMistakes: "Assuming fatigue is not relevant for 'normal' piping. Many process lines see enough cycles over 20-30 years to trigger this.",
    whenConservative: "When cycle count is marginal, designate as severe cyclic. The cost increase (better welds, more NDE) is small vs. fatigue failure risk.",
  },
  corrosionSeverity: {
    label: "Corrosion Severity",
    definition: "Engineering assessment of the expected corrosion/erosion rate of the process fluid on the selected pipe material over the design life.",
    codeContext: "ASME B31.3 §302.4 — requires that the designer include allowance for corrosion, erosion, and any other expected material loss.",
    whyMatters: "Directly determines the corrosion allowance added to calculated wall thickness, and may drive material selection toward CRA.",
    impact: "Low → 1.0 mm CA typical. Moderate → 1.5-3.0 mm. Severe → 3.0+ mm or consider CRA (corrosion-resistant alloy).",
    typicalRange: "Low: clean hydrocarbons, air, nitrogen. Moderate: produced water, mild acids. Severe: sour service, strong acids, high-velocity multiphase.",
    commonMistakes: "Using 'Low' without a corrosion study. Ignoring erosion in high-velocity or multiphase services. Not considering internal lining as alternative.",
    whenConservative: "When corrosion data is limited, use 'Moderate' minimum. For new/uncharacterized fluids, request a corrosion coupon study.",
  },

  // === Design Conditions ===
  designPressure: {
    label: "Design Pressure",
    definition: "The most severe sustained pressure condition expected during service, including startup, shutdown, and upset scenarios, used as the basis for pressure design.",
    codeContext: "ASME B31.3 §301.2 — design pressure shall not be less than the pressure at the most severe condition of coincident internal/external pressure and temperature.",
    whyMatters: "Primary input to wall thickness calculation (Eq. 3a), test pressure determination, and flange class selection.",
    impact: "Higher design pressure → thicker walls, heavier schedules, higher flange class, higher test pressure.",
    typicalRange: "Utility: 5-15 barg. Process: 10-100 barg. HP: 100-700 barg. Subsea/wellhead: 350-1000+ barg.",
    commonMistakes: "Using operating pressure instead of design pressure. Not including pressure relief valve set pressure. Not considering static head in tall columns.",
    whenConservative: "Design pressure should be ≥ relief valve set pressure. Include static head for vertical runs. Consider startup/blowdown transients.",
  },
  designTemperature: {
    label: "Design Temperature",
    definition: "The maximum (or minimum) metal temperature expected during the most severe sustained operating condition, including startup, shutdown, and environmental effects.",
    codeContext: "ASME B31.3 §301.3 — design temperature is used to determine allowable stress (S) from ASME Section II Part D tables.",
    whyMatters: "Determines allowable stress (which drops with temperature), material suitability, and component rating. Both high and low limits must be checked.",
    impact: "Higher temp → lower allowable stress → thicker pipe. Below -29°C → impact testing required. Above 427°C → carbon steel unsuitable.",
    typicalRange: "Ambient: 20-40°C. Process: -29 to 400°C. Steam: 150-540°C. Cryogenic: down to -196°C. Fired heater outlets: 300-550°C.",
    commonMistakes: "Not considering the MINIMUM design temperature (e.g., autorefrigeration, winterization). Using fluid temperature instead of metal temperature.",
    whenConservative: "Add margin to maximum expected temperature. Consider solar radiation on uninsulated lines. Consider minimum ambient for uninsulated lines.",
  },
  testPressure: {
    label: "Test Pressure",
    definition: "The pressure applied during hydrostatic or pneumatic testing to verify the integrity of the piping system after construction.",
    codeContext: "ASME B31.3 §345.4.2(a) — hydrostatic test pressure shall be not less than 1.5 times the design pressure, adjusted for temperature if needed.",
    whyMatters: "Proves pressure integrity before commissioning. Must be high enough to be meaningful but not so high as to overstress components at test temperature.",
    impact: "Test pressure = 1.5 × P minimum. Must check that all components (flanges, valves, instruments) can withstand the test pressure at ambient temperature.",
    typicalRange: "Typically 1.5 × design pressure for hydrostatic. 1.1 × design pressure for pneumatic (with safety precautions).",
    commonMistakes: "Not checking flange rating at test temperature (ambient, not design temp). Exceeding 90% of SMYS. Testing instruments and expansion joints that can't take it.",
    whenConservative: "Use 1.5 × P minimum. Some companies require 1.5 × P × (S_ambient/S_design) for high-temp service (stress ratio adjustment).",
  },

  // === Allowances & Factors ===
  corrosionAllowance: {
    label: "Corrosion Allowance (CA)",
    definition: "Additional wall thickness added to the calculated pressure design thickness to account for material loss due to corrosion, erosion, or mechanical abrasion over the design life.",
    codeContext: "ASME B31.3 §302.4 — requires consideration of corrosion/erosion allowance in the design. The amount is the designer's responsibility based on service conditions.",
    whyMatters: "Without adequate CA, pipe wall can thin below minimum required thickness during service, leading to potential failure before end of design life.",
    impact: "CA directly adds to required thickness: t_required = t_pressure + CA. A 3mm CA on a 6mm design thickness means 50% more material.",
    typicalRange: "Non-corrosive (clean HC, air): 1.0-1.5 mm. Moderate (produced water, mild chemical): 1.5-3.0 mm. Severe (acid, sour): 3.0-6.0 mm or use CRA.",
    commonMistakes: "Using zero CA. Using generic values without corrosion study input. Not considering erosion in high-velocity or multiphase flows. Not distinguishing between internal and external corrosion.",
    whenConservative: "When corrosion rate data is unavailable, use minimum 1.5 mm. For sour service, consult NACE guidelines. For unknown fluids, use 3.0 mm minimum.",
  },
  millTolerance: {
    label: "Mill Tolerance",
    definition: "The allowable negative deviation in wall thickness from the nominal value during pipe manufacturing. Standard is -12.5% per ASTM A530.",
    codeContext: "ASME B31.3 §304.1.1 — minimum required thickness must account for manufacturing tolerance. ASTM A530 §10 specifies -12.5% for most seamless and welded pipe.",
    whyMatters: "A pipe ordered as Schedule 40 (7.11 mm nominal) could actually be as thin as 6.22 mm (7.11 × 0.875) and still meet manufacturing specs.",
    impact: "t_min = t_corroded / (1 - tolerance/100). With 12.5% tolerance: t_min = t_corroded / 0.875 = t_corroded × 1.143 — a 14.3% increase.",
    typicalRange: "Standard: -12.5% (ASTM A530). Some API specifications: -10%. Precision tubes: -10% to -5%. Always verify with the pipe specification.",
    commonMistakes: "Forgetting to apply mill tolerance entirely. Applying it as an additive instead of divisive factor. Using wrong tolerance for the pipe specification.",
    whenConservative: "Always use -12.5% unless the specific pipe procurement specification guarantees a tighter tolerance and QC verification is in place.",
  },
  jointQualityFactor: {
    label: "Joint Quality Factor (Ej)",
    definition: "A de-rating factor applied to the allowable stress based on the type of longitudinal seam weld in the pipe and the degree of radiographic examination performed.",
    codeContext: "ASME B31.3 Table A-1B and §302.3.4 — Ej values range from 0.60 (furnace butt weld, no RT) to 1.0 (seamless or 100% RT welded).",
    whyMatters: "Ej directly multiplies the allowable stress: effective S = S × Ej. A lower Ej means you need thicker pipe for the same pressure.",
    impact: "Seamless: Ej = 1.0 (no penalty). ERW: Ej = 0.85 (unless 100% RT → 1.0). Furnace butt weld: Ej = 0.60. This can significantly affect wall thickness.",
    typicalRange: "Seamless pipe: 1.0. ERW with spot RT: 0.85. ERW with 100% RT: 1.0. EFW (electric fusion welded): 0.85-1.0 depending on RT.",
    commonMistakes: "Assuming Ej = 1.0 for all welded pipe. Confusing longitudinal joint factor with girth weld quality factor. Not checking Table A-1B for the specific pipe specification.",
    whenConservative: "If unsure about RT coverage on welded pipe, use Ej = 0.85. For critical service, specify seamless pipe (Ej = 1.0 inherently).",
  },
  weldType: {
    label: "Weld Type / Pipe Manufacturing",
    definition: "The method used to manufacture the pipe, which determines the longitudinal seam quality and the applicable joint quality factor (Ej).",
    codeContext: "ASME B31.3 Table A-1B lists Ej values by pipe specification and manufacturing method.",
    whyMatters: "Manufacturing method determines: available sizes, Ej factor, minimum wall reliability, and suitability for certain services.",
    impact: "Seamless → best for severe service, Ej=1.0. ERW → cost-effective for large sizes, Ej=0.85-1.0. Socket weld → small bore connections only.",
    typicalRange: "Seamless: most process piping ≤24\". ERW: common for large bore and utilities. SAW (submerged arc): large bore >24\".",
    commonMistakes: "Specifying seamless when ERW is adequate (cost impact). Using socket welds in severe cyclic service (prohibited per §328.2.2).",
    whenConservative: "For critical process service, sour service, or cyclic service, specify seamless pipe.",
  },

  // === Materials ===
  pipeMaterial: {
    label: "Pipe Material",
    definition: "The ASTM specification and grade of the pipe body material, which determines mechanical properties, allowable stress, temperature limits, and corrosion resistance.",
    codeContext: "ASME B31.3 Table A-1 lists allowable stresses for each material at various temperatures. Materials must be listed in B31.3 to be used without owner approval.",
    whyMatters: "The foundation of the entire design. Every other component selection, wall thickness calculation, and inspection requirement flows from the pipe material.",
    impact: "Drives: allowable stress (S), temperature limits, corrosion resistance, component compatibility (flanges, fittings, bolts), weldability, and cost.",
    typicalRange: "Carbon steel (A106 Gr.B): most common for -29 to 427°C. Stainless (A312 TP316L): corrosive/cryo. Chrome-Moly (A335 P11): high temp. A333 Gr.6: low temp carbon steel.",
    commonMistakes: "Selecting based on availability alone without checking temperature/corrosion suitability. Not checking NACE compliance for sour service. Mixing material groups in a system without galvanic assessment.",
    whenConservative: "When fluid corrosivity is uncertain, select the more corrosion-resistant option. When temperature is near the limit of a material, select the next material grade up.",
  },
  flangeMaterial: {
    label: "Flange Material",
    definition: "The ASTM specification for the forging material of flanges, which must be compatible with the pipe material and suitable for design conditions.",
    codeContext: "ASME B16.5 Table 2 lists acceptable flange materials. B31.3 §323.1 requires material compatibility across the joint.",
    whyMatters: "Flange material must match or be compatible with pipe material for weldability, thermal expansion, and corrosion resistance.",
    impact: "Wrong flange material → galvanic corrosion, weld cracking, or P-T rating mismatch. Must match material group of pipe.",
    typicalRange: "A105 (carbon steel, most common), A182 F11 (chrome-moly), A182 F316L (stainless), A182 F304L (stainless, cryo).",
    commonMistakes: "Using A105 flanges on stainless pipe. Not checking P-T rating at design temperature (ratings decrease with temperature).",
    whenConservative: "Match flange material group to pipe material. Check B16.5 P-T rating at BOTH design temperature and test temperature.",
  },
  boltMaterial: {
    label: "Bolt Material",
    definition: "The ASTM specification for stud bolts and nuts used in flanged connections. Must be compatible with service conditions including temperature and corrosion.",
    codeContext: "ASME B16.5 Table 6 lists acceptable bolting materials by flange material group. B31.3 §323.1 and NACE MR0175 for sour service.",
    whyMatters: "Bolts provide the sealing force for flanged joints. Wrong material can lead to bolt relaxation, stress corrosion cracking, or brittle fracture.",
    impact: "B7 standard for most service. B7M for sour (HRC ≤ 22). B8/B8M for stainless systems. L7 for low-temperature. B16 for high-temperature.",
    typicalRange: "A193 B7 / A194 2H: standard CS service. A193 B7M / A194 2HM: sour service. A193 B8 Cl.1 / A194 8: stainless systems.",
    commonMistakes: "Using B7 in sour (H₂S) service — exceeds NACE hardness limit. Using carbon steel nuts on stainless bolts. Not checking bolt temperature rating.",
    whenConservative: "For sour service, always specify B7M. For temperatures below -29°C, specify L7 or B8. Over-torquing is as dangerous as under-torquing.",
  },
  gasketType: {
    label: "Gasket Type / Material",
    definition: "The sealing element between flange faces. Type and material must be compatible with fluid, pressure, temperature, and flange facing.",
    codeContext: "ASME B16.20 (metallic gaskets), B16.21 (non-metallic). B31.3 §323.4 requires gasket suitability for service conditions.",
    whyMatters: "The gasket is the weakest link in a flanged joint. Wrong gasket → leaks, blowouts, or gasket degradation in service.",
    impact: "Spiral wound: standard for most process. Ring-type joint (RTJ): high-pressure or critical. Soft sheet: low-pressure utility only. PTFE: chemical resistance.",
    typicalRange: "Spiral wound (CS outer, flex graphite filler): 80% of process piping. RTJ: Class 900+ or critical service. Soft sheet: utility water/air <150 psig.",
    commonMistakes: "Using PTFE-filled spiral wound above 260°C (PTFE degrades). Using soft gaskets in hydrocarbon or high-pressure service. Forgetting to match gasket class to flange class.",
    whenConservative: "For hydrocarbon or chemical service, always use spiral wound minimum. For Class 900+, consider RTJ. For Category M, consider double-containment or live-loaded packing.",
  },

  // === Pipe Size & Config ===
  nominalPipeSize: {
    label: "Nominal Pipe Size (NPS)",
    definition: "A dimensionless designator indicating pipe size. NPS does NOT directly equal the outside diameter (except for NPS 14\" and above).",
    codeContext: "ASME B36.10M/B36.19M define actual OD for each NPS. B31.3 uses NPS with schedule to determine wall thickness for pressure design.",
    whyMatters: "NPS determines the outside diameter, which is the 'D' in the pressure design equation t = PD/2(SE+PY).",
    impact: "NPS determines OD (fixed), and schedule determines wall thickness. Together they define the actual pipe geometry for all calculations.",
    typicalRange: "Small bore: ½\" to 2\". Standard process: 2\" to 12\". Large bore: 14\" to 48\". Above 48\" typically plate-rolled.",
    commonMistakes: "Confusing NPS with actual pipe OD (e.g., NPS 4\" has OD = 4.500\", not 4.000\"). Not checking OD consistency between pipe and fittings/flanges.",
    whenConservative: "When line sizing is marginal between two NPS values, select the larger size for pressure drop margin and future capacity.",
  },

  // === Other ===
  testMedium: {
    label: "Test Medium",
    definition: "The fluid used for pressure testing of the piping system. Typically water (hydrostatic) or air/nitrogen (pneumatic).",
    codeContext: "ASME B31.3 §345.4 — hydrostatic test with water is the standard method. Pneumatic test per §345.5 only when hydrostatic is impractical.",
    whyMatters: "Water is safer because it stores very little energy when compressed. Gas stores enormous energy — pneumatic test failure is an explosion risk.",
    impact: "Hydrostatic: 1.5 × P. Pneumatic: 1.1 × P with mandatory safety precautions. Category M: hydrostatic only (pneumatic not permitted).",
    typicalRange: "Water: default for most piping. Air/Nitrogen: when water contamination is unacceptable (e.g., instrument air, oxygen systems, catalyst systems).",
    commonMistakes: "Performing pneumatic test without proper safety barriers. Not draining all water after hydro test in systems that will see low temperatures (freeze risk).",
    whenConservative: "Always use hydrostatic test unless specifically justified. Pneumatic test requires documented risk assessment and safety barriers.",
  },
  unitSystem: {
    label: "Unit System",
    definition: "Selection between SI (metric) and Imperial (US customary) units for all inputs and outputs.",
    codeContext: "ASME B31.3 publishes in US customary (psi, °F, inches). SI editions are available. Calculations are unit-independent if consistent.",
    whyMatters: "Consistency is critical. Mixing units is one of the most common sources of engineering errors.",
    impact: "All inputs, calculations, and outputs must use consistent units. The app handles conversion automatically.",
    typicalRange: "International projects: SI (barg, °C, mm). US domestic: Imperial (psig, °F, inches). Middle East: mixed (SI pressure, Imperial pipe sizes).",
    commonMistakes: "Mixing units mid-calculation. Confusing barg (gauge) with bara (absolute). Using different units for input and output.",
    whenConservative: "Always verify unit consistency. When converting, carry extra decimal places to avoid rounding errors.",
  },
};

/**
 * Get a field definition by key, with fallback for unknown fields
 */
export function getFieldDefinition(key: string): FieldDefinition | null {
  return FIELD_DEFINITIONS[key] || null;
}
