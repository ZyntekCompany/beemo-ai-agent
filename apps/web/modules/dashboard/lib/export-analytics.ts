import * as XLSX from "xlsx-js-style";

type TimeSeriesData = {
  date: string;
  dateFull: string;
  total: number;
  resolved: number;
  unresolved: number;
  escalated: number;
};

type StatusDistribution = {
  name: string;
  value: number;
  color: string;
};

type KPIs = {
  totalConversations: number;
  unresolved: number;
  resolved: number;
  escalated: number;
  resolutionRate: number;
  totalContacts: number;
  activeContacts: number;
  whatsappConversations: number;
  widgetConversations: number;
};

type AnalyticsData = {
  kpis: KPIs;
  timeSeriesData: TimeSeriesData[];
  statusDistribution: StatusDistribution[];
};

/** =========================
 *  THEME + HELPERS (REUSABLE)
 *  ========================= */
const THEME = {
  text: "111827",
  muted: "6B7280",
  border: "E5E7EB",

  primary: "2563EB",
  primaryDark: "1E40AF",

  grayHeader: "4B5563",
  graySection: "F3F4F6",

  purple: "7C3AED",
  purpleDark: "6D28D9",

  zebraA: "FFFFFF",
  zebraB: "F9FAFB",

  totalFill: "FEF3C7",
  totalBorder: "F59E0B",
};

type CellStyle = any;

const bordersThin = (rgb = THEME.border) => ({
  top: { style: "thin", color: { rgb } },
  bottom: { style: "thin", color: { rgb } },
  left: { style: "thin", color: { rgb } },
  right: { style: "thin", color: { rgb } },
});

function setCellStyle(ws: XLSX.WorkSheet, r: number, c: number, style: CellStyle) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = ws[addr];
  if (!cell) return;
  cell.s = style;
}

function setCellFormat(ws: XLSX.WorkSheet, r: number, c: number, format: string) {
  const addr = XLSX.utils.encode_cell({ r, c });
  const cell = ws[addr];
  if (!cell) return;
  cell.z = format;
}

function safeDecodeRange(ws: XLSX.WorkSheet) {
  return XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
}

/**
 * Aplica estilo a un rango rectangular (incluye encabezado opcional)
 */
function styleTable(
  ws: XLSX.WorkSheet,
  opts: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
    headerRow?: number; // por defecto startRow
    headerFillRgb?: string;
    headerFontRgb?: string;
    zebra?: boolean;
    zebraA?: string;
    zebraB?: string;
    alignHeader?: "center" | "left";
    alignBody?: "center" | "left" | "right";
  }
) {
  const {
    startRow,
    startCol,
    endRow,
    endCol,
    headerRow = startRow,
    headerFillRgb = THEME.primary,
    headerFontRgb = "FFFFFF",
    zebra = true,
    zebraA = THEME.zebraA,
    zebraB = THEME.zebraB,
    alignHeader = "center",
    alignBody = "center",
  } = opts;

  for (let R = startRow; R <= endRow; R++) {
    for (let C = startCol; C <= endCol; C++) {
      const isHeader = R === headerRow;

      if (isHeader) {
        setCellStyle(ws, R, C, {
          font: { bold: true, sz: 11, color: { rgb: headerFontRgb } },
          fill: { fgColor: { rgb: headerFillRgb } },
          alignment: { horizontal: alignHeader, vertical: "center" },
          border: bordersThin(headerFillRgb === THEME.primary ? THEME.primaryDark : THEME.border),
        });
      } else {
        const fillRgb = zebra ? (R % 2 === 0 ? zebraB : zebraA) : zebraA;
        setCellStyle(ws, R, C, {
          font: { color: { rgb: THEME.text } },
          fill: { fgColor: { rgb: fillRgb } },
          alignment: { horizontal: alignBody, vertical: "center", wrapText: true },
          border: bordersThin(THEME.border),
        });
      }
    }
  }
}

