/**
 * Calculation Teaching Database
 * Teaching content for every calculation, formula, and engineering function in the app.
 * Each entry explains the formula, its derivation, assumptions, and what drives the result.
 */

export interface CalculationLesson {
  id: string;
  title: string;
  module: string;
  formula: string;
  formulaLaTeX: string;     // LaTeX-style for display
  derivation: string;       // How the formula was derived
  variables: { symbol: string; name: string; source: string; lesson: string }[];
  assumptions: string[];
  limitations: string[];
  codeReference: string;
  practicalLesson: string;
  whatDrivesResult: string;  // Which variable has the most impact
  sensitivityNotes: string;  // How sensitive is the result to each variable
  commonErrors: string[];
  exampleCalc: string;
}

export const CALCULATION_LESSONS: Record<string, CalculationLesson> = {
  "wall-thickness": {
    id: "wall-thickness",
    title: "Pressure Design Thickness — Straight Pipe",
    module: "Wall Thickness",
    formula: "t = PD / 2(SE + PY)",
    formulaLaTeX: "t = \\frac{PD}{2(SE + PY)}",
    derivation: "This equation is derived from the hoop stress formula for a thin-walled cylinder: σ_hoop = PD / 2t. Rearranging for t and replacing σ with the allowable stress S (de-rated by joint factor E): t = PD / 2SE. The +PY term is a Lame's equation correction that accounts for the pressure acting on the inside of the pipe wall cross-section. For thin walls, PY is small relative to SE. Y is a temperature-dependent coefficient.",
    variables: [
      { symbol: "P", name: "Design Pressure", source: "B31.3 §301.2", lesson: "Must be the MOST SEVERE coincident pressure — not operating pressure. Include: relief valve set pressure, static head, startup transients." },
      { symbol: "D", name: "Outside Diameter", source: "ASME B36.10M/B36.19M", lesson: "OD is FIXED for a given NPS — it doesn't change with schedule. NPS 4\" = 4.500\" OD always. This is by convention for fitting/flange interchangeability." },
      { symbol: "S", name: "Allowable Stress at Design Temperature", source: "ASME Section II-D Table 1A", lesson: "S already includes a safety factor (~3.5× on UTS). It DECREASES with temperature. The material you choose and the temperature you design for together determine S — this is why material selection matters." },
      { symbol: "E", name: "Longitudinal Joint Quality Factor", source: "B31.3 Table A-1B", lesson: "E is a 'confidence factor' for the longitudinal seam. Seamless E=1.0, ERW E=0.85. Lower E means you're using less of the material's allowable stress — thicker pipe results." },
      { symbol: "Y", name: "Temperature Coefficient", source: "B31.3 Table 304.1.1", lesson: "Y = 0.4 for ferritic steels below 482°C. It increases above this temperature. Y accounts for the redistribution of stress across the wall due to creep at elevated temperatures." },
    ],
    assumptions: [
      "Thin wall: t < D/6 (if not, use Lame's equation or B31.3 Eq. 3b)",
      "Uniform internal pressure (no bending, no external pressure)",
      "Material is ductile at design temperature",
      "No localized thinning (uniform corrosion model)",
      "No dynamic/impact loading",
    ],
    limitations: [
      "Does NOT account for external pressure (vacuum) — use Eq. 4",
      "Does NOT include thermal stress or bending loads",
      "Does NOT address fatigue (separate analysis required for cyclic service)",
      "Not valid for thick-wall pipe (t ≥ D/6) — use Chapter IX equations",
    ],
    codeReference: "ASME B31.3 §304.1.2, Equation (3a)",
    practicalLesson: "This equation gives you the PRESSURE DESIGN THICKNESS only — the minimum wall needed for internal pressure alone. The final required thickness adds: (1) corrosion allowance c, (2) manufacturing tolerance. So: t_required = (t_pressure + c) / (1 - MT/100). Then you select the next heavier standard schedule from B36.10M.",
    whatDrivesResult: "In most cases, allowable stress (S) has the greatest impact. Doubling S halves the required thickness. This is why material selection (which determines S at temperature) is so critical. After S, design pressure (P) is the next most influential — it appears linearly in the numerator.",
    sensitivityNotes: "Sensitivity: ∂t/∂P = D/2(SE+PY) ≈ D/2SE for thin walls. ∂t/∂D = P/2(SE+PY). ∂t/∂S = -PD/2(SE+PY)² × E. A 10% increase in P → ~10% increase in t. A 10% increase in S → ~10% decrease in t. A 10% increase in D → ~10% increase in t. The sensitivity to E is the same magnitude as S.",
    commonErrors: [
      "Using operating pressure instead of design pressure",
      "Using the wrong allowable stress (wrong temperature or wrong material)",
      "Forgetting to add corrosion allowance AFTER pressure design",
      "Forgetting mill tolerance (dividing by 0.875)",
      "Using inside diameter instead of outside diameter",
      "Not checking that t < D/6 (thin-wall assumption validity)",
    ],
    exampleCalc: "Example: NPS 6\" (D=168.3mm), P=40 barg (4.0 MPa), A106 Gr.B at 300°C (S=118 MPa), Seamless (E=1.0), Y=0.4. t = 4.0 × 168.3 / 2(118 × 1.0 + 4.0 × 0.4) = 673.2 / 2(118+1.6) = 673.2 / 239.2 = 2.814 mm. Add CA=1.5mm: 2.814+1.5 = 4.314 mm. With 12.5% MT: 4.314/0.875 = 4.930 mm → select Sch 40 (WT=7.11mm).",
  },

  "test-pressure": {
    id: "test-pressure",
    title: "Hydrostatic Test Pressure",
    module: "Design Inputs",
    formula: "P_test = 1.5 × P_design",
    formulaLaTeX: "P_{test} = 1.5 \\times P_{design}",
    derivation: "The 1.5 factor is a proof-test ratio that provides assurance beyond design conditions. It originates from the concept that if a system withstands 150% of its design pressure without failure or permanent deformation, there is adequate confidence in its integrity for service at design pressure.",
    variables: [
      { symbol: "P_test", name: "Hydrostatic Test Pressure", source: "B31.3 §345.4.2(a)", lesson: "This is the MINIMUM test pressure. Some companies require higher. Must verify all components can withstand this pressure at test temperature." },
      { symbol: "P_design", name: "Design Pressure", source: "B31.3 §301.2", lesson: "The design pressure that the system was designed for." },
    ],
    assumptions: [
      "Test medium is water (incompressible)",
      "Test temperature is ambient",
      "All components (flanges, valves, instruments) can withstand test pressure",
      "Stress at test pressure does not exceed 90% of SMYS",
    ],
    limitations: [
      "For high-design-temp services, may need stress ratio adjustment: P_test = 1.5 × P × (S_test/S_design)",
      "Pneumatic test factor is 1.1× (not 1.5×)",
      "Category M: pneumatic test NOT permitted",
    ],
    codeReference: "ASME B31.3 §345.4.2(a)",
    practicalLesson: "The test pressure must be checked against EVERY component in the system: flanges (P-T rating at test temperature), valves (body rating), instruments (max working pressure), expansion joints (test limits). The weakest component determines the maximum test pressure — and it must be ≥ 1.5 × P_design.",
    whatDrivesResult: "Simple linear function of design pressure. The critical engineering judgment is in verifying that all components can withstand the calculated test pressure.",
    sensitivityNotes: "Linear: 10% increase in P → 10% increase in P_test. No sensitivity to other variables.",
    commonErrors: [
      "Testing instruments that can't handle 1.5× pressure (isolate or remove them)",
      "Not checking flange rating at test temperature",
      "Filling system with water without venting air (entrapped air can cause dangerous energy storage)",
      "Not considering elevation head in tall vertical systems",
    ],
    exampleCalc: "P_design = 40 barg → P_test = 1.5 × 40 = 60 barg minimum. Check: Class 300 A105 flange at 20°C = 51.1 bar → FAILS! Need Class 600 or higher for test pressure.",
  },

  "support-span": {
    id: "support-span",
    title: "Pipe Support Span Calculation",
    module: "Support Span",
    formula: "L = √(8 × S_allow × Z / (w × g))",
    formulaLaTeX: "L = \\sqrt{\\frac{8 \\times S_{allow} \\times Z}{w \\times g}}",
    derivation: "Based on simple beam theory for a uniformly distributed load on a simply supported beam. The maximum bending stress σ = wL²/8Z, where w is the distributed load per unit length and Z is the section modulus. Setting σ = S_allow and solving for L gives the maximum span. Deflection check (typically ≤ 12.5mm) may govern for large-bore pipe.",
    variables: [
      { symbol: "L", name: "Maximum Support Span", source: "MSS SP-69 Table 3", lesson: "This is the MAXIMUM distance between supports. Actual spacing should be less to provide a safety margin and account for concentrated loads (valves, fittings)." },
      { symbol: "S_allow", name: "Allowable Bending Stress", source: "MSS SP-69, ASME B31.1", lesson: "Typically limited to ~15-20% of SMYS for support span calculations. This is much lower than pressure design stress because supports see sustained loading plus thermal cycling." },
      { symbol: "Z", name: "Section Modulus of Pipe", source: "Calculated from D and t", lesson: "Z = π(D⁴ - d⁴) / 32D. Larger pipe has proportionally larger Z, which is why larger pipe can span further despite being heavier." },
      { symbol: "w", name: "Total Distributed Load", source: "Calculated", lesson: "Sum of: pipe weight + fluid weight + insulation weight. The heaviest case (usually hydrotest with water) often governs." },
    ],
    assumptions: [
      "Simply supported beam (conservative for continuous pipe over multiple supports)",
      "Uniform distributed load (no concentrated masses like valves)",
      "Horizontal pipe only (vertical pipe uses different criteria)",
      "No wind or seismic loading considered",
    ],
    limitations: [
      "Does not account for concentrated loads (heavy valves, in-line equipment)",
      "Does not include thermal expansion effects on support loads",
      "Assumes rigid supports (spring supports require separate analysis)",
      "Not applicable for vertical pipe runs",
    ],
    codeReference: "MSS SP-69 Table 3, ASME B31.1 Table 121.5",
    practicalLesson: "Three load cases must be checked: (1) Empty — construction/maintenance phase, (2) Operating — with process fluid, (3) Hydrotest — filled with water. The SHORTEST span from these three cases governs. For gas services, hydrotest often governs because water is much denser than the operating gas.",
    whatDrivesResult: "For small-bore pipe (<NPS 4\"), the distributed load (w) dominates — insulation can significantly increase w and reduce the span. For large-bore pipe (>NPS 12\"), the section modulus (Z) grows faster than the weight, allowing longer spans.",
    sensitivityNotes: "L is proportional to √(Z/w). Doubling the load only reduces span by ~30% (square root relationship). Doubling the pipe schedule (thicker wall) increases Z and increases weight — the net effect depends on which factor dominates.",
    commonErrors: [
      "Using operating fluid weight when hydrotest (water) is heavier",
      "Forgetting insulation weight (can be 30-50% of pipe weight for large-bore)",
      "Not reducing span near heavy valves or instruments",
      "Assuming the span table applies to all pipe materials (it doesn't — different E values)",
    ],
    exampleCalc: "NPS 6\" Sch 40 (OD=168.3mm, t=7.11mm) with water (ρ=1000) and 50mm insulation (ρ=150): Pipe wt=28.3 kg/m, Water wt=18.6 kg/m, Insulation=7.2 kg/m, Total=54.1 kg/m. Using S_allow=20 MPa, Z=1.39×10⁵ mm³: L ≈ 5.7m (19ft). SP-69 Table suggests 5.2m for NPS 6\" — close but slightly conservative due to different assumptions.",
  },

  "flange-class": {
    id: "flange-class",
    title: "Flange Class Selection from P-T Ratings",
    module: "Flanges & Fittings",
    formula: "Select lowest class where P_rated(T_design) ≥ P_design",
    formulaLaTeX: "P_{rated}(T_{design}) \\geq P_{design}",
    derivation: "ASME B16.5 Table 2 provides maximum allowable working pressures for each flange class at various temperatures. The designer selects the lowest (most economical) class that still provides a pressure rating equal to or exceeding the design pressure at the design temperature.",
    variables: [
      { symbol: "P_rated", name: "Flange P-T Rating", source: "ASME B16.5 Table 2", lesson: "The rating is NOT the class number — it varies with temperature and material group. Class 150 at room temperature = 285 psi for Group 1.1 (CS)." },
      { symbol: "T_design", name: "Design Temperature", source: "B31.3 §301.3", lesson: "Use the design temperature to look up the P-T rating. Higher temperature = lower rating." },
      { symbol: "P_design", name: "Design Pressure", source: "B31.3 §301.2", lesson: "The design pressure the flange must contain." },
    ],
    assumptions: [
      "Standard flange per ASME B16.5",
      "Correct material group selected",
      "No external bending or axial loads on the flange",
      "Standard flange facing (RF, RTJ) per B16.5",
    ],
    limitations: [
      "B16.5 covers NPS 1/2\" to 24\" only",
      "Maximum class is 2500 — above this, use B16.47 or special design",
      "P-T ratings assume no external loads",
      "Must also check flange rating at test temperature and test pressure",
    ],
    codeReference: "ASME B16.5 Table 2-1.1 (CS), 2-2.2 (316SS), 2-2.3 (316L)",
    practicalLesson: "The most common mistake in flange selection is using the class number as the pressure rating. Class 150 ≠ 150 psi. At ambient temperature, a CS Class 150 flange is actually rated at 285 psi (19.6 bar). At 300°C, it's only rated at ~12.1 bar. Always look up the ACTUAL P-T rating at your specific design temperature.",
    whatDrivesResult: "Temperature has the dominant effect. The P-T rating drops significantly with temperature — a Class 300 CS flange rated at 51.1 bar at ambient drops to ~27.6 bar at 350°C. This is why high-temperature services often need higher flange classes than you'd expect from the pressure alone.",
    sensitivityNotes: "The relationship is tabular (not a smooth function). Between tabulated temperatures, linear interpolation is used. There are 'cliff edges' where a small temperature increase pushes you to the next flange class — these are critical design checkpoints.",
    commonErrors: [
      "Assuming Class 150 = 150 psi (it's 285 psi at ambient for CS)",
      "Not checking the P-T rating at test temperature AND design temperature",
      "Using the wrong material group for the P-T lookup",
      "Not considering that SS flanges have LOWER cold ratings than CS flanges",
    ],
    exampleCalc: "P_design = 30 bar, T_design = 250°C, Material = CS (Group 1.1). B16.5 Table 2-1.1: Class 150 at 250°C = 14.6 bar → FAILS. Class 300 at 250°C = 38.7 bar → PASSES. Select Class 300.",
  },

  "corrosion-allowance": {
    id: "corrosion-allowance",
    title: "Corrosion Allowance Determination",
    module: "Design Inputs",
    formula: "CA = corrosion_rate × design_life",
    formulaLaTeX: "CA = r_{corr} \\times t_{life}",
    derivation: "Corrosion allowance is conceptually simple: it's the expected material loss over the design life. If the corrosion rate is 0.1 mm/year and the design life is 20 years, CA = 2.0 mm. In practice, corrosion rates are estimated from: (a) laboratory testing, (b) field experience with similar services, (c) corrosion coupons, (d) literature data.",
    variables: [
      { symbol: "CA", name: "Corrosion Allowance", source: "B31.3 §302.4", lesson: "Added to the pressure design thickness to account for material loss during service life." },
      { symbol: "r_corr", name: "Corrosion Rate", source: "Corrosion study / experience", lesson: "B31.3 does NOT provide corrosion rates — this is the designer's responsibility based on fluid, material, and operating conditions." },
      { symbol: "t_life", name: "Design Life", source: "Project specification", lesson: "Typical: 20-30 years. Some companies use 10 years with planned replacements." },
    ],
    assumptions: [
      "Uniform corrosion model (no localized pitting)",
      "Corrosion rate is constant over service life",
      "Internal and external corrosion considered separately",
      "Material is suitable for the environment (not a material failure mode)",
    ],
    limitations: [
      "Does not address pitting (localized) corrosion",
      "Does not account for erosion-corrosion synergy",
      "Does not consider stress corrosion cracking (SCC)",
      "If CA > 6mm, CRA material is usually more cost-effective",
    ],
    codeReference: "ASME B31.3 §302.4",
    practicalLesson: "In the real world, corrosion allowance is often specified by company standards rather than calculated from corrosion rates. Common industry values: Clean HC: 1.0-1.5mm, Process water: 1.5-3.0mm, Sour service: 3.0mm minimum, Utility air/N₂: 0.5-1.0mm. These values represent decades of field experience distilled into engineering standards.",
    whatDrivesResult: "Corrosion severity (Low/Moderate/Severe) is the primary driver. Service type determines the severity. For example, 'Corrosive / Sour Service' automatically sets CA to 3.0mm because industry experience shows this is the minimum for H₂S environments.",
    sensitivityNotes: "CA has a linear, additive effect on required thickness. For thin-wall applications (NPS ≥ 6\" in low-pressure service), CA can be the dominant contributor to required thickness — sometimes more than the pressure design thickness itself.",
    commonErrors: [
      "Using zero CA 'because the fluid is non-corrosive' (external corrosion still exists)",
      "Using the same CA for carbon steel and stainless steel (SS usually needs much less)",
      "Not considering erosion in high-velocity services",
      "Not revisiting CA after material change (CA for SS is different from CA for CS)",
    ],
    exampleCalc: "Moderate corrosion, 20-year life, estimated rate 0.1 mm/yr → CA = 0.1 × 20 = 2.0 mm. But company standard says minimum 1.5 mm for this service → use 2.0 mm (calculated > minimum).",
  },
};

/**
 * Get a calculation lesson by ID
 */
export function getCalculationLesson(id: string): CalculationLesson | null {
  return CALCULATION_LESSONS[id] || null;
}

/**
 * Get all calculation lessons for a specific module
 */
export function getCalculationLessonsByModule(module: string): CalculationLesson[] {
  return Object.values(CALCULATION_LESSONS).filter(l => 
    l.module.toLowerCase().includes(module.toLowerCase())
  );
}
