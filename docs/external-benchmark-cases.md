# External Benchmark Cases

Benchmark cases are independent release evidence for PipePro B31.3 Design Assistant. They should be checked against licensed standards, client specifications, or independently prepared engineering calculation sheets before a production release.

## Current automated benchmark coverage

The repository currently automates benchmark/regression coverage in `src/test/engineering-data-validation.test.ts` and `src/test/engineering-workflows.test.ts`.

| Area | Automated Evidence | Production expectation |
| --- | --- | --- |
| ASME B31.3 wall thickness | SI/Imperial straight-pipe pressure thickness agreement and invalid-input fail-closed tests | Add independently signed hand calculations for representative low, medium, and high pressure cases |
| ASME B36.10M | NPS/schedule dimensional integrity and fixed NPS 6 Sch 40 fixture | Add licensed-table spot checks for NPS 0.5, 1, 1.5, 2, 6, 8, 10, 12, 16, 18, and 24 |
| ASME B36.19M | Stainless S-schedule dimensional integrity and fixed NPS 6 40S/80S fixture | Add licensed-table spot checks for stainless utility and corrosive-service cases |
| ASME B16.5 | Group 1.1 P-T class fixture and Class 400 exclusion | Add independent flange class worksheets for Class 150, 300, 600, 900, 1500, and 2500 boundaries |
| ASME Sec II-D | A106 Gr.B stress fixture values and monotonic stress curves | Add independent stress lookups for every shipped material family |
| Bolting/gasket | Referenced bolting lookup and fail-closed unsupported combinations | Add B16.5 Table E-1 and gasket standard checks for supported class/NPS combinations |
| Fittings/branches | PMS material categories and branch matrix regression | Add independently reviewed T/R/W/S branch examples |
| Valves | Service-driven body/trim/seat/packing and material continuity tests | Add valve datasheet review cases for hydrocarbon, sour, oxygen, cryogenic, high-temperature, and instrument-air services |
| PMS/reports | PMS schedule alignment, traceability, disclaimer, and report wording tests | Add signed sample PMS package review before release |

## Required release matrix

For each release, run or record benchmark cases for:

- Service classifications and design conditions across NPS 0.5, 1, 1.5, 2, 6, 8, 10, 12, 16, 18, and 24.
- Wall thickness required thickness.
- Pipe Schedule recommended schedule.
- PMS selected schedule.
- Flange/fitting selection.
- Bolting/gasket selection.
- Valve datasheet material continuity.
- Report source references and release attestation.

## Acceptance criteria

- PMS selected schedule is never below the calculated Pipe Schedule requirement.
- Stainless schedules use B36.19M S-schedules where applicable.
- Carbon/alloy schedules use B36.10M where applicable.
- Missing benchmark data fails closed and creates a review warning.
- Release evidence includes the attestation:

```text
Released by PipePro B31.3 Design Assistant
Dataset Integrity Verified
Version 1.0
```

The attestation confirms dataset package integrity only. It is not project engineering approval.
