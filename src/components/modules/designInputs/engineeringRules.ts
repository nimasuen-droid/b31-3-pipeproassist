export type RuleBasis = "code" | "standard-table" | "industry-practice" | "project-default";

export interface EngineeringRule<T> {
  id: string;
  value: T;
  basis: RuleBasis;
  reference: string;
  note: string;
}

export const PIPE_PRESSURE_DESIGN_RULES = {
  yCoefficientFerrousBelowCreep: {
    id: "b313-y-ferrous-default",
    value: 0.4,
    basis: "code",
    reference: "ASME B31.3 Table 304.1.1",
    note: "Default Y coefficient used for common ferrous materials below creep range. User/project data should override when the governing table requires another value.",
  },
  standardPipeMillTolerancePercent: {
    id: "astm-a530-wall-tolerance",
    value: 12.5,
    basis: "standard-table",
    reference: "ASTM A530 §10; ASME B31.3 §304.1.1",
    note: "Common negative wall-thickness tolerance for ASTM carbon/alloy pipe. Confirm against the purchased pipe specification.",
  },
} satisfies Record<string, EngineeringRule<number>>;

export const TEST_PRESSURE_RULES = {
  hydrostaticFactor: {
    id: "b313-hydrostatic-test-factor",
    value: 1.5,
    basis: "code",
    reference: "ASME B31.3 §345.4.2(a)",
    note: "Minimum hydrostatic leak test pressure factor before stress-ratio and component-rating checks.",
  },
  pneumaticFactor: {
    id: "b313-pneumatic-test-factor",
    value: 1.1,
    basis: "code",
    reference: "ASME B31.3 §345.5.4",
    note: "Minimum pneumatic leak test pressure factor; pneumatic testing has additional stored-energy safety requirements.",
  },
} satisfies Record<string, EngineeringRule<number>>;

export const PMS_PRACTICE_RULES = {
  smallBoreMinimumScheduleB3610: {
    id: "pms-small-bore-min-sch80",
    value: "80",
    basis: "project-default",
    reference: "Project/PIP-style material control practice; verify against client PMS",
    note: "Small bore Sch 80 minimum is a robustness/material-control default, not a prescriptive ASME B31.3 minimum.",
  },
  smallBoreMinimumScheduleB3619: {
    id: "pms-small-bore-min-sch80s",
    value: "80S",
    basis: "project-default",
    reference: "Project/PIP-style material control practice; ASME B36.19M dimensions",
    note: "Stainless small bore uses B36.19M S-schedules when this project default is applied.",
  },
  mediumBoreDefaultScheduleB3610: {
    id: "pms-medium-bore-default-sch40",
    value: "40",
    basis: "project-default",
    reference: "Project/PIP-style material control practice; verify against client PMS",
    note: "Default process-piping schedule used only after B31.3 thickness validation.",
  },
  mediumBoreDefaultScheduleB3619: {
    id: "pms-medium-bore-default-sch40s",
    value: "40S",
    basis: "project-default",
    reference: "Project/PIP-style material control practice; ASME B36.19M dimensions",
    note: "Default stainless process-piping schedule used only after B31.3 thickness validation.",
  },
  largeBoreDefaultScheduleB3610: {
    id: "pms-large-bore-default-sch40",
    value: "40",
    basis: "project-default",
    reference: "Project/PIP-style material control practice; verify against client PMS",
    note: "Large-bore default may be client-specific and is always validated against calculated t_min.",
  },
  largeBoreDefaultScheduleB3619: {
    id: "pms-large-bore-default-sch10s",
    value: "10S",
    basis: "project-default",
    reference: "Project/PIP-style material control practice; ASME B36.19M dimensions",
    note: "Large-bore stainless default keeps B36.19M S-schedule family and is validated against calculated t_min.",
  },
} satisfies Record<string, EngineeringRule<string>>;

