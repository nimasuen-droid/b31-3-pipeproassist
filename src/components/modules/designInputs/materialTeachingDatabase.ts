/**
 * Material Teaching Database
 * Comprehensive teaching content for every material selection option.
 * Each entry explains WHY a material is selected, WHEN to use it,
 * what code sections govern it, and common pitfalls.
 */

export interface MaterialLesson {
  designation: string;
  commonName: string;
  astmSpec: string;
  materialGroup: string;
  composition: string;
  whySelected: string;
  whenToUse: string[];
  whenNOTToUse: string[];
  codeReferences: string[];
  temperatureLesson: string;
  corrosionLesson: string;
  costLesson: string;
  commonMistakes: string[];
  realWorldNotes: string;
}

export const MATERIAL_LESSONS: Record<string, MaterialLesson> = {
  // ═══════════════════════════════════════════════════════════
  // PIPE MATERIALS
  // ═══════════════════════════════════════════════════════════

  "A106 Gr.B": {
    designation: "A106 Gr.B",
    commonName: "Standard Carbon Steel Pipe",
    astmSpec: "ASTM A106/A106M — Seamless Carbon Steel Pipe for High-Temperature Service",
    materialGroup: "Carbon Steel",
    composition: "C ≤ 0.30%, Mn 0.29-1.06%, Si ≥ 0.10%. Killed steel (fully deoxidized).",
    whySelected: "A106 Gr.B is the 'default' pipe material for process piping. It covers the widest temperature range of common carbon steels (-29°C to 427°C), is universally available, cost-effective, and has extensive historical performance data. It's the baseline against which all other materials are compared.",
    whenToUse: [
      "General hydrocarbon process piping",
      "Low-pressure and high-pressure steam (up to ~400°C)",
      "Cooling water (with adequate corrosion allowance)",
      "Instrument air and utility services",
      "Any service from -29°C to 427°C where carbon steel is suitable",
    ],
    whenNOTToUse: [
      "Below -29°C without impact testing (consider A333 Gr.6)",
      "Above 427°C (graphitization risk — use Cr-Mo)",
      "Corrosive/sour service without NACE evaluation",
      "Oxygen service at high pressures (ignition risk)",
      "Cryogenic service (LNG, liquid nitrogen)",
    ],
    codeReferences: [
      "ASME B31.3 Table A-1 — Allowable stress listed to 538°C",
      "ASME Section II-D Table 1A — Material properties",
      "ASTM A530 — General requirements for carbon steel pipe",
      "B31.3 §323.2 — Temperature limits",
    ],
    temperatureLesson: "A106 Gr.B is rated from -29°C to 427°C for standard service. Above 427°C, carbon steel enters the creep range and is susceptible to graphitization — a degradation where the iron carbide (Fe₃C) decomposes into iron and free graphite. This weakens the steel over time (thousands of hours at temperature). Below -29°C, carbon steel undergoes a ductile-to-brittle transition — the material can shatter like glass under impact. This is why impact testing or a material upgrade is required below -29°C.",
    corrosionLesson: "Carbon steel has limited corrosion resistance. It relies on corrosion allowance (extra wall thickness) rather than inherent resistance. Corrosion rates in clean dry hydrocarbons are very low (<0.05 mm/yr), but in wet or acidic environments, rates can exceed 1 mm/yr. For sour (H₂S) service, A106 Gr.B is acceptable if hardness is controlled per NACE MR0175 (HRC ≤ 22). For Cl⁻ or acid environments, stainless or CRA is preferred.",
    costLesson: "A106 Gr.B is the lowest-cost pipe material by a significant margin. Typically: A106 Gr.B = 1.0× (baseline), A333 Gr.6 = 1.3×, A335 P11 = 2.5×, A312 TP316L = 4-5×. This cost advantage is why designers always start with carbon steel and only upgrade when the service demands it.",
    commonMistakes: [
      "Using A106 for services below -29°C without impact testing",
      "Specifying A106 for high-temperature service above 427°C",
      "Assuming carbon steel is suitable for all hydrocarbon services without checking corrosivity",
      "Not specifying 'killed' steel for hydrogen service",
    ],
    realWorldNotes: "A106 Gr.B is the most manufactured pipe specification in the world. It's available in every pipe yard, every supplier stocks it, and every welder knows how to weld it. This availability factor is a legitimate engineering consideration — choosing an exotic material that takes 16 weeks to deliver may not serve the project schedule.",
  },

  "A106 Gr.C": {
    designation: "A106 Gr.C",
    commonName: "Higher-Strength Carbon Steel Pipe",
    astmSpec: "ASTM A106/A106M — Seamless Carbon Steel Pipe for High-Temperature Service",
    materialGroup: "Carbon Steel",
    composition: "C ≤ 0.35%, Mn 0.29-1.06%, Si ≥ 0.10%. Higher carbon than Gr.B.",
    whySelected: "A106 Gr.C has higher tensile and yield strength than Gr.B (70 ksi UTS vs 60 ksi), providing higher allowable stress (S). This means thinner walls for the same pressure, which can be advantageous for heavy-wall, high-pressure applications where weight savings matter.",
    whenToUse: [
      "High-pressure services where wall thickness reduction is needed",
      "When A106 Gr.B results in very thick walls",
      "Same temperature range as Gr.B (-29°C to 427°C)",
    ],
    whenNOTToUse: [
      "When weldability is a concern (higher carbon = harder to weld)",
      "When NACE compliance is required (higher carbon makes hardness control harder)",
      "When toughness/ductility is more important than strength",
    ],
    codeReferences: [
      "ASME B31.3 Table A-1",
      "ASME Section II-D Table 1A",
    ],
    temperatureLesson: "Same temperature range as Gr.B, but the higher carbon content means weld heat-affected zones can develop harder microstructures, requiring more careful PWHT control.",
    corrosionLesson: "Similar corrosion resistance to Gr.B. The higher carbon content can slightly increase susceptibility to sensitization in certain environments.",
    costLesson: "Slightly more expensive than Gr.B (≈1.1×) due to tighter chemistry control. The cost savings from thinner walls can offset this.",
    commonMistakes: [
      "Specifying Gr.C when weldability is critical",
      "Not adjusting welding procedures for higher carbon content",
      "Using in sour service without extra hardness control",
    ],
    realWorldNotes: "Gr.C is less common than Gr.B and may have longer lead times. Many EPC companies standardize on Gr.B to simplify procurement and welding.",
  },

  "A333 Gr.6": {
    designation: "A333 Gr.6",
    commonName: "Low-Temperature Carbon Steel Pipe",
    astmSpec: "ASTM A333/A333M — Seamless and Welded Steel Pipe for Low-Temperature Service",
    materialGroup: "Carbon Steel (Low Temp)",
    composition: "C ≤ 0.30%, Mn 0.29-1.06%. Impact tested at -46°C as part of manufacturing.",
    whySelected: "A333 Gr.6 is designed specifically for low-temperature service down to -46°C. It is impact-tested at the mill to verify adequate toughness at low temperatures, eliminating the need for site-specific impact testing. This makes it the standard 'go-to' material for services between -29°C and -46°C.",
    whenToUse: [
      "Services at -29°C to -46°C",
      "Autorefrigeration scenarios (pressure letdown of LPG, propane)",
      "Winter service in extreme cold climates",
      "Any service where low-temperature excursions are possible",
    ],
    whenNOTToUse: [
      "Below -46°C (need austenitic stainless)",
      "Above 343°C (allowable stress listing ends)",
      "When corrosion resistance is needed (still carbon steel)",
    ],
    codeReferences: [
      "ASME B31.3 §323.2.2 — Low temperature requirements",
      "ASME B31.3 Table A-1",
      "ASTM A333 — impact test requirements at -46°C",
    ],
    temperatureLesson: "The key difference from A106 is the guaranteed impact toughness at -46°C. This means the ductile-to-brittle transition temperature (DBTT) has been verified to be below -46°C. Normal A106 Gr.B is not impact tested and its DBTT can vary from -10°C to -40°C depending on manufacturing — you simply don't know unless you test it.",
    corrosionLesson: "Same as A106 Gr.B — no inherent corrosion resistance advantage. Still requires corrosion allowance for wet or corrosive services.",
    costLesson: "Approximately 1.3× the cost of A106 Gr.B. The premium pays for: (a) tighter chemistry control, (b) mandatory impact testing at the mill, (c) additional documentation.",
    commonMistakes: [
      "Using A106 for services that could see temperatures below -29°C",
      "Assuming A333 Gr.6 is good for cryogenic service (it's not — only to -46°C)",
      "Not considering autorefrigeration scenarios in gas letdown",
    ],
    realWorldNotes: "Autorefrigeration is the most commonly missed low-temperature scenario. When high-pressure gas is depressured through a valve, the temperature can drop dramatically (Joule-Thomson effect). Propane at 20°C can reach -42°C at atmospheric pressure. This is why downstream piping from pressure letdown valves often needs A333 Gr.6.",
  },

  "A335 P11": {
    designation: "A335 P11",
    commonName: "1¼ Chrome – ½ Moly Alloy Steel Pipe",
    astmSpec: "ASTM A335/A335M — Seamless Ferritic Alloy-Steel Pipe for High-Temperature Service",
    materialGroup: "Chrome-Moly Alloy",
    composition: "1.00-1.50% Cr, 0.44-0.65% Mo. The chromium provides oxidation resistance; molybdenum provides creep strength.",
    whySelected: "A335 P11 maintains adequate allowable stress above 427°C where carbon steel loses strength. The chromium and molybdenum additions provide: (a) resistance to high-temperature oxidation, (b) improved creep-rupture properties, (c) resistance to hydrogen attack (HTHA) at moderately elevated temperatures.",
    whenToUse: [
      "High-temperature service 400-550°C",
      "High-pressure steam systems",
      "Hydrogen service per API 941 Nelson Curves",
      "Services where carbon steel graphitization is a concern",
    ],
    whenNOTToUse: [
      "Low-temperature service (minimum -29°C, same as CS)",
      "Corrosive/acidic environments (it's not stainless)",
      "When cost is the primary driver and CS is adequate",
    ],
    codeReferences: [
      "ASME B31.3 Table A-1 — stress to 593°C",
      "ASME Section II-D Table 1A",
      "API 941 — Nelson Curves for hydrogen service",
      "ASME B31.1 — Power piping requirements",
    ],
    temperatureLesson: "The 'creep range' begins around 370°C for carbon steel. Above this temperature, the steel slowly deforms under sustained stress (even below yield). Cr-Mo steels like P11 push this threshold higher — they maintain their creep resistance to ~550°C. The molybdenum is the key element for creep strength; chromium is primarily for oxidation resistance. Think of it as: Mo = strength at temperature, Cr = protection from hot air/steam.",
    corrosionLesson: "P11 is NOT stainless — it has only 1.25% chromium (stainless needs 10.5% minimum). Its corrosion resistance is only marginally better than carbon steel. It's selected for MECHANICAL properties at high temperature, not for corrosion resistance. For combined high-temperature AND corrosive service, stainless steel or Inconel may be needed.",
    costLesson: "Approximately 2.5× the cost of A106 Gr.B. Welding costs are also higher because P11 requires: preheat (200-300°C), controlled interpass temperature, and mandatory PWHT at 690-760°C. The total installed cost can be 3-4× carbon steel.",
    commonMistakes: [
      "Selecting P11 for corrosion resistance (it's not stainless)",
      "Inadequate preheat during welding → hydrogen cracking",
      "Skipping PWHT → excessive hardness in HAZ",
      "Not checking API 941 curves for hydrogen service suitability",
    ],
    realWorldNotes: "P11 is the workhorse of the power generation industry. Almost every high-pressure steam line in a power plant or refinery uses P11 or its cousin P22 (2¼Cr-1Mo). Welding P11 requires specialized procedures — never let a welder trained only on carbon steel weld P11 without proper WPS qualification.",
  },

  "A335 P22": {
    designation: "A335 P22",
    commonName: "2¼ Chrome – 1 Moly Alloy Steel Pipe",
    astmSpec: "ASTM A335/A335M — Seamless Ferritic Alloy-Steel Pipe for High-Temperature Service",
    materialGroup: "Chrome-Moly Alloy",
    composition: "1.90-2.60% Cr, 0.87-1.13% Mo.",
    whySelected: "A335 P22 provides higher creep strength and better hydrogen resistance than P11 due to higher Cr and Mo content. Used when P11 is marginal.",
    whenToUse: [
      "Very high-temperature steam (500-600°C)",
      "Hydrogen service at higher temperatures than P11 allows per API 941",
      "Main steam headers in power plants",
    ],
    whenNOTToUse: [
      "When P11 is adequate (P22 is more expensive)",
      "Corrosive environments (still not stainless)",
      "Low-temperature service",
    ],
    codeReferences: [
      "ASME B31.3 Table A-1",
      "API 941 — Nelson Curves",
      "ASME Section II-D Table 1A",
    ],
    temperatureLesson: "P22 pushes the creep resistance envelope further than P11 due to the additional molybdenum. For hydrogen service, the higher chromium provides better resistance to high-temperature hydrogen attack (HTHA) per API 941 Nelson Curves. The dividing line between P11 and P22 territory typically falls around 480-510°C for steam service.",
    corrosionLesson: "2.25% Cr provides slightly better oxidation resistance than P11's 1.25% Cr, but still far below stainless. Not suitable for wet corrosive environments.",
    costLesson: "Approximately 3× the cost of A106 Gr.B. Welding and PWHT costs similar to but slightly higher than P11.",
    commonMistakes: [
      "Over-specifying P22 when P11 is adequate",
      "Inadequate PWHT control — P22 requires strict temperature control",
    ],
    realWorldNotes: "P22 is commonly used in refinery reactor circuits and high-pressure boiler piping. It's the 'middle ground' between P11 and exotic alloys like P91.",
  },

  "A312 TP304L": {
    designation: "A312 TP304L",
    commonName: "304L Austenitic Stainless Steel Pipe",
    astmSpec: "ASTM A312/A312M — Seamless, Welded, and Heavily Cold Worked Austenitic SS Pipe",
    materialGroup: "Stainless Steel (Austenitic)",
    composition: "18% Cr, 8% Ni, C ≤ 0.035% ('L' = Low carbon).",
    whySelected: "304L provides excellent corrosion resistance and is suitable for cryogenic service down to -196°C without impact testing. The 'L' grade (low carbon ≤ 0.035%) prevents sensitization — a phenomenon where chromium carbides precipitate at grain boundaries during welding, leaving the grain boundaries depleted of chromium and susceptible to intergranular corrosion.",
    whenToUse: [
      "Cryogenic service (LNG, liquid nitrogen: -196°C to -46°C)",
      "Caustic/alkaline service (with stress relief for caustic cracking prevention)",
      "General chemical service where moderate corrosion resistance is needed",
      "Chloride-free corrosive environments",
    ],
    whenNOTToUse: [
      "Chloride-containing environments (susceptible to SCC above ~60°C)",
      "Services requiring molybdenum for pitting resistance (use 316L)",
      "Sour (H₂S) service unless NACE-qualified",
    ],
    codeReferences: [
      "ASME B31.3 Table A-1 — listed for cryogenic through high temp",
      "B31.3 §323.2.2 — exempt from impact testing to -196°C",
      "ASME Section II-D Table 1A",
    ],
    temperatureLesson: "304L is unique in that it maintains ductility down to -196°C (liquid nitrogen temperature) because austenitic stainless steels do not undergo the ductile-to-brittle transition that ferritic steels experience. This is because the face-centered cubic (FCC) crystal structure of austenite does not exhibit a DBTT. This makes it the standard material for cryogenic services.",
    corrosionLesson: "304L resists corrosion through its passive chromium oxide layer (18% Cr). It performs well in many environments but has a critical weakness: CHLORIDE STRESS CORROSION CRACKING (Cl-SCC). Above ~60°C, in the presence of chloride ions and tensile stress, 304L can crack catastrophically. This is why 316L (with molybdenum) is often preferred for marine or chloride-contaminated environments.",
    costLesson: "Approximately 4× the cost of A106 Gr.B. However, when you factor in the ELIMINATION of corrosion allowance (since the material doesn't corrode), the lifecycle cost can be lower than carbon steel with heavy CA.",
    commonMistakes: [
      "Using 304L in chloride-containing environments above 60°C",
      "Using standard 304 instead of 304L for welded construction (sensitization risk)",
      "Not solution-annealing after hot forming",
    ],
    realWorldNotes: "In LNG plants, 304L is used extensively for cryogenic piping. In pharmaceutical and food processing, 304L is the standard material for hygienic applications. The bright, shiny surface of stainless pipe is not just cosmetic — it's the chromium oxide passivation layer doing its job.",
  },

  "A312 TP316L": {
    designation: "A312 TP316L",
    commonName: "316L Austenitic Stainless Steel Pipe (Moly-bearing)",
    astmSpec: "ASTM A312/A312M — Seamless, Welded, and Heavily Cold Worked Austenitic SS Pipe",
    materialGroup: "Stainless Steel (Austenitic)",
    composition: "16-18% Cr, 10-14% Ni, 2-3% Mo, C ≤ 0.035%.",
    whySelected: "316L is the 'upgraded' version of 304L with 2-3% MOLYBDENUM added. Molybdenum provides: (a) superior resistance to pitting and crevice corrosion, (b) better resistance to chloride stress corrosion cracking, (c) improved performance in reducing acid environments. This makes it the standard for aggressive chemical and corrosive services.",
    whenToUse: [
      "Corrosive/sour service",
      "Chloride-containing environments",
      "Seawater/marine environments",
      "Sulfuric acid at moderate concentrations and temperatures",
      "Pharmaceutical and high-purity applications",
      "Oxygen service (with proper cleaning per CGA G-4.1)",
    ],
    whenNOTToUse: [
      "When 304L is adequate (316L is more expensive for no benefit)",
      "Very high chloride concentrations at elevated temperatures (consider duplex)",
      "Strong reducing acids (hydrochloric) — use higher alloys",
    ],
    codeReferences: [
      "ASME B31.3 Table A-1",
      "ASME Section II-D Table 1A",
      "NACE MR0175/ISO 15156 — for sour service qualification",
      "CGA G-4.1 — for oxygen service cleaning",
    ],
    temperatureLesson: "Like 304L, 316L is exempt from impact testing down to -196°C. At high temperatures, 316L maintains its allowable stress slightly better than 304L due to the molybdenum strengthening effect. Maximum recommended service temperature is ~450°C for continuous duty, though stress values are listed higher.",
    corrosionLesson: "The 2-3% molybdenum is what distinguishes 316L from 304L. Molybdenum improves the stability of the passive film, especially against chloride attack. The Pitting Resistance Equivalent Number (PREN) quantifies this: PREN = %Cr + 3.3 × %Mo + 16 × %N. For 316L: PREN ≈ 16 + 3.3 × 2.5 = 24.3. For 304L: PREN ≈ 18. Higher PREN = better pitting resistance. This is why 316L is standard for offshore and marine piping.",
    costLesson: "Approximately 5× the cost of A106 Gr.B. Molybdenum is a significant cost driver and its price can fluctuate. Despite the premium, 316L often has lower lifecycle cost in corrosive environments due to reduced maintenance, fewer replacements, and no corrosion allowance needed.",
    commonMistakes: [
      "Specifying 316L when 304L would suffice (unnecessary cost)",
      "Using 316 instead of 316L for welded construction (sensitization risk)",
      "Not requesting MTR review for NACE compliance in sour service",
      "Assuming 316L is immune to all corrosion — it's not; it has limits",
    ],
    realWorldNotes: "316L is the most common stainless steel in the chemical and pharmaceutical industries. The joke among corrosion engineers is: 'When in doubt, use 316L.' While this is oversimplified, it reflects the material's versatility. In the real world, the choice between 304L and 316L often comes down to: 'Are there chlorides?' If yes → 316L. If no → 304L.",
  },

  // ═══════════════════════════════════════════════════════════
  // FLANGE MATERIALS
  // ═══════════════════════════════════════════════════════════

  "A105": {
    designation: "A105",
    commonName: "Carbon Steel Forging (Flanges, Fittings, Valves)",
    astmSpec: "ASTM A105/A105M — Carbon Steel Forgings for Piping Applications",
    materialGroup: "Carbon Steel",
    composition: "C ≤ 0.35%, Mn 0.60-1.05%, Si 0.10-0.35%. Killed and fine-grain treated.",
    whySelected: "A105 is the standard forging specification for carbon steel flanges, valve bodies, and forged fittings. It's the forged counterpart of A106 Gr.B pipe. Used for over 80% of all flanged connections in process piping.",
    whenToUse: ["Flanges for carbon steel pipe (A106 Gr.B/C)", "Valve bodies for CS service", "Forged fittings per B16.11", "Temperature range -29°C to 427°C"],
    whenNOTToUse: ["With stainless steel pipe (galvanic corrosion)", "Above 427°C (use A182 F11/F22)", "Below -29°C without impact testing (use A350 LF2)"],
    codeReferences: ["ASME B16.5 Table 2 — Group 1.1", "ASME B31.3 §323.1"],
    temperatureLesson: "A105 has the same temperature limitations as A106 Gr.B. For flanges, an additional check is required: the P-T rating per ASME B16.5 must be verified at BOTH the design temperature (for operating) and at ambient temperature (for pressure testing). The test condition is sometimes more severe because the test pressure (1.5×P) is applied at ambient temperature.",
    corrosionLesson: "Same as A106 Gr.B — no inherent corrosion resistance.",
    costLesson: "Baseline cost for forged components. A182 F316L flanges can be 5-6× the cost of A105 flanges.",
    commonMistakes: ["Using A105 flanges on stainless pipe systems", "Not checking P-T rating at test temperature", "Mixing material groups in a joint"],
    realWorldNotes: "A105 flanges are the most stocked forged component worldwide. Delivery time: typically stock for common sizes and classes.",
  },

  "A182 F11": {
    designation: "A182 F11",
    commonName: "Chrome-Moly Forging (1¼Cr-½Mo)",
    astmSpec: "ASTM A182/A182M — Forged or Rolled Alloy and Stainless Steel Pipe Flanges",
    materialGroup: "Chrome-Moly Alloy",
    composition: "1.00-1.50% Cr, 0.44-0.65% Mo.",
    whySelected: "A182 F11 is the forged counterpart of A335 P11 pipe. It provides the same high-temperature creep strength and hydrogen resistance in forged form for flanges and valve bodies.",
    whenToUse: ["Flanges matching A335 P11 pipe", "High-temperature steam service", "Hydrogen service per API 941"],
    whenNOTToUse: ["When A105 is adequate (temperature below 427°C)", "Corrosive environments"],
    codeReferences: ["ASME B16.5 Table 2 — Group 1.9/1.10", "ASME B31.3 §323.1"],
    temperatureLesson: "The B16.5 P-T ratings for Group 1.9/1.10 (Cr-Mo) are generally HIGHER than Group 1.1 (CS) at elevated temperatures, reflecting the better high-temperature properties of the alloy.",
    corrosionLesson: "Same as A335 P11 — not stainless, limited corrosion resistance.",
    costLesson: "Approximately 3× A105 cost.",
    commonMistakes: ["Not matching flange material group to pipe material", "Insufficient PWHT on flange welds"],
    realWorldNotes: "F11 flanges require careful handling during welding — preheat and PWHT are mandatory. The weld-neck-to-pipe weld is the critical joint.",
  },

  "A182 F316L": {
    designation: "A182 F316L",
    commonName: "316L Stainless Steel Forging",
    astmSpec: "ASTM A182/A182M — Forged or Rolled Alloy and Stainless Steel Pipe Flanges",
    materialGroup: "Stainless Steel",
    composition: "16-18% Cr, 10-14% Ni, 2-3% Mo, C ≤ 0.035%.",
    whySelected: "A182 F316L is the forged counterpart of A312 TP316L pipe. Provides corrosion resistance in flanged connections for corrosive/chemical/offshore services.",
    whenToUse: ["Flanges matching A312 TP316L pipe", "Corrosive/chemical service", "Marine/offshore environments", "Cryogenic service"],
    whenNOTToUse: ["With carbon steel pipe (over-specification)", "When A105 is adequate"],
    codeReferences: ["ASME B16.5 Table 2 — Group 2.3", "B31.3 §323.1"],
    temperatureLesson: "B16.5 Group 2.3 P-T ratings apply. The ratings are LOWER than Group 1.1 (CS) at ambient temperature because the yield strength of austenitic SS is lower than CS at room temperature. However, at elevated temperatures, the gap narrows because SS retains its strength better.",
    corrosionLesson: "Same as A312 TP316L — excellent resistance due to Cr + Mo.",
    costLesson: "5-6× the cost of A105.",
    commonMistakes: ["Using Group 1.1 P-T ratings instead of Group 2.3 for 316L flanges", "Not verifying NACE compliance for sour service"],
    realWorldNotes: "Common in offshore platforms, chemical plants, and pharmaceutical facilities. Always verify the material group when checking flange class ratings.",
  },

  // ═══════════════════════════════════════════════════════════
  // BOLT MATERIALS
  // ═══════════════════════════════════════════════════════════

  "A193 B7 / A194 2H": {
    designation: "A193 B7 / A194 2H",
    commonName: "Standard Chrome-Moly Stud Bolt Set",
    astmSpec: "ASTM A193 (bolts) / ASTM A194 (nuts)",
    materialGroup: "Alloy Steel Bolting",
    composition: "B7: AISI 4140/4142 (Cr-Mo), quenched and tempered. 2H: carbon steel, heavy hex.",
    whySelected: "A193 B7 / A194 2H is the standard bolt/nut combination for flanged connections in process piping. B7 is a quenched-and-tempered alloy steel with high tensile strength (125 ksi min UTS), providing the clamping force needed to seal flanged joints.",
    whenToUse: ["Standard process piping flanges", "Temperature range -40°C to 427°C", "Non-sour service"],
    whenNOTToUse: ["Sour (H₂S) service — hardness exceeds NACE limit (HRC 22)", "Below -40°C (use B7 with impact test or L7)", "Stainless steel flange systems (consider B8)"],
    codeReferences: ["ASME B16.5 Table 6 — acceptable bolting", "NACE MR0175/ISO 15156 — NOT compliant as-supplied"],
    temperatureLesson: "B7 bolts lose strength above 427°C. The stud bolt is the most highly stressed component in a flanged joint — it must maintain clamping force over the entire service life. At high temperature, bolt relaxation (creep of the bolt) reduces clamping force over time, which can lead to gasket leaks. This is why proper bolt tensioning and retorquing procedures are critical.",
    corrosionLesson: "B7 is alloy steel, not stainless. In marine environments, corrosion of bolt threads can make disassembly impossible. Consider PTFE-coated or hot-dip galvanized bolts for corrosive atmospheres. For the fastener body, B7 is adequate since the flange protects it from process fluid.",
    costLesson: "Baseline cost for process piping bolting. B7M adds ~20% for extra tempering.",
    commonMistakes: [
      "Using B7 in sour service (SSC failure risk — HRC up to 35)",
      "Under-torquing (gasket doesn't seal) or over-torquing (bolt yield/gasket crush)",
      "Not lubricating bolt threads during installation (incorrect achieved load)",
      "Reusing bolts that have been in high-temperature service (relaxation damage)",
    ],
    realWorldNotes: "A193 B7 bolt failure in sour service has caused multiple industry incidents. The bolt cracks without warning, the flange leaks H₂S, and people die. This is why NACE compliance is not optional — it's a life-safety requirement.",
  },

  "A193 B7M / A194 2HM": {
    designation: "A193 B7M / A194 2HM",
    commonName: "NACE-Compliant Sour Service Bolt Set",
    astmSpec: "ASTM A193 (bolts) / ASTM A194 (nuts)",
    materialGroup: "Alloy Steel Bolting (Sour Service)",
    composition: "Same base alloy as B7, but tempered to lower hardness: HRC ≤ 22 (HB ≤ 237).",
    whySelected: "B7M is B7 tempered to a lower hardness to comply with NACE MR0175 for sulfide stress cracking resistance. The 'M' stands for Modified — the extra tempering reduces hardness below HRC 22 at the cost of some tensile strength (100 ksi vs 125 ksi for B7).",
    whenToUse: ["Any service containing H₂S (sour service)", "NACE MR0175/ISO 15156 compliant systems", "When bolt hardness must be controlled"],
    whenNOTToUse: ["Non-sour service where B7 is adequate (B7M has lower strength)", "Very high-pressure services where the lower strength requires larger bolts"],
    codeReferences: ["NACE MR0175/ISO 15156 Part 2", "ASME B16.5 Table 6"],
    temperatureLesson: "B7M has the same temperature range as B7 but with 20% lower tensile strength due to the extra tempering. This means for the same bolt size, B7M provides less clamping force. In some high-pressure applications, this may require stepping up to the next bolt size.",
    corrosionLesson: "The lower hardness makes B7M resistant to sulfide stress cracking (SSC). SSC is a form of hydrogen embrittlement specific to H₂S environments — the harder the steel, the more susceptible. By controlling hardness ≤ HRC 22, B7M avoids the microstructural conditions that promote SSC.",
    costLesson: "~1.2× the cost of standard B7. The cost of the extra tempering is trivial compared to the safety benefit.",
    commonMistakes: [
      "Mixing B7 and B7M bolts in a sour service system",
      "Not verifying hardness on the MTR (Material Test Report)",
      "Assuming all B7 bolts are NACE-compliant (they are NOT)",
    ],
    realWorldNotes: "Every sour service bolt should have its hardness verified on the MTR. In the field, hardness testing of installed bolts may be required as part of QA/QC. The difference between B7 and B7M can be life or death.",
  },
};

/**
 * Get a material lesson by designation
 */
export function getMaterialLesson(designation: string): MaterialLesson | null {
  return MATERIAL_LESSONS[designation] || null;
}

/**
 * Get all material lessons for a given material group
 */
export function getMaterialLessonsByGroup(group: string): MaterialLesson[] {
  return Object.values(MATERIAL_LESSONS).filter(m => 
    m.materialGroup.toLowerCase().includes(group.toLowerCase())
  );
}