function styleTitleRow(
  ws: XLSX.WorkSheet,
  row: number,
  startCol: number,
  endCol: number,
  fillRgb = THEME.primary,
  fontSize = 16
) {
  for (let C = startCol; C <= endCol; C++) {
    setCellStyle(ws, row, C, {
      font: { bold: true, sz: fontSize, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: fillRgb } },
      alignment: { horizontal: "center", vertical: "center" },
    });
  }
}

function styleSectionRow(ws: XLSX.WorkSheet, row: number, startCol: number, endCol: number) {
  for (let C = startCol; C <= endCol; C++) {
    setCellStyle(ws, row, C, {
      font: { bold: true, sz: 12, color: { rgb: THEME.text } },
      fill: { fgColor: { rgb: THEME.graySection } },
      alignment: { horizontal: "left", vertical: "center" },
    });
  }
}

function styleTotalRow(ws: XLSX.WorkSheet, row: number, startCol: number, endCol: number) {
  for (let C = startCol; C <= endCol; C++) {
    setCellStyle(ws, row, C, {
      font: { bold: true, sz: 11, color: { rgb: THEME.text } },
      fill: { fgColor: { rgb: THEME.totalFill } },
      alignment: { horizontal: C === startCol ? "left" : "center", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: THEME.totalBorder } },
        bottom: { style: "medium", color: { rgb: THEME.totalBorder } },
        left: { style: "thin", color: { rgb: THEME.totalBorder } },
        right: { style: "thin", color: { rgb: THEME.totalBorder } },
      },
    });
  }
}

function addAutoFilter(ws: XLSX.WorkSheet, r0: number, c0: number, r1: number, c1: number) {
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: r0, c: c0 }, e: { r: r1, c: c1 } }) };
}

/**
 * Congelar filas/columnas (soportado por xlsx-js-style)
 */
function freeze(ws: XLSX.WorkSheet, ySplit: number, xSplit = 0) {
  (ws as any)["!freeze"] = {
    xSplit,
    ySplit,
    topLeftCell: XLSX.utils.encode_cell({ r: ySplit, c: xSplit }),
    activePane: "bottomRight",
    state: "frozen",
  };
}

/** =========================
 *  EXPORT
 *  ========================= */
