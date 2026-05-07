/**
 * PMS Word (.docx) Export
 * Generates a professional PIP-format Piping Material Specification document.
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  HeadingLevel, PageNumber, PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import type { PipingMaterialSpec, PMSMaterialRow } from "./pmsEngine";
import { BRANCH_LEGEND } from "./pmsEngine";
import { DATASET_RELEASE_ATTESTATION_LINES } from "@/lib/appVersion";

// ── Constants ──
const PAGE_WIDTH = 15840; // Letter landscape
const PAGE_HEIGHT = 12240;
const MARGIN = 720; // 0.5 inch
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 14400

const BORDER_THIN = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const BORDERS_ALL = { top: BORDER_THIN, bottom: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN };
const HEADER_FILL = { fill: "1a365d", type: ShadingType.CLEAR, color: "auto" };
const SUBHEADER_FILL = { fill: "e2e8f0", type: ShadingType.CLEAR, color: "auto" };

function cell(text: string, width: number, opts?: { bold?: boolean; shading?: typeof HEADER_FILL; alignment?: typeof AlignmentType.CENTER; color?: string; fontSize?: number }): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: BORDERS_ALL,
    shading: opts?.shading,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({
      alignment: opts?.alignment,
      children: [new TextRun({
        text,
        bold: opts?.bold,
        font: "Arial",
        size: opts?.fontSize ?? 16,
        color: opts?.color,
      })],
    })],
  });
}

function headerCell(text: string, width: number): TableCell {
  return cell(text, width, { bold: true, shading: HEADER_FILL, color: "FFFFFF", alignment: AlignmentType.CENTER });
}

function labelCell(text: string, width: number): TableCell {
  return cell(text, width, { bold: true, shading: SUBHEADER_FILL });
}

function categoryRow(title: string, cols: number): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        columnSpan: cols,
        borders: BORDERS_ALL,
        shading: { fill: "2d3748", type: ShadingType.CLEAR, color: "auto" },
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        children: [new Paragraph({
          children: [new TextRun({ text: title, bold: true, font: "Arial", size: 16, color: "FFFFFF" })],
        })],
      }),
    ],
  });
}

function categorizeMaterialRows(rows: PMSMaterialRow[]) {
  const cats: Record<string, PMSMaterialRow[]> = {
    pipe: [], nipple: [], "fitting-sb": [], "fitting-lb": [],
    valve: [], flange: [], gasket: [], bolting: [],
  };
  for (const r of rows) cats[r.category]?.push(r);
  return cats;
}

// ── Material table columns ──
const MAT_COLS = [
  { header: "ITEM", width: 3000 },
  { header: "NOTES", width: 1400 },
  { header: "NPS", width: 2400 },
  { header: "SCH/RAT", width: 1800 },
  { header: "ENDS", width: 2200 },
  { header: "DESCRIPTION", width: 3600 },
];

function materialTableHeader(): TableRow {
  return new TableRow({
    tableHeader: true,
    children: MAT_COLS.map(c => headerCell(c.header, c.width)),
  });
}

function materialRow(r: PMSMaterialRow): TableRow {
  const schRat = ["valve", "flange", "gasket", "bolting"].includes(r.category) ? r.rating : r.schedule;
  const desc = r.category === "valve" && r.valveBody
    ? `${r.grade} / ${r.valveTrim} / ${r.valveSeat}`
    : r.grade;
  return new TableRow({
    children: [
      cell(r.component, MAT_COLS[0].width),
      cell(r.notes !== "-" ? r.notes : "", MAT_COLS[1].width),
      cell(r.size, MAT_COLS[2].width),
      cell(schRat, MAT_COLS[3].width),
      cell(r.endConnection, MAT_COLS[4].width),
      cell(desc, MAT_COLS[5].width),
    ],
  });
}

function buildMaterialSection(title: string, rows: PMSMaterialRow[]): TableRow[] {
  const result: TableRow[] = [categoryRow(title, 6)];
  if (rows.length === 0) {
    result.push(new TableRow({
      children: [
        new TableCell({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnSpan: 6,
          borders: BORDERS_ALL,
          margins: { top: 40, bottom: 40, left: 80, right: 80 },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Not used in this class", font: "Arial", size: 16, italics: true, color: "888888" })],
          })],
        }),
      ],
    }));
  } else {
    rows.forEach(r => result.push(materialRow(r)));
  }
  return result;
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: "1a365d" })],
  });
}

// ════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════

export async function exportPMSToWord(pms: PipingMaterialSpec) {
  const db = pms.designBasis;
  const cats = categorizeMaterialRows(pms.materialTable);
  const revLabel = db.date || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // ── Design Basis Table ──
  const basisPairs: [string, string][] = [
    ["SPEC NUMBER", db.specNumber], ["DESIGN CODE", db.designCode],
    ["SERVICE", db.serviceType], ["MATERIAL", db.materialGroup],
    ["RATING CLASS", `${db.flangeRating}, ${pms.ptRatingBlock?.standard || "ASME B16.5"}`], ["FLUID PHASE", db.fluidPhase],
    ["DESIGN PRESSURE", db.designPressure], ["DESIGN TEMPERATURE", db.designTemperature],
    ["TEST PRESSURE", db.testPressure], ["TEST MEDIUM", db.testMedium],
    ["CORROSION ALLOWANCE", db.corrosionAllowance], ["STRESS RELIEF", `Per ${db.designCode}`],
  ];

  const basisRows: TableRow[] = [];
  for (let i = 0; i < basisPairs.length; i += 2) {
    basisRows.push(new TableRow({
      children: [
        labelCell(basisPairs[i][0] + ":", 2600),
        cell(basisPairs[i][1], 4600),
        labelCell(basisPairs[i + 1][0] + ":", 2600),
        cell(basisPairs[i + 1][1], 4600),
      ],
    }));
  }

  const basisTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [2600, 4600, 2600, 4600],
    rows: basisRows,
  });

  // ── P-T Rating Table ──
  const ptChildren: (Paragraph | Table)[] = [];
  if (pms.ptRatingBlock && pms.ptRatingBlock.ratings.length > 0) {
    ptChildren.push(sectionHeading("PRESSURE\u2013TEMPERATURE RATING"));
    ptChildren.push(new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: pms.ptRatingBlock.note, font: "Arial", size: 16, italics: true })],
    }));
    const ptColWidth = Math.floor(CONTENT_WIDTH / (pms.ptRatingBlock.ratings.length + 1));
    ptChildren.push(new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: Array(pms.ptRatingBlock.ratings.length + 1).fill(ptColWidth),
      rows: [
        new TableRow({
          children: [
            headerCell("Temp (\u00B0C)", ptColWidth),
            ...pms.ptRatingBlock.ratings.map(r => headerCell(String(r.tempC), ptColWidth)),
          ],
        }),
        new TableRow({
          children: [
            labelCell("P (bar)", ptColWidth),
            ...pms.ptRatingBlock.ratings.map(r => cell(r.pressureBar.toFixed(1), ptColWidth, { alignment: AlignmentType.CENTER })),
          ],
        }),
      ],
    }));
  }

  // ── Material Tables ──
  const matTable1 = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: MAT_COLS.map(c => c.width),
    rows: [
      materialTableHeader(),
      ...buildMaterialSection("PIPE", cats.pipe),
      ...buildMaterialSection("NIPPLES", cats.nipple),
      ...buildMaterialSection("FITTINGS \u2014 SMALL BORE (\u2264 2\u2033)", cats["fitting-sb"]),
      ...buildMaterialSection("FITTINGS \u2014 LARGE BORE (> 2\u2033)", cats["fitting-lb"]),
    ],
  });

  const matTable2 = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: MAT_COLS.map(c => c.width),
    rows: [
      materialTableHeader(),
      ...buildMaterialSection("VALVES", cats.valve),
      ...buildMaterialSection("FLANGES", cats.flange),
      ...buildMaterialSection("GASKETS", cats.gasket),
      ...buildMaterialSection("BOLTING", cats.bolting),
    ],
  });

  // ── Branch Matrix ──
  const bm = pms.branchMatrix;
  const bmColW = Math.floor(CONTENT_WIDTH / (bm.headerSizes.length + 1));
  const bmRows: TableRow[] = [
    new TableRow({
      children: [
        headerCell("BRANCH \\ HEADER", bmColW),
        ...bm.headerSizes.map(h => headerCell(h, bmColW)),
      ],
    }),
  ];
  bm.branchSizes.forEach((branch, bi) => {
    bmRows.push(new TableRow({
      children: [
        labelCell(branch, bmColW),
        ...bm.grid[bi].map(code => cell(code || "\u2014", bmColW, {
          alignment: AlignmentType.CENTER,
          bold: !!code,
          color: code === "T" ? "16a34a" : code === "W" ? "2563eb" : code === "S" ? "9333ea" : code === "R" ? "ea580c" : "999999",
        })),
      ],
    }));
  });

  const branchTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: Array(bm.headerSizes.length + 1).fill(bmColW),
    rows: bmRows,
  });

  // ── Notes ──
  const noteParagraphs = pms.notes.map(n => new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${String(n.id).padStart(2, "0")}  `, bold: true, font: "Arial", size: 16 }),
      new TextRun({ text: n.text, font: "Arial", size: 16 }),
      new TextRun({ text: `  [${n.reference}]`, font: "Arial", size: 14, italics: true, color: "666666" }),
    ],
  }));

  // ── References Table ──
  const refColWidths = [3000, 7400, 4000];
  const refTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: refColWidths,
    rows: [
      new TableRow({ children: [headerCell("Standard", 3000), headerCell("Title", 7400), headerCell("Applied To", 4000)] }),
      ...pms.references.map(r => new TableRow({
        children: [
          cell(r.standard, 3000, { bold: true }),
          cell(r.title, 7400),
          cell(r.appliedTo, 4000),
        ],
      })),
    ],
  });

  // ── Continuity Table ──
  const contColWidths = [3000, 4000, 2400, 5000];
  const contTable = new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: contColWidths,
    rows: [
      new TableRow({ children: [headerCell("Component", 3000), headerCell("Material", 4000), headerCell("Status", 2400), headerCell("Note", 5000)] }),
      ...pms.materialContinuity.map(c => new TableRow({
        children: [
          cell(c.component, 3000),
          cell(c.material, 4000),
          cell(c.compatible ? "\u2713 OK" : "\u26A0 Review", 2400, { bold: true, color: c.compatible ? "16a34a" : "dc2626", alignment: AlignmentType.CENTER }),
          cell(c.note, 5000),
        ],
      })),
    ],
  });

  // ── Build Document ──
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 18 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: "1a365d" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 22, bold: true, font: "Arial", color: "2d3748" },
          paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: undefined },
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `${db.specNumber}  \u2014  Rev ${db.revision}`, font: "Arial", size: 14, color: "666666" }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: DATASET_RELEASE_ATTESTATION_LINES.join(" | "), font: "Arial", size: 12, color: "777777", italics: true }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Piping Material Specification  \u2014  Page ", font: "Arial", size: 14, color: "999999" }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 14, color: "999999" }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "PIPING MATERIAL SPECIFICATION", bold: true, font: "Arial", size: 32, color: "1a365d" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({ text: `${db.specNumber}  \u2014  ${db.specName}`, font: "Arial", size: 20, color: "4a5568" }),
            new TextRun({ text: `    Rev ${db.revision} \u2014 ${revLabel}`, font: "Arial", size: 16, color: "888888" }),
          ],
        }),

        // Section 1
        sectionHeading("SECTION 1 \u2014 DESIGN BASIS"),
        basisTable,
        ...ptChildren,

        // Section 2 - Materials (Page 1)
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("SECTION 2 \u2014 MATERIALS (Pipe, Nipples, Fittings)"),
        matTable1,

        // Materials (Page 2)
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("SECTION 2 (cont.) \u2014 MATERIALS (Valves, Flanges, Gaskets, Bolting)"),
        matTable2,

        // Section 3 - Branch + Notes
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("SECTION 3 \u2014 90\u00B0 BRANCH CONNECTION TABLE"),
        branchTable,
        new Paragraph({ spacing: { before: 120, after: 60 }, children: [] }),
        ...BRANCH_LEGEND.map(l => new Paragraph({
          spacing: { after: 30 },
          children: [
            new TextRun({ text: `${l.code}`, bold: true, font: "Arial", size: 16 }),
            new TextRun({ text: ` \u2014 ${l.label}`, font: "Arial", size: 16 }),
          ],
        })),

        sectionHeading("NOTES"),
        ...noteParagraphs,

        // Section 4 - References + Continuity
        new Paragraph({ children: [new PageBreak()] }),
        sectionHeading("SECTION 4 \u2014 APPLICABLE STANDARDS & REFERENCES"),
        refTable,
        new Paragraph({ spacing: { before: 200 }, children: [] }),
        sectionHeading("MATERIAL CONTINUITY CHECK"),
        contTable,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${db.specNumber}_Rev${db.revision}.docx`);
}
