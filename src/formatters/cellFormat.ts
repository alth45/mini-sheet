/* =========================================================
   MiniSheet — Cell Format Engine
   ========================================================= */

import type { EvalValue } from "@/constants";

/* ---------- Types ---------- */

export type CellFormat =
  | "general"
  | "number"
  | "text"
  | "accounting"
  | "scientific"
  | "currency"
  | "finance"
  | "custom-date"
  | "custom-number";

export interface FormatContext {
  decimals?: number;
  percent?: boolean;
  currency?: boolean;
  format?: CellFormat;
  customDateFormat?: string;
  customNumberFormat?: string;
}

export type FormatOptionItem =
  | {
      type?: "option";
      value: CellFormat;
      label: string;
      description: string;
      example: string;
    }
  | { type: "separator" };

export interface DateFormatPreset {
  pattern: string;
  label: string;
  description: string;
}

export interface NumberFormatPreset {
  pattern: string;
  label: string;
  description: string;
}

/* =========================================================
   Preset lists
   ========================================================= */

export const CELL_FORMAT_OPTIONS: readonly FormatOptionItem[] = [
  {
    value: "general",
    label: "Umum",
    description: "Format otomatis",
    example: "1234,5",
  },
  {
    value: "number",
    label: "Angka",
    description: "Pemisah ribuan",
    example: "1.234,5",
  },
  {
    value: "text",
    label: "Teks",
    description: "Tampilkan apa adanya",
    example: "1234,5",
  },
  {
    value: "accounting",
    label: "Akuntansi",
    description: "Rupiah · kurung negatif",
    example: "Rp 1.234,50",
  },
  {
    value: "scientific",
    label: "Ilmiah",
    description: "Notasi eksponensial",
    example: "1,23E+03",
  },
  {
    value: "currency",
    label: "Mata Uang",
    description: "Dollar AS",
    example: "$1,234.50",
  },
  {
    value: "finance",
    label: "Keuangan",
    description: "Rupiah · minus negatif",
    example: "Rp 1.234,50",
  },
  { type: "separator" },
  {
    value: "custom-date",
    label: "Format Waktu",
    description: "Tanggal & jam kustom",
    example: "25/12/2024",
  },
  {
    value: "custom-number",
    label: "Format Angka Khusus",
    description: "Pola angka kustom",
    example: "#.##0,00",
  },
];

export const DATE_FORMAT_PRESETS: readonly DateFormatPreset[] = [
  {
    pattern: "DD/MM/YYYY",
    label: "Tanggal Indonesia",
    description: "25/12/2024",
  },
  { pattern: "DD-MM-YYYY", label: "Tanggal strip", description: "25-12-2024" },
  {
    pattern: "DD MMM YYYY",
    label: "Bulan singkat",
    description: "25 Des 2024",
  },
  {
    pattern: "DD MMMM YYYY",
    label: "Bulan lengkap",
    description: "25 Desember 2024",
  },
  { pattern: "YYYY-MM-DD", label: "ISO Date", description: "2024-12-25" },
  { pattern: "HH:mm", label: "Jam:menit", description: "14:30" },
  { pattern: "HH:mm:ss", label: "Jam:menit:detik", description: "14:30:45" },
  {
    pattern: "DD/MM/YYYY HH:mm",
    label: "Tanggal & jam",
    description: "25/12/2024 14:30",
  },
  {
    pattern: "DD MMMM YYYY HH:mm",
    label: "Lengkap & jam",
    description: "25 Desember 2024 14:30",
  },
];

export const NUMBER_FORMAT_PRESETS: readonly NumberFormatPreset[] = [
  { pattern: "#.##0", label: "Ribuan", description: "1.500.000" },
  {
    pattern: "#.##0,00",
    label: "Ribuan + 2 desimal",
    description: "1.500.000,00",
  },
  {
    pattern: "#,##0.00",
    label: "US Ribuan + 2 desimal",
    description: "1,500,000.00",
  },
  { pattern: "0", label: "Integer", description: "1500000" },
  { pattern: "0,00", label: "2 desimal", description: "1500000,00" },
  { pattern: "0.00", label: "2 desimal (US)", description: "1500000.00" },
  { pattern: "Rp #.##0", label: "Rupiah", description: "Rp 1.500.000" },
  {
    pattern: "Rp #.##0,00",
    label: "Rupiah + 2 desimal",
    description: "Rp 1.500.000,00",
  },
  { pattern: "#.##0,00%", label: "Persen + desimal", description: "1,50%" },
  { pattern: "0%", label: "Persen integer", description: "2%" },
];

/* =========================================================
   Date formatting
   ========================================================= */

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const MONTHS_ID_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

const DATE_TOKEN_RE = /YYYY|MMMM|MMM|MM|DD|HH|mm|ss|YY|M|D|H/g;

