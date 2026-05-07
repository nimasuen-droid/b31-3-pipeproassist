# Engineering Data Governance

Reference data is treated as controlled engineering input, not ordinary UI content.

## Release attestation

Each released bundled dataset package must carry this exact attestation:

```text
Released by PipePro B31.3 Design Assistant
Dataset Integrity Verified
Version 1.0
```

This attestation confirms release-package integrity for the bundled dataset. It does not approve project use of the dataset, certify engineering outputs, or replace responsible engineering review.

## Source intake

Every imported or modified dataset must record:

- Standard and edition/revision.
- Table/paragraph reference.
- Source owner or publisher.
- Import date.
- Reviewer name.
- Change reason.
- Known scope limits.

## Review workflow

1. Import data into the Dataset Manager.
2. Confirm parser validation passes with no duplicate keys, unsupported classes, negative dimensions, or missing required columns.
3. Add or update regression fixtures in `src/test`.
4. Compare representative rows against independent hand checks.
5. Update `DATASET_VERSION` and release notes.
6. Keep a changelog entry with the dataset source and affected modules.

## Required benchmark coverage

- ASME B31.3 straight pipe internal pressure equation.
- ASME B36.10M carbon steel NPS/schedule dimensions.
- ASME B36.19M stainless S-schedule dimensions.
- ASME B16.5 pressure-temperature class selection.
- ASME Sec II-D allowable stress lookup.
- Bolting and gasket fixture lookup.
- PMS generated material table categories, references, notes, and traceability.

## Sign-off

This app does not implement a checker sign-off workflow. Release sign-off is a project governance activity outside the app and must be documented in the release issue.
