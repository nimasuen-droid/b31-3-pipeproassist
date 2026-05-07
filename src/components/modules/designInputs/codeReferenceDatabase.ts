/**
 * ASME Code Reference Database
 * Comprehensive clause-level references with teaching content for every code section
 * referenced by the application's engines and calculations.
 */

export interface CodeReference {
  id: string;
  standard: string;
  section: string;
  title: string;
  summary: string;
  fullText: string;        // Paraphrased content (not copyrighted verbatim)
  application: string;     // How the app uses this clause
  lesson: string;          // Teaching content — what engineers should learn
  keyPoints: string[];     // Bullet points of critical takeaways
  relatedSections: string[]; // Cross-references
  category: "design" | "material" | "examination" | "testing" | "fabrication" | "general";
}

export const CODE_REFERENCES: Record<string, CodeReference> = {
  // ═══════════════════════════════════════════════════════════
  // ASME B31.3 — Process Piping
  // ═══════════════════════════════════════════════════════════

  "B31.3-300.2": {
    id: "B31.3-300.2",
    standard: "ASME B31.3",
    section: "§300.2",
    title: "Definitions — Fluid Service Categories",
    summary: "Defines the fluid service categories that determine the level of design, fabrication, examination, and testing rigor.",
    fullText: "B31.3 classifies piping systems into service categories based on the nature and hazard of the contained fluid: (a) Normal Fluid Service — the default, applicable to most piping. (b) Category D Fluid Service — non-flammable, non-toxic fluids at ≤150 psig and -20°F to 366°F, where reduced requirements may apply. (c) Category M Fluid Service — fluids where a single exposure to a very small quantity can produce serious irreversible harm on breathing or bodily contact, even with prompt restorative measures. (d) High Pressure Fluid Service — piping designed per Chapter IX with K-class methodology. (e) Normal/Severe Cyclic Conditions — determined by whether the displacement stress range exceeds 80% of the allowable range or the system sees >7000 equivalent full-range thermal cycles.",
    application: "The Service Classification Engine uses this section to automatically categorize piping systems based on user inputs (pressure, temperature, fluid description, and user designations).",
    lesson: "Service classification is the FIRST decision in any piping design. It cascades through the entire design — affecting materials, joints, examination, and testing. Getting this wrong means the entire design basis is wrong. The owner/operator has final authority on Category M designation, not the piping engineer.",
    keyPoints: [
      "Normal Fluid Service is the DEFAULT — you don't need to justify it",
      "Category D allows reduced examination but CANNOT be used for flammable fluids",
      "Category M is based on toxicity/lethality — the owner makes the final call",
      "High Pressure (Chapter IX) uses completely separate design equations",
      "Severe cyclic triggers fatigue analysis and prohibits socket welds",
    ],
    relatedSections: ["B31.3-301.2", "B31.3-301.3", "B31.3-323.2", "B31.3-Ch.VIII", "B31.3-Ch.IX"],
    category: "general",
  },

  "B31.3-301.2": {
    id: "B31.3-301.2",
    standard: "ASME B31.3",
    section: "§301.2",
    title: "Design Conditions — Pressure",
    summary: "Establishes requirements for determining design pressure as the basis for pressure design.",
    fullText: "The design pressure shall not be less than the pressure at the most severe condition of coincident internal or external pressure and temperature expected during service. This includes consideration of: (a) operating pressure at the most severe temperature, (b) pressure at the relief device set pressure, (c) static head of the fluid, (d) any other sustained loadings. The design pressure must envelope ALL operating scenarios including startup, shutdown, upset, and emergency conditions.",
    application: "Used as the primary input (P) in the wall thickness equation t = PD/2(SE+PY). Also drives flange class selection and test pressure calculation.",
    lesson: "Design pressure is NOT operating pressure. It must be the WORST-CASE sustained pressure the system will ever see. Common sources: relief valve set pressure, pump dead-head pressure, startup transients, static head in tall columns. Always ask: 'What is the highest pressure this pipe will ever see?'",
    keyPoints: [
      "Design pressure ≥ relief valve set pressure",
      "Must include static head for vertical/elevated piping",
      "Consider startup, shutdown, and upset conditions",
      "External pressure (vacuum) also requires design consideration",
      "Design pressure directly determines wall thickness and flange class",
    ],
    relatedSections: ["B31.3-301.3", "B31.3-304.1.2", "B31.3-345.4"],
    category: "design",
  },

  "B31.3-301.3": {
    id: "B31.3-301.3",
    standard: "ASME B31.3",
    section: "§301.3",
    title: "Design Conditions — Temperature",
    summary: "Establishes requirements for determining design temperature for material selection and allowable stress.",
    fullText: "Design temperature is the METAL temperature (not fluid temperature) at the most severe condition of coincident pressure and temperature. For uninsulated components, consider: (a) maximum fluid temperature plus environmental effects (solar radiation), (b) minimum fluid temperature or minimum ambient temperature, whichever produces the more severe condition. The designer must consider both MAXIMUM and MINIMUM design temperatures.",
    application: "Used to look up allowable stress (S) from ASME Section II-D tables. Also determines material suitability (temperature limits) and impact testing requirements.",
    lesson: "Two critical mistakes: (1) Using fluid temperature instead of metal temperature — for uninsulated pipe in winter, the metal temp can be much lower than fluid temp. (2) Forgetting the MINIMUM design temperature — autorefrigeration in gas letdown, winter ambient for outdoor piping. The minimum is often more critical than the maximum because it triggers impact testing and material restrictions.",
    keyPoints: [
      "Metal temperature, NOT fluid temperature",
      "Must check BOTH maximum AND minimum",
      "Consider solar radiation on uninsulated dark pipe (+30°C possible)",
      "Consider minimum ambient for uninsulated pipe in winter",
      "Below -29°C: carbon steel requires impact testing or material upgrade",
      "Above 427°C: carbon steel loses significant strength (creep range)",
    ],
    relatedSections: ["B31.3-301.2", "B31.3-323.2", "SecIID-Table1A"],
    category: "design",
  },

  "B31.3-302.4": {
    id: "B31.3-302.4",
    standard: "ASME B31.3",
    section: "§302.4",
    title: "Allowances — Corrosion, Erosion, and Mechanical Abrasion",
    summary: "Requires the designer to include adequate allowance for wall thinning due to corrosion, erosion, and mechanical abrasion.",
    fullText: "The designer shall take into account the effects of corrosion, erosion, and mechanical abrasion during the intended service life. The corrosion allowance (c) is added to the calculated pressure design thickness. The amount is the designer's responsibility and should be based on: the corrosivity of the fluid, the expected service life, the material's corrosion resistance, and experience with similar services. Note: B31.3 does NOT prescribe specific corrosion allowance values — this is an engineering judgment.",
    application: "The recommendation engine sets corrosion allowance based on service type and corrosion severity. This value (c) is added to the pressure design thickness in the formula: t_corroded = t_design + c.",
    lesson: "B31.3 is unique among codes in that it does NOT prescribe minimum corrosion allowances — the designer must determine this. In practice, this means you need input from a corrosion engineer or process engineer. Using zero CA is technically allowed but rarely appropriate. Common values: 1.0-1.5 mm for non-corrosive, 1.5-3.0 mm for moderate, 3.0-6.0 mm for severe. For very corrosive services, it may be more cost-effective to use a CRA (corrosion-resistant alloy) than to add excessive CA to carbon steel.",
    keyPoints: [
      "B31.3 does NOT specify minimum CA values — it's engineering judgment",
      "CA is ADDED to pressure design thickness, not multiplied",
      "Consider both internal AND external corrosion",
      "For buried pipe, external corrosion can exceed internal",
      "Erosion can be significant in high-velocity or multiphase flow",
      "When CA > 3mm on carbon steel, evaluate if CRA is more economical",
    ],
    relatedSections: ["B31.3-304.1.1", "B31.3-304.1.2"],
    category: "design",
  },

  "B31.3-304.1.1": {
    id: "B31.3-304.1.1",
    standard: "ASME B31.3",
    section: "§304.1.1",
    title: "Pressure Design — General",
    summary: "Establishes the general requirement that piping components must have a wall thickness sufficient to withstand internal pressure, plus allowances.",
    fullText: "The minimum required thickness for pressure design shall include: (a) the pressure design thickness (t) calculated per §304.1.2, (b) the corrosion/erosion allowance (c) per §302.4, (c) the manufacturing tolerance. For pipe, the manufacturing tolerance is typically -12.5% per ASTM A530. The formula becomes: t_min = (t + c) / (1 - tolerance/100). This ensures the pipe, even at its thinnest manufacturing tolerance, has adequate wall for pressure plus expected material loss.",
    application: "Used in the wall thickness calculation to convert pressure design thickness to minimum required thickness by adding CA and dividing by mill tolerance factor.",
    lesson: "The three-step thickness buildup is fundamental: Step 1: Calculate t for pressure. Step 2: Add corrosion allowance c. Step 3: Divide by (1 - MT/100) for manufacturing tolerance. Forgetting Step 3 (mill tolerance) means the pipe could be manufactured 12.5% thinner than you calculated — a 12.5% underdesign. This is one of the most common calculation errors.",
    keyPoints: [
      "t_min = (t_pressure + CA) / (1 - mill_tolerance/100)",
      "Standard mill tolerance = -12.5% per ASTM A530",
      "Some API specs allow -10% or tighter",
      "Mill tolerance is DIVISIVE, not additive",
      "After calculating t_min, select the next heavier standard schedule",
    ],
    relatedSections: ["B31.3-302.4", "B31.3-304.1.2", "ASTM-A530"],
    category: "design",
  },

  "B31.3-304.1.2": {
    id: "B31.3-304.1.2",
    standard: "ASME B31.3",
    section: "§304.1.2",
    title: "Pressure Design — Straight Pipe",
    summary: "Provides the fundamental equation for pressure design thickness of straight pipe under internal pressure.",
    fullText: "For straight pipe under internal pressure, the design thickness t shall be calculated using Equation (3a): t = PD / 2(SE + PY), where: P = internal design gauge pressure, D = outside diameter of pipe, S = allowable stress from ASME Section II-D at design temperature, E = longitudinal joint quality factor from Table A-1B, Y = coefficient from Table 304.1.1 (typically 0.4 for ferrous materials below creep range). This equation is valid when t < D/6 (thin-wall assumption). For t ≥ D/6, use Eq. (3b) or Lame's equation.",
    application: "This is the PRIMARY calculation performed by the Wall Thickness module. Every variable (P, D, S, E, Y) is sourced from the design inputs and reference tables.",
    lesson: "This is THE equation of piping design — memorize it. Key understanding: (1) S comes from ASME Section II-D — it already includes a safety factor of ~3.5 on UTS and ~1.5-2.5 on yield. (2) E de-rates for weld quality — seamless pipe E=1.0, ERW E=0.85. (3) Y accounts for the pressure acting on the pipe wall cross-section — it's temperature-dependent and increases above 900°F. (4) The D is OUTSIDE diameter, not inside — this is by convention in B31.3. (5) This equation assumes uniform thinning; for localized corrosion, pitting assessment per API 579 may be needed.",
    keyPoints: [
      "t = PD / 2(SE + PY) — Equation (3a)",
      "Valid only for t < D/6 (thin wall)",
      "D is OUTSIDE diameter (per B36.10M/B36.19M)",
      "S includes built-in safety factors (≈3.5 on UTS)",
      "Y = 0.4 for most ferritic steel below 900°F",
      "E = 1.0 for seamless, 0.85 for ERW without full RT",
    ],
    relatedSections: ["B31.3-304.1.1", "B31.3-302.4", "SecIID-Table1A", "B31.3-TableA1B"],
    category: "design",
  },

  "B31.3-TableA1B": {
    id: "B31.3-TableA1B",
    standard: "ASME B31.3",
    section: "Table A-1B",
    title: "Longitudinal Weld Joint Quality Factor (Ej)",
    summary: "Lists the longitudinal joint quality factor based on pipe manufacturing method and examination level.",
    fullText: "Table A-1B provides Ej values based on pipe specification and manufacturing type: Seamless pipe = 1.0 (no longitudinal weld). ERW (Electric Resistance Welded) = 0.85 (or 1.0 if 100% radiographed). EFW (Electric Fusion Welded) = 0.80 to 1.0 depending on RT extent. Furnace Butt Weld = 0.60. The factor accounts for the lower reliability of the longitudinal seam compared to seamless pipe.",
    application: "The recommendation engine sets Ej based on the weld type selected in Design Inputs. Ej directly multiplies the allowable stress in the thickness equation.",
    lesson: "Ej is a DERATING factor on allowable stress. If Ej = 0.85, you effectively have only 85% of the material's allowable stress available for design. This means ~18% thicker pipe compared to seamless (Ej=1.0). For critical or corrosive service, specifying seamless pipe eliminates this penalty entirely. The 12.5% wall thickness uncertainty from ERW longitudinal welds is the engineering basis for the 0.85 factor.",
    keyPoints: [
      "Seamless: Ej = 1.0 — best for critical service",
      "ERW: Ej = 0.85 default, 1.0 with 100% RT of longitudinal seam",
      "EFW: varies 0.80-1.0 by RT extent",
      "Furnace butt weld: Ej = 0.60 — rarely used in modern process piping",
      "Lower Ej → thicker required wall → heavier pipe → higher cost",
    ],
    relatedSections: ["B31.3-304.1.2", "B31.3-302.3.4"],
    category: "material",
  },

  "B31.3-323.1": {
    id: "B31.3-323.1",
    standard: "ASME B31.3",
    section: "§323.1",
    title: "General Materials Requirements",
    summary: "Establishes the fundamental requirements for materials used in B31.3 piping systems.",
    fullText: "Materials shall conform to a specification listed in ASME B31.3 (Table A-1 or Table A-2). If an unlisted material is used, it requires owner approval per §323.1.2. Materials must be suitable for the service conditions including pressure, temperature, corrosive environment, and any special requirements (e.g., NACE for sour service). The designer must verify material compatibility across all components in a joint: pipe, fittings, flanges, bolts, and gaskets must be metallurgically compatible.",
    application: "The Material Selection Module and recommendation engine use this section as the basis for ensuring all component materials are compatible with each other and suitable for the service.",
    lesson: "Material selection is not just about the pipe — it's about the SYSTEM. A carbon steel pipe with a stainless flange creates a galvanic couple. A B7 bolt in sour service will crack from sulfide stress cracking. Every component must be evaluated: pipe + flange + fitting + bolt + gasket + weld filler metal. The 'cascading' material selection in this app mimics how experienced engineers think — start with pipe material, then match everything else.",
    keyPoints: [
      "All materials must be listed in B31.3 Table A-1/A-2 or owner-approved",
      "Must check compatibility across ALL components in a joint",
      "Galvanic corrosion between dissimilar metals must be considered",
      "NACE MR0175 compliance required for sour (H₂S) service",
      "Material test reports (MTRs) should be reviewed for critical service",
    ],
    relatedSections: ["B31.3-323.2", "B31.3-323.4", "SecIID-Table1A"],
    category: "material",
  },

  "B31.3-323.2": {
    id: "B31.3-323.2",
    standard: "ASME B31.3",
    section: "§323.2",
    title: "Material Temperature Limitations",
    summary: "Defines temperature limits for piping materials and requirements for low-temperature service.",
    fullText: "§323.2.1 (Upper limits): Materials shall not be used above the highest temperature for which an allowable stress is listed in ASME Section II-D. Carbon steel is generally limited to 427°C (800°F) for long-term service due to graphitization risk. §323.2.2 (Lower limits): For carbon and low-alloy steels, the minimum temperature without impact testing is -29°C (-20°F). Below this, impact testing per ASME Section II-D or a material upgrade (A333 Gr.6, A312 TP304L) is required. Austenitic stainless steels (300 series) are exempt from impact testing down to -196°C.",
    application: "The recommendation engine uses temperature limits to filter suitable pipe materials and flag warnings when design temperature approaches or exceeds material limits.",
    lesson: "Temperature is the silent killer of piping integrity. At HIGH temperatures, steel loses strength gradually — but there's a cliff at ~427°C where carbon steel enters the creep range and graphitization begins. At LOW temperatures, carbon steel becomes brittle — the ductile-to-brittle transition. The -29°C threshold isn't arbitrary: it's based on the typical DBTT (Ductile-Brittle Transition Temperature) of carbon steel. Below this, without impact testing, you cannot verify the material won't shatter like glass.",
    keyPoints: [
      "Carbon steel max: 427°C (800°F) for long-term service",
      "Carbon steel min without impact test: -29°C (-20°F)",
      "Below -29°C: impact testing required OR use pre-qualified low-temp material",
      "Austenitic SS (304/316): exempt from impact testing to -196°C",
      "Above 427°C: use Cr-Mo alloys (A335 P11, P22) or stainless",
      "Graphitization risk for CS above 427°C in long-term service",
    ],
    relatedSections: ["B31.3-323.1", "B31.3-323.3", "SecIID-Table1A"],
    category: "material",
  },

  "B31.3-345.4": {
    id: "B31.3-345.4",
    standard: "ASME B31.3",
    section: "§345.4",
    title: "Hydrostatic Leak Test",
    summary: "Defines requirements for hydrostatic testing of completed piping systems.",
    fullText: "§345.4.2(a): The hydrostatic test pressure at any point in the system shall be not less than 1.5 times the design pressure. When the test temperature differs significantly from the design temperature, the test pressure may be adjusted by the ratio of allowable stress at test temperature to allowable stress at design temperature: P_test = 1.5 × P × (S_test / S_design). The test pressure must not exceed the yield strength of any component at test temperature, and must not exceed the test limit of any flanged joint (flange rating at test temperature × 1.5). The system must hold test pressure for at least 10 minutes, then be visually inspected for leaks.",
    application: "The recommendation engine calculates test pressure as 1.5 × design pressure. The compliance checker verifies the test pressure meets the minimum requirement.",
    lesson: "Hydrostatic testing is the final proof that the piping system can safely contain pressure. The 1.5× factor provides a margin above operating conditions. Critical pitfalls: (1) Check flange rating at TEST temperature (ambient), not design temperature — flanges are often rated HIGHER at ambient than at design temperature, so this usually isn't a problem, but verify. (2) The test pressure must not produce a stress exceeding 90% of yield at any point. (3) For high-design-temperature services, the stress ratio adjustment S_test/S_design can result in very high test pressures — verify all components can handle it.",
    keyPoints: [
      "Minimum test pressure = 1.5 × design pressure",
      "Hold for minimum 10 minutes, then visual inspection",
      "Check flange rating at TEST temperature (ambient)",
      "Test pressure must not exceed 90% of yield at any point",
      "Category M: hydrostatic test is MANDATORY (no pneumatic)",
      "Pneumatic test = 1.1 × P, only when hydro is impractical",
    ],
    relatedSections: ["B31.3-345.5", "B31.3-301.2", "B31.3-Ch.VIII"],
    category: "testing",
  },

  "B31.3-302.3.4": {
    id: "B31.3-302.3.4",
    standard: "ASME B31.3",
    section: "§302.3.4",
    title: "Weld Joint Strength Reduction",
    summary: "Addresses the relationship between weld joint quality and allowable stress.",
    fullText: "The allowable stress for welded pipe is the product of the basic allowable stress S and the longitudinal joint quality factor Ej: S_effective = S × Ej. This reflects the fact that the longitudinal weld seam may be the weakest point in the pipe. The factor Ej depends on the manufacturing method and the extent of non-destructive examination (NDE) applied to the longitudinal seam during manufacturing. 100% radiographic examination of the longitudinal weld allows Ej = 1.0 for most welded specifications.",
    application: "Ej is used directly in the wall thickness equation t = PD / 2(S×E + PY). The recommendation engine sets Ej based on the selected weld type.",
    lesson: "Think of Ej as a 'confidence factor' in the longitudinal seam. A seamless pipe has no longitudinal weld, so Ej = 1.0 — full confidence. ERW has a weld that's been made but only spot-checked, so Ej = 0.85 — we're 85% confident. With 100% RT, we've verified the entire seam, so Ej returns to 1.0. This is a direct engineering application of risk-based thinking: more inspection = more confidence = less conservatism needed.",
    keyPoints: [
      "Ej is a confidence factor for the longitudinal seam quality",
      "More NDE inspection → higher confidence → higher Ej",
      "S_effective = S × Ej is used in the thickness equation",
      "Seamless eliminates the longitudinal weld entirely",
      "For critical service, seamless avoids the Ej question entirely",
    ],
    relatedSections: ["B31.3-TableA1B", "B31.3-304.1.2"],
    category: "design",
  },

  "B31.3-304.3": {
    id: "B31.3-304.3",
    standard: "ASME B31.3",
    section: "§304.3",
    title: "Branch Connections",
    summary: "Requirements for branch connection design including reinforcement calculations.",
    fullText: "Branch connections weaken the pipe run by removing material at the branch opening. §304.3 requires that the area of metal removed by the branch opening be replaced by reinforcement — either from excess wall thickness in the run and branch pipes, or by a reinforcement pad. The required reinforcement area = d × t_min (branch opening diameter × required thickness of run pipe). Available reinforcement comes from: (a) excess thickness in the run pipe beyond minimum required, (b) excess thickness in the branch pipe, (c) added reinforcement pad. If available ≥ required, the branch is adequately reinforced.",
    application: "The Flanges module warns when branch type is not 'None', indicating that reinforcement calculations per §304.3 may be required.",
    lesson: "Every hole in a pressure boundary must be compensated. This is the 'area replacement' concept — the metal you remove must be replaced nearby to maintain pressure integrity. Think of it like cutting a hole in a load-bearing wall: you need a header beam to carry the load around the opening. In piping, that 'header' is the reinforcement area. Most standard fittings (tees) are designed with built-in reinforcement. Branch connections (welded-on nozzles) often need explicit reinforcement pad calculations.",
    keyPoints: [
      "Every opening weakens the pressure boundary",
      "Removed area must be replaced by reinforcement",
      "Standard tees (B16.9) include built-in reinforcement",
      "Welded-on branch connections need explicit calc",
      "Reinforcement pads (B16.5) are common supplemental reinforcement",
    ],
    relatedSections: ["B31.3-304.1.2", "B16.9"],
    category: "design",
  },

  "B31.3-Ch.VIII": {
    id: "B31.3-Ch.VIII",
    standard: "ASME B31.3",
    section: "Chapter VIII",
    title: "Piping for Category M Fluid Service",
    summary: "Additional requirements for piping systems containing lethal fluids.",
    fullText: "Chapter VIII supplements the base code requirements for Category M service. Key additional requirements include: (a) Enhanced examination — 100% visual examination of all welds, plus 100% radiographic or ultrasonic examination of all circumferential butt welds. (b) Socket welds require PT or MT examination. (c) Hydrostatic test is MANDATORY — pneumatic testing is NOT permitted. (d) A sensitive leak test per §M345.8 is required after the pressure test. (e) Materials must comply with §323.5 for Category M service. (f) Threaded joints shall be seal-welded.",
    application: "The service classification engine triggers Category M flags and the compliance checker verifies enhanced requirements when Category M is designated.",
    lesson: "Category M is B31.3's most stringent classification. Think of it this way: if this pipe leaks, someone could die from a single breath or skin contact. That level of consequence demands the highest level of engineering rigor. The prohibition on pneumatic testing is because if a Category M pipe fails during a pneumatic test, you've just created a potential gas cloud of a lethal substance. The 100% examination requirement means every single weld is verified — no statistical sampling.",
    keyPoints: [
      "100% RT/UT on all butt welds — no sampling allowed",
      "Pneumatic test PROHIBITED — hydrostatic only",
      "Sensitive leak test required after pressure test",
      "Socket welds allowed but require PT/MT examination",
      "All threaded joints must be seal-welded",
      "Materials must meet §323.5 special requirements",
    ],
    relatedSections: ["B31.3-300.2", "B31.3-345.4"],
    category: "examination",
  },

  "B31.3-Ch.IX": {
    id: "B31.3-Ch.IX",
    standard: "ASME B31.3",
    section: "Chapter IX",
    title: "High Pressure Piping",
    summary: "Design, examination, and testing requirements for high-pressure piping systems.",
    fullText: "Chapter IX applies when design pressure exceeds the scope of standard component ratings (typically above ASME B16.5 Class 2500 ≈ 6250 psi). Key differences: (a) Design equations in §K304 — modified from base code equations to account for thick-wall effects. (b) 100% volumetric examination required on all pressure-containing welds. (c) Special joint design requirements per §K304.5. (d) Welding qualification requirements are enhanced. (e) All piping components must be individually designed — cannot rely on standard catalog ratings.",
    application: "The service classification engine and compliance checker flag High Pressure when design pressure exceeds B16.5 Class 2500 range or when explicitly designated by the user.",
    lesson: "High-pressure piping is where the thin-wall assumption breaks down. The standard equation t = PD/2(SE+PY) assumes thin walls (t < D/6). In high-pressure service, the pipe wall is THICK relative to the diameter, and stress distribution across the wall is non-uniform — the inner surface sees higher stress than the outer. Chapter IX's modified equations account for this. Everything is custom-designed; you can't just 'look up' a schedule from B36.10M.",
    keyPoints: [
      "Applies above B16.5 Class 2500 pressure range",
      "Thin-wall equation no longer valid — use Chapter IX equations",
      "100% volumetric examination on ALL welds",
      "All components custom-designed — no standard ratings",
      "Special welding and NDE qualifications required",
    ],
    relatedSections: ["B31.3-300.2", "B31.3-304.1.2"],
    category: "design",
  },

  // ═══════════════════════════════════════════════════════════
  // ASME Section II-D
  // ═══════════════════════════════════════════════════════════

  "SecIID-Table1A": {
    id: "SecIID-Table1A",
    standard: "ASME Section II-D",
    section: "Table 1A",
    title: "Allowable Stress — Ferrous Materials",
    summary: "Lists maximum allowable stress values for ferrous materials at various temperatures.",
    fullText: "Table 1A provides allowable stress values (S) for ferrous materials including carbon steel, alloy steel, and stainless steel at temperatures from -29°C to the maximum rated temperature of each material. The allowable stress is derived from the lesser of: (a) 1/3.5 of the minimum specified tensile strength at room temperature, (b) 2/3 of the minimum specified yield strength at temperature (for austenitic SS: 90% of yield at temperature). Above the creep range, time-dependent properties govern and the allowable stress is the lesser of: 100% of average stress for 1% creep in 100,000 hours, or 67% of average stress for rupture in 100,000 hours.",
    application: "The Allowable Stress lookup in the recommendation engine retrieves S from this table based on the selected pipe material and design temperature. This S value is used directly in the wall thickness equation.",
    lesson: "Allowable stress is NOT the strength of the material — it's the strength divided by a safety factor. For carbon steel at room temperature, S ≈ tensile strength / 3.5. This means you're designing the pipe to operate at less than 30% of its breaking strength. The safety factor accounts for: uncertainties in material properties, manufacturing variations, calculation approximations, and unknown loadings. As temperature increases, allowable stress decreases because the material physically weakens. The rate of decrease accelerates above the creep range (~370°C for carbon steel).",
    keyPoints: [
      "S = min(UTS/3.5, 2/3 × Yield) — built-in safety factor",
      "S decreases with increasing temperature",
      "Above creep range: time-dependent properties govern",
      "Interpolation between listed temperatures is permitted",
      "S values assume new, undamaged material",
      "For welded pipe, effective S = S × Ej",
    ],
    relatedSections: ["B31.3-304.1.2", "B31.3-TableA1B", "B31.3-323.2"],
    category: "material",
  },

  // ═══════════════════════════════════════════════════════════
  // ASME B36.10M / B36.19M
  // ═══════════════════════════════════════════════════════════

  "B36.10M": {
    id: "B36.10M",
    standard: "ASME B36.10M",
    section: "Table 1",
    title: "Welded and Seamless Wrought Steel Pipe — Dimensions",
    summary: "Defines standard pipe sizes (NPS), outside diameters, and wall thicknesses for carbon and alloy steel pipe.",
    fullText: "B36.10M establishes standard pipe sizes from NPS 1/8\" to NPS 80\" with standardized outside diameters and wall thicknesses. Key concepts: NPS (Nominal Pipe Size) is a dimensionless designator — it does NOT equal the actual OD except for NPS 14 and above. Schedules (Sch 5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160, STD, XS, XXS) define specific wall thicknesses for each NPS. Schedule 40 equals STD (Standard) for NPS ≤10. Schedule 80 equals XS (Extra Strong) for NPS ≤8.",
    application: "The pipe schedule engine looks up OD and available wall thicknesses from this table. The batch calculation module computes required schedules for all NPS sizes.",
    lesson: "Understanding NPS vs. actual dimensions is fundamental. NPS 4\" has an OD of 4.500\" — not 4.000\". This is because NPS was historically based on the inside diameter (ID) of standard-weight pipe. As schedules got heavier (thicker walls), the OD stayed the same (for fitting compatibility) while the ID decreased. This is why a 4\" pipe has a 4.500\" OD — the original 'Standard' weight had an ID close to 4\". This dimensional system is over 100 years old and isn't going to change.",
    keyPoints: [
      "NPS ≠ actual OD (except NPS ≥ 14\")",
      "OD is constant for a given NPS across all schedules",
      "Heavier schedule = thicker wall = smaller ID = same OD",
      "Sch 40 = STD for NPS ≤ 10\"",
      "Sch 80 = XS for NPS ≤ 8\"",
      "All fittings, flanges match pipe OD — that's why OD is standardized",
    ],
    relatedSections: ["B36.19M", "B31.3-304.1.2"],
    category: "design",
  },

  "B36.19M": {
    id: "B36.19M",
    standard: "ASME B36.19M",
    section: "Table 1",
    title: "Stainless Steel Pipe — Dimensions",
    summary: "Defines standard dimensions for stainless steel pipe, using 'S' schedule designations.",
    fullText: "B36.19M covers stainless steel pipe dimensions. It uses the same OD as B36.10M (for interchangeability) but has different schedule designations: 5S, 10S, 40S, 80S. The 'S' schedules have thinner walls than their B36.10M counterparts because stainless steel has higher strength-to-weight ratios. Sch 40S = Sch 40 for NPS ≤ 10\". For NPS 12\" and above, Sch 40S is thinner than Sch 40.",
    application: "Used for schedule lookup when stainless steel pipe is selected. The app flags B36.19M as the governing standard for stainless specifications.",
    lesson: "The 'S' schedules exist because stainless steel is more expensive than carbon steel, so using the same wall thickness would be over-design in many cases. Since stainless also has higher allowable stress than carbon steel at most temperatures, thinner walls are often adequate. However, for NACE-compliant sour service, minimum wall thickness requirements may override the calculated thickness.",
    keyPoints: [
      "Same OD system as B36.10M — perfect interchangeability",
      "'S' schedules typically have thinner walls",
      "Sch 40S = Sch 40 for NPS ≤ 10\"",
      "For NPS ≥ 12\", Sch 40S is THINNER than Sch 40",
      "Higher material cost → optimize wall thickness",
    ],
    relatedSections: ["B36.10M", "B31.3-304.1.2"],
    category: "design",
  },

  // ═══════════════════════════════════════════════════════════
  // ASME B16.5
  // ═══════════════════════════════════════════════════════════

  "B16.5": {
    id: "B16.5",
    standard: "ASME B16.5",
    section: "Table 2",
    title: "Pressure-Temperature Ratings for Flanged Fittings",
    summary: "Provides pressure-temperature (P-T) ratings for standard flanges in Classes 150-2500.",
    fullText: "ASME B16.5 establishes dimensional and P-T rating standards for pipe flanges from NPS 1/2\" through NPS 24\" in pressure classes: 150, 300, 600, 900, 1500, 2500. P-T ratings depend on the material group (e.g., Group 1.1 = carbon steel, Group 2.2 = 316 SS). At -29°C to 38°C, the rating is maximum (cold working pressure). As temperature increases, the rating decreases because the material weakens. The flange class selected must have a P-T rating that equals or exceeds the design pressure at the design temperature.",
    application: "The recommendation engine selects the minimum flange class by comparing design pressure against P-T ratings at the design temperature for the appropriate material group.",
    lesson: "Flange class selection is often misunderstood. A 'Class 150' flange does NOT necessarily have a 150 psi rating — that's only for Group 1.1 at temperatures above ~260°C. At ambient temperature, a Class 150 Group 1.1 flange is rated at 19.6 bar (285 psi). The rating is a function of BOTH temperature AND material group. Always check the ACTUAL P-T rating at your design temperature, not the class designation number.",
    keyPoints: [
      "Class number ≠ actual pressure rating (it's a designation)",
      "Rating depends on BOTH temperature AND material group",
      "Maximum rating occurs at -29°C to 38°C (cold working pressure)",
      "Rating decreases as temperature increases",
      "Must verify rating at BOTH design temperature AND test temperature",
      "Above Class 2500: B16.5 does not apply (use B16.47 or Chapter IX)",
    ],
    relatedSections: ["B31.3-304.1.2", "B31.3-323.1", "B16.20"],
    category: "design",
  },

  // ═══════════════════════════════════════════════════════════
  // ASME B16.9 / B16.11
  // ═══════════════════════════════════════════════════════════

  "B16.9": {
    id: "B16.9",
    standard: "ASME B16.9",
    section: "General",
    title: "Factory-Made Wrought Butt-Welding Fittings",
    summary: "Standard for dimensions, tolerances, and testing of butt-welding pipe fittings.",
    fullText: "B16.9 covers factory-made butt-welding fittings: elbows (90° long-radius, 90° short-radius, 45°), tees, reducers (concentric and eccentric), caps, and other standard fittings. Key requirements: (a) Fittings must be made from material compatible with the pipe specification. (b) Wall thickness at any point shall not be less than 87.5% of the nominal wall thickness of the matching pipe. (c) Standard fittings are pressure-rated the same as the matching pipe of the same schedule and material — they do NOT need separate pressure design calculations. (d) Non-standard wall fittings require engineering evaluation.",
    application: "The Flanges & Fittings module lists standard B16.9 fittings with matched materials from the recommendation engine.",
    lesson: "B16.9 fittings are self-proving for pressure design — if you select a Sch 40 fitting to match Sch 40 pipe, the fitting is rated the same as the pipe and needs no separate calculation. This is because the fitting manufacturer has designed and tested the fitting to meet or exceed the pipe rating. The 87.5% minimum wall rule means the fitting can be up to 12.5% thinner than the pipe at some points — this matches the pipe manufacturing tolerance of -12.5%.",
    keyPoints: [
      "Standard fittings match pipe pressure rating — no separate calc needed",
      "Must match fitting schedule to pipe schedule",
      "Material must be compatible with pipe material",
      "87.5% minimum wall = same as pipe mill tolerance",
      "Long-radius elbows (R = 1.5D) are standard; short-radius (R = 1D) for tight spaces",
      "Reducers: concentric for vertical, eccentric for horizontal (flat bottom up)",
    ],
    relatedSections: ["B31.3-323.1", "B36.10M", "B16.11"],
    category: "design",
  },

  "B16.11": {
    id: "B16.11",
    standard: "ASME B16.11",
    section: "General",
    title: "Forged Fittings, Socket-Welding and Threaded",
    summary: "Standard for forged steel socket-welding and threaded fittings.",
    fullText: "B16.11 covers forged fittings in pressure ratings of 2000, 3000, 6000, and 9000 psi class. Socket-weld fittings are used for small-bore connections (typically NPS 2\" and below). Threaded fittings are used for low-pressure utility services. Key considerations: (a) Socket welds have a fatigue life approximately 50% of butt welds — they are PROHIBITED in severe cyclic service per B31.3 §328.2.2. (b) Threaded connections may leak under thermal cycling. (c) For Category M service, threaded joints must be seal-welded.",
    application: "Material compatibility data from B16.11 is incorporated into the material database. The compliance checker flags socket weld restrictions for severe cyclic service.",
    lesson: "Socket welds are the most common small-bore connection but they have a critical weakness: the socket gap creates a fatigue-sensitive geometry. The gap can also trap fluid and promote crevice corrosion. This is why B31.3 prohibits them in severe cyclic service and why many company standards require butt-weld olets instead of socket-weld fittings in corrosive or high-cycle applications. For Category M, threaded joints must be seal-welded because a threaded joint is inherently a leak path.",
    keyPoints: [
      "For small-bore connections (≤ NPS 2\" typically)",
      "Socket welds PROHIBITED in severe cyclic service (§328.2.2)",
      "Socket weld fatigue life ≈ 50% of butt weld",
      "Threaded joints must be seal-welded for Category M",
      "Pressure classes: 2000, 3000, 6000, 9000 lb",
      "Crevice corrosion risk in socket welds — consider butt-weld olets for corrosive service",
    ],
    relatedSections: ["B16.9", "B31.3-300.2", "B31.3-Ch.VIII"],
    category: "fabrication",
  },

  // ═══════════════════════════════════════════════════════════
  // ASME B16.20
  // ═══════════════════════════════════════════════════════════

  "B16.20": {
    id: "B16.20",
    standard: "ASME B16.20",
    section: "General",
    title: "Metallic Gaskets — Spiral Wound and Ring Joint",
    summary: "Standard for metallic gaskets including spiral-wound and ring-type joint (RTJ) gaskets.",
    fullText: "B16.20 covers two main gasket types: (a) Spiral-wound gaskets (SWG) — made from metallic strip (e.g., 304SS, 316SS) wound with a filler material (flexible graphite, PTFE). They are the standard for process piping on raised-face flanges. Inner and outer rings provide centering and blowout protection. (b) Ring-type joint (RTJ) gaskets — solid metal rings (oval or octagonal cross-section) used in RTJ groove-face flanges for high-pressure or critical service. RTJ gaskets provide metal-to-metal sealing and are preferred for Class 900 and above.",
    application: "The recommendation engine selects gasket type based on service conditions and compatibility with the selected flange and fluid.",
    lesson: "The gasket is where most flanged joint leaks originate. Understanding gasket selection: (1) Spiral wound with flexible graphite filler is the workhorse — good to ~400°C, handles cycling well. (2) PTFE filler spiral wound — for chemical service, but PTFE degrades above 260°C. (3) RTJ gaskets — for high-pressure, high-integrity applications. They require RTJ groove-face flanges (not interchangeable with RF flanges). (4) The inner ring prevents inward buckling; the outer ring (centering ring) ensures proper bolt circle alignment. (5) Gasket class MUST match flange class.",
    keyPoints: [
      "Spiral wound (flex graphite): standard for most process piping",
      "PTFE filler: chemical resistance, but limited to ~260°C",
      "RTJ gaskets: high-pressure (Class 900+), metal-to-metal seal",
      "RTJ requires groove-face flanges — NOT interchangeable with RF",
      "Gasket class must match flange class",
      "Inner ring prevents buckling; outer ring provides centering",
    ],
    relatedSections: ["B16.5", "B31.3-323.4"],
    category: "material",
  },

  // ═══════════════════════════════════════════════════════════
  // ASTM A530 (Mill Tolerance)
  // ═══════════════════════════════════════════════════════════

  "ASTM-A530": {
    id: "ASTM-A530",
    standard: "ASTM A530",
    section: "§10",
    title: "Permissible Variations in Wall Thickness",
    summary: "Specifies manufacturing tolerance on pipe wall thickness.",
    fullText: "ASTM A530 §10 specifies that the minimum wall thickness at any point shall not be more than 12.5% under the nominal wall thickness specified. This applies to most seamless and welded carbon and alloy steel pipe specifications (A106, A335, A333, etc.). This is a NEGATIVE tolerance only — there is no maximum wall thickness limit in A530.",
    application: "The wall thickness calculation divides the corroded thickness by (1 - 0.125) = 0.875 to account for this manufacturing tolerance.",
    lesson: "The -12.5% tolerance means that when you order Schedule 40 pipe with a nominal wall of 7.11 mm, the manufacturer is allowed to deliver pipe as thin as 6.22 mm and it still passes QC. This is why the minimum required thickness calculation MUST include this tolerance. The formula t_min = t_corroded / 0.875 ensures that even at the worst manufacturing tolerance, the pipe has adequate wall thickness for pressure and corrosion.",
    keyPoints: [
      "-12.5% is the MAXIMUM negative deviation allowed",
      "Applies to most ASTM carbon/alloy steel pipe specs",
      "No maximum wall thickness limit (only minimum)",
      "Some API specs allow tighter tolerance (-10%)",
      "This tolerance is manufacturing reality, not a design choice",
    ],
    relatedSections: ["B31.3-304.1.1"],
    category: "fabrication",
  },

  // ═══════════════════════════════════════════════════════════
  // NACE MR0175 / ISO 15156
  // ═══════════════════════════════════════════════════════════

  "NACE-MR0175": {
    id: "NACE-MR0175",
    standard: "NACE MR0175/ISO 15156",
    section: "General",
    title: "Petroleum and Natural Gas Industries — Materials for Use in H₂S-Containing Environments",
    summary: "Requirements for materials used in sour (hydrogen sulfide) service to prevent sulfide stress cracking.",
    fullText: "NACE MR0175 (now ISO 15156) specifies material requirements for resistance to sulfide stress cracking (SSC), hydrogen-induced cracking (HIC), and stress-oriented hydrogen-induced cracking (SOHIC) in H₂S-containing environments. Key requirements: (a) Carbon steel: hardness ≤ HRC 22 (approximately HB 237). (b) Bolting: A193 B7M (HRC ≤ 22) instead of standard B7 (HRC up to 35). (c) Post-weld heat treatment may be required to reduce weld hardness. (d) Stainless steels: austenitic grades must be solution-annealed.",
    application: "The service classification engine flags sour service. The material recommendation engine suggests NACE-compliant materials (B7M bolts, hardness-controlled pipe) when sour service is detected.",
    lesson: "Sulfide stress cracking is insidious — it can cause sudden brittle fracture in otherwise ductile steel. The mechanism: H₂S dissociates and atomic hydrogen diffuses into the steel. In hard microstructures (>HRC 22), this hydrogen embrittles the steel. The harder the steel, the more susceptible it is. This is why hardness control is the PRIMARY mitigation. B7 bolts (hardness up to HRC 35) are one of the most common failures in sour service — they crack without warning. B7M bolts (HRC ≤ 22) are specifically tempered to avoid this.",
    keyPoints: [
      "HRC ≤ 22 for carbon and low-alloy steel — CRITICAL",
      "Standard A193 B7 bolts are NOT suitable for sour service",
      "Use A193 B7M bolts (tempered to lower hardness)",
      "PWHT may be needed to control weld hardness",
      "Austenitic SS must be solution-annealed",
      "SSC can cause sudden brittle fracture without warning",
    ],
    relatedSections: ["B31.3-323.1"],
    category: "material",
  },

  // ═══════════════════════════════════════════════════════════
  // SUPPORT SPAN REFERENCES
  // ═══════════════════════════════════════════════════════════

  "MSS-SP58": {
    id: "MSS-SP58",
    standard: "MSS SP-58",
    section: "General",
    title: "Pipe Hangers and Supports — Materials, Design, and Manufacture",
    summary: "Standard for pipe support materials, design, and construction.",
    fullText: "MSS SP-58 covers materials, design, and manufacture of pipe hangers and supports including: pipe shoes, rest supports, U-bolt clamps, spring hangers, constant force supports, rod hangers, guides, and anchors. Supports must be designed to handle: (a) dead loads (pipe, fluid, insulation), (b) thermal expansion/contraction loads, (c) dynamic loads (wind, seismic, slug flow). Pipe shoes are used on insulated pipe to maintain insulation clearance and distribute loads.",
    application: "The Support Span module references MSS SP-58 for support type selection and MSS SP-69 for span guidelines.",
    lesson: "Pipe supports are often the 'forgotten' element of piping design, but they're critical to piping integrity. Under-supported pipe sags and creates low points where liquid accumulates; over-supported pipe cannot move freely with thermal expansion and overstresses the pipe or equipment nozzles. The support engineer must balance two competing needs: (1) prevent excessive sag/stress, and (2) allow thermal movement. This is why you see different support types: slides (allow axial movement), guides (restrict lateral movement), anchors (fix position), and springs (accommodate vertical movement).",
    keyPoints: [
      "Supports must handle dead loads, thermal loads, and dynamic loads",
      "Pipe shoes maintain insulation clearance on insulated pipe",
      "Guides restrict lateral movement but allow axial thermal expansion",
      "Spring hangers accommodate vertical thermal displacement",
      "Anchors are fixed points — used to control expansion direction",
      "Under-supporting causes sag; over-supporting causes thermal stress",
    ],
    relatedSections: ["MSS-SP69"],
    category: "design",
  },

  "MSS-SP69": {
    id: "MSS-SP69",
    standard: "MSS SP-69",
    section: "Table 3",
    title: "Pipe Hangers and Supports — Selection and Application",
    summary: "Guidelines for support spacing, selection criteria, and application of pipe supports.",
    fullText: "MSS SP-69 provides recommended maximum support spans for various pipe sizes and services. Typical spans for carbon steel filled with water: NPS 2\" = 3.0m (10ft), NPS 4\" = 4.3m (14ft), NPS 6\" = 5.2m (17ft), NPS 8\" = 5.8m (19ft), NPS 12\" = 7.0m (23ft). These are based on limiting combined bending stress and deflection (typically ≤12.5 mm mid-span). Actual spans must be adjusted for: pipe material, wall thickness, fluid density, insulation weight, and whether the pipe is horizontal or vertical.",
    application: "The Support Span engine uses MSS SP-69 guidelines combined with actual pipe dimensions, fluid density, and insulation data to calculate site-specific support spans.",
    lesson: "Support span tables in SP-69 are GUIDELINES, not absolute limits. They assume: Schedule 40 carbon steel pipe filled with water. If your pipe is thinner (lighter schedule), heavier fluid (slurry), or has heavy insulation, the actual span must be shorter. Conversely, empty gas pipe can span longer. The app calculates three spans: empty (construction), operating (service), and hydrotest (water-filled) — the SHORTEST of these three governs the support spacing.",
    keyPoints: [
      "SP-69 spans are GUIDELINES, not code requirements",
      "Based on Sch 40 CS pipe filled with water",
      "Must adjust for: schedule, fluid density, insulation",
      "Three load cases: empty, operating, hydrotest",
      "Governing span = shortest of the three cases",
      "Typical deflection limit: 12.5 mm (1/2\") mid-span",
    ],
    relatedSections: ["MSS-SP58", "B31.3-321"],
    category: "design",
  },
};

/**
 * Look up a code reference by ID
 */
export function getCodeReference(id: string): CodeReference | null {
  return CODE_REFERENCES[id] || null;
}

/**
 * Find code references by standard name
 */
export function getCodeReferencesByStandard(standard: string): CodeReference[] {
  return Object.values(CODE_REFERENCES).filter(r => 
    r.standard.toLowerCase().includes(standard.toLowerCase())
  );
}

/**
 * Find code references by category
 */
export function getCodeReferencesByCategory(category: CodeReference["category"]): CodeReference[] {
  return Object.values(CODE_REFERENCES).filter(r => r.category === category);
}

/**
 * Search code references by keyword
 */
export function searchCodeReferences(query: string): CodeReference[] {
  const q = query.toLowerCase();
  return Object.values(CODE_REFERENCES).filter(r =>
    r.title.toLowerCase().includes(q) ||
    r.summary.toLowerCase().includes(q) ||
    r.section.toLowerCase().includes(q) ||
    r.fullText.toLowerCase().includes(q) ||
    r.lesson.toLowerCase().includes(q)
  );
}