export function applyDatePattern(date: Date, pattern: string): string {
  const tokens: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    YY: String(date.getFullYear()).slice(-2),
    MMMM: MONTHS_ID[date.getMonth()],
    MMM: MONTHS_ID_SHORT[date.getMonth()],
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    DD: pad(date.getDate()),
    D: String(date.getDate()),
    HH: pad(date.getHours()),
    H: String(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  return pattern.replace(DATE_TOKEN_RE, (m) => tokens[m] ?? m);
}

export function toDate(v: EvalValue): Date | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const parsed = Date.parse(v);
    if (!Number.isNaN(parsed)) return new Date(parsed);
    const num = Number(v);
    if (!Number.isNaN(num)) {
      const d = new Date(num);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

export function formatDateValue(v: EvalValue, pattern: string): string {
  const date = toDate(v);
  if (!date) {
    if (v === null || v === undefined) return "";
    return String(v);
  }
  return applyDatePattern(date, pattern);
}

/* =========================================================
   Custom number format
   ========================================================= */

const NUMERIC_SECTION_RE = /([#0]+(?:[.,][#0]+)*)/;

export function applyCustomNumberFormat(n: number, pattern: string): string {
  if (!Number.isFinite(n)) return String(n);

  const match = pattern.match(NUMERIC_SECTION_RE);
  if (!match || match.index === undefined) return pattern;

  const numericSection = match[1];
  const prefix = pattern.slice(0, match.index);
  const suffix = pattern.slice(match.index + numericSection.length);

  const lastDot = numericSection.lastIndexOf(".");
  const lastComma = numericSection.lastIndexOf(",");
  const lastSepIdx = Math.max(lastDot, lastComma);

  let intPattern = numericSection;
  let decPattern = "";
  let decimalSep = "";
  let thousandSep = "";

  if (lastSepIdx !== -1) {
    const sepChar = numericSection[lastSepIdx];
    const afterSep = numericSection.slice(lastSepIdx + 1);
    // Heuristic: exactly 3 placeholder chars after → thousand separator
    const isThousand = /^[#0]{3}$/.test(afterSep);

    if (isThousand) {
      thousandSep = sepChar;
    } else {
      decimalSep = sepChar;
      thousandSep = sepChar === "." ? "," : ".";
      intPattern = numericSection.slice(0, lastSepIdx);
      decPattern = afterSep;
    }
  }

  const minDecimals = (decPattern.match(/0/g) || []).length;
  const maxDecimals = decPattern.length;

  const isPercent = suffix.includes("%");
  const displayValue = isPercent ? n * 100 : n;

  const formatter = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
    useGrouping: !!thousandSep,
  });

  let result = formatter.format(displayValue);

  if (decimalSep && decimalSep !== ",") {
    result = result.replace(",", decimalSep);
  }
  if (thousandSep && thousandSep !== ".") {
    result = result.replace(/\./g, thousandSep);
  }

  return `${prefix}${result}${suffix}`;
}

/* =========================================================
   Standard formatters (cached)
   ========================================================= */

const idFormatters = new Map<number, Intl.NumberFormat>();
function getIDFormatter(decimals: number): Intl.NumberFormat {
  let f = idFormatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    idFormatters.set(decimals, f);
  }
  return f;
}

const usdFormatters = new Map<number, Intl.NumberFormat>();
function getUSDFormatter(decimals: number): Intl.NumberFormat {
  let f = usdFormatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    usdFormatters.set(decimals, f);
  }
  return f;
}

function formatID(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) >= 1e21) return String(n);
  return getIDFormatter(decimals).format(n);
}

/* =========================================================
   Main API
   ========================================================= */

export function formatCellValue(v: EvalValue, ctx: FormatContext): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";

  const format = ctx.format ?? "general";
  const decimals = ctx.decimals;
  const percent = ctx.percent;
  const currency = ctx.currency;

  /* ---------- Custom formats ---------- */

  if (format === "custom-date") {
    return formatDateValue(v, ctx.customDateFormat ?? "DD/MM/YYYY");
  }

  if (format === "custom-number") {
    const pattern = ctx.customNumberFormat ?? "#.##0,00";
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) return String(v);
    return applyCustomNumberFormat(n, pattern);
  }

  /* ---------- Non-numeric ---------- */

  if (typeof v === "string") return format === "text" ? v : v;
  if (typeof v === "number" && !Number.isFinite(v)) return "#DIV/0!";

  /* ---------- Explicit numeric formats ---------- */

  const n = v as number;

  if (format === "text") return String(n);

  if (format === "number") return formatID(n, decimals ?? 0);

  if (format === "accounting") {
    const d = decimals ?? 2;
    const abs = formatID(Math.abs(n), d);
    return n < 0 ? `(Rp ${abs})` : `Rp ${abs}`;
  }

  if (format === "scientific") {
    return n
      .toExponential(decimals ?? 2)
      .replace(".", ",")
      .replace("e", "E")
      .toUpperCase();
  }

  if (format === "currency") return getUSDFormatter(decimals ?? 2).format(n);

  if (format === "finance") {
    const d = decimals ?? 2;
    const sign = n < 0 ? "-" : "";
    return `${sign}Rp ${formatID(Math.abs(n), d)}`;
  }

  /* ---------- General + toggles ---------- */

  if (percent) {
    const scaled = n * 100;
    const d = decimals ?? 0;
    return Math.abs(scaled) < 1e21
      ? `${scaled.toFixed(d)}%`
      : `${String(scaled)}%`;
  }

  if (currency) {
    const d = decimals ?? 0;
    const sign = n < 0 ? "-" : "";
    return `${sign}Rp ${formatID(Math.abs(n), d)}`;
  }

  if (decimals !== undefined) {
    return Math.abs(n) < 1e21 ? n.toFixed(decimals) : String(n);
  }

  return String(Math.round(n * 1e10) / 1e10);
}