export function exportAnalyticsToExcel(data: AnalyticsData, organizationName?: string) {
  const workbook = XLSX.utils.book_new();
  const exportDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /** =========================
   *  SHEET 1: SUMMARY
   *  ========================= */
  const summaryData = [
    ["📊 REPORTE DE ANALÍTICAS"],
    ["Generado:", exportDate],
    ["Organización:", organizationName || "N/A"],
    [],
    ["📈 INDICADORES CLAVE DE RENDIMIENTO"],
    [],
    ["Métrica", "Valor", "Descripción"],
    ["Total Conversaciones", data.kpis.totalConversations, "Todas las conversaciones registradas"],
    ["✅ Resueltas", data.kpis.resolved, "Conversaciones resueltas exitosamente"],
    ["⏳ Pendientes", data.kpis.unresolved, "Conversaciones sin resolver"],
    ["⚠️ Escaladas", data.kpis.escalated, "Conversaciones escaladas a agentes humanos"],
    ["Tasa de Resolución", data.kpis.resolutionRate / 100, "Porcentaje de conversaciones resueltas"],
    [],
    ["💬 CONVERSACIONES POR CANAL"],
    [],
    ["Canal", "Cantidad", "Porcentaje"],
    [
      "WhatsApp",
      data.kpis.whatsappConversations,
      data.kpis.totalConversations > 0
        ? data.kpis.whatsappConversations / data.kpis.totalConversations
        : 0,
    ],
    [
      "Widget",
      data.kpis.widgetConversations,
      data.kpis.totalConversations > 0 ? data.kpis.widgetConversations / data.kpis.totalConversations : 0,
    ],
    [],
    ["👥 CONTACTOS"],
    [],
    ["Métrica", "Valor"],
    ["Total Contactos", data.kpis.totalContacts],
    ["Contactos Activos", data.kpis.activeContacts],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Columnas + filas (más “pro”)
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 18 }, { wch: 52 }];
  summarySheet["!rows"] = [
    { hpt: 28 }, // title
    { hpt: 18 },
    { hpt: 18 },
    { hpt: 10 },
    { hpt: 20 }, // section
  ];

  // Merges
  summarySheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 2 } },
    { s: { r: 13, c: 0 }, e: { r: 13, c: 2 } },
    { s: { r: 19, c: 0 }, e: { r: 19, c: 2 } },
  ];

  // Estilos principales
  styleTitleRow(summarySheet, 0, 0, 2, THEME.primary, 16);
  styleSectionRow(summarySheet, 4, 0, 2);
  styleSectionRow(summarySheet, 13, 0, 2);
  styleSectionRow(summarySheet, 19, 0, 2);

  // Tabla KPI (encabezado fila 6, datos 7..11)
  styleTable(summarySheet, {
    startRow: 6,
    startCol: 0,
    endRow: 11,
    endCol: 2,
    headerRow: 6,
    headerFillRgb: THEME.grayHeader,
    zebra: true,
    alignBody: "left",
  });

  // “Valor” alineado a la derecha y en negrita
  for (let r = 7; r <= 11; r++) {
    setCellStyle(summarySheet, r, 1, {
      font: { bold: true, color: { rgb: THEME.text } },
      alignment: { horizontal: "right", vertical: "center" },
      border: bordersThin(),
      fill: { fgColor: { rgb: r % 2 === 0 ? THEME.zebraB : THEME.zebraA } },
    });
  }

  // Formato de porcentaje (tasa de resolución)
  setCellFormat(summarySheet, 11, 1, "0.0%");

  // Tabla canales (fila 15 encabezado, 16..17 datos)
  styleTable(summarySheet, {
    startRow: 15,
    startCol: 0,
    endRow: 17,
    endCol: 2,
    headerRow: 15,
    headerFillRgb: THEME.grayHeader,
    zebra: true,
    alignBody: "center",
  });
  setCellFormat(summarySheet, 16, 2, "0.0%");
  setCellFormat(summarySheet, 17, 2, "0.0%");

  // Tabla contactos (fila 21 encabezado, 22..23 datos)
  styleTable(summarySheet, {
    startRow: 21,
    startCol: 0,
    endRow: 23,
    endCol: 1,
    headerRow: 21,
    headerFillRgb: THEME.grayHeader,
    zebra: true,
    alignBody: "left",
  });

  // Formatos numéricos (enteros con separador)
  // KPIs valores (col 1, filas 7..10)
  for (let r = 7; r <= 10; r++) setCellFormat(summarySheet, r, 1, "#,##0");
  // Canales cantidad (col 1, filas 16..17)
  for (let r = 16; r <= 17; r++) setCellFormat(summarySheet, r, 1, "#,##0");
  // Contactos valores (col 1, filas 22..23)
  for (let r = 22; r <= 23; r++) setCellFormat(summarySheet, r, 1, "#,##0");

  XLSX.utils.book_append_sheet(workbook, summarySheet, "📊 Resumen");

  /** =========================
   *  SHEET 2: DAILY
   *  ========================= */
  const dailyHeaders = ["📅 Fecha", "Total", "✅ Resueltas", "⏳ Pendientes", "⚠️ Escaladas", "Tasa Resolución"];

  const dailyData = data.timeSeriesData.map((day) => [
    day.dateFull,
    day.total,
    day.resolved,
    day.unresolved,
    day.escalated,
    day.total > 0 ? day.resolved / day.total : 0,
  ]);

  const totalConversations = data.timeSeriesData.reduce((sum, d) => sum + d.total, 0);
  const totalResolved = data.timeSeriesData.reduce((sum, d) => sum + d.resolved, 0);
  const totalUnresolved = data.timeSeriesData.reduce((sum, d) => sum + d.unresolved, 0);
  const totalEscalated = data.timeSeriesData.reduce((sum, d) => sum + d.escalated, 0);

  const totalRow = [
    "📊 TOTAL",
    totalConversations,
    totalResolved,
    totalUnresolved,
    totalEscalated,
    totalConversations > 0 ? totalResolved / totalConversations : 0,
  ];

  const dailySheetData = [dailyHeaders, ...dailyData, [], totalRow];
  const dailySheet = XLSX.utils.aoa_to_sheet(dailySheetData);

  dailySheet["!cols"] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
  ];
  dailySheet["!rows"] = [{ hpt: 22 }];

  // Tabla completa: encabezado en fila 0, datos 1..dailyData.length
  styleTable(dailySheet, {
    startRow: 0,
    startCol: 0,
    endRow: dailyData.length,
    endCol: dailyHeaders.length - 1,
    headerRow: 0,
    headerFillRgb: THEME.primary,
    zebra: true,
    alignBody: "center",
  });

  // Alinear fecha a la izquierda
  for (let r = 1; r <= dailyData.length; r++) {
    setCellStyle(dailySheet, r, 0, {
      font: { color: { rgb: THEME.text } },
      fill: { fgColor: { rgb: r % 2 === 0 ? THEME.zebraB : THEME.zebraA } },
      alignment: { horizontal: "left", vertical: "center" },
      border: bordersThin(),
    });
  }

  // Formatos numéricos
  for (let r = 1; r <= dailyData.length; r++) {
    for (let c = 1; c <= 4; c++) setCellFormat(dailySheet, r, c, "#,##0");
    setCellFormat(dailySheet, r, 5, "0.0%");
  }

  // Fila de totales está en: dailyData.length + 2 (por el [] en medio)
  const totalRowIndex = dailyData.length + 2;
  styleTotalRow(dailySheet, totalRowIndex, 0, dailyHeaders.length - 1);
  for (let c = 1; c <= 4; c++) setCellFormat(dailySheet, totalRowIndex, c, "#,##0");
  setCellFormat(dailySheet, totalRowIndex, 5, "0.0%");

  // Autofilter solo para la tabla (sin la fila vacía ni total)
  addAutoFilter(dailySheet, 0, 0, dailyData.length, dailyHeaders.length - 1);

  // Freeze header
  freeze(dailySheet, 1);

  XLSX.utils.book_append_sheet(workbook, dailySheet, "📅 Datos Diarios");

  /** =========================
   *  SHEET 3: STATUS
   *  ========================= */
  const statusHeaders = ["Estado", "Cantidad", "Porcentaje", "🎨 Color"];
  const totalStatus = data.statusDistribution.reduce((sum, s) => sum + s.value, 0);

  const statusData = data.statusDistribution.map((status) => [
    status.name,
    status.value,
    totalStatus > 0 ? status.value / totalStatus : 0,
    status.color,
  ]);

  const statusSheetData = [statusHeaders, ...statusData];
  const statusSheet = XLSX.utils.aoa_to_sheet(statusSheetData);

  statusSheet["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 18 }];
  statusSheet["!rows"] = [{ hpt: 22 }];

  styleTable(statusSheet, {
    startRow: 0,
    startCol: 0,
    endRow: statusData.length,
    endCol: statusHeaders.length - 1,
    headerRow: 0,
    headerFillRgb: THEME.purple,
    zebra: true,
    zebraB: "FAF5FF",
    alignBody: "center",
  });

  // Cantidad en negrita + formato
  for (let r = 1; r <= statusData.length; r++) {
    setCellStyle(statusSheet, r, 1, {
      font: { bold: true, color: { rgb: THEME.text } },
      fill: { fgColor: { rgb: r % 2 === 0 ? "FAF5FF" : THEME.zebraA } },
      alignment: { horizontal: "center", vertical: "center" },
      border: bordersThin(),
    });

    setCellFormat(statusSheet, r, 1, "#,##0");
    setCellFormat(statusSheet, r, 2, "0.0%");
  }

  addAutoFilter(statusSheet, 0, 0, statusData.length, statusHeaders.length - 1);
  freeze(statusSheet, 1);

  XLSX.utils.book_append_sheet(workbook, statusSheet, "📊 Distribución");

  /** =========================
   *  WRITE
   *  ========================= */
  const fileName = `reporte-analiticas-${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
