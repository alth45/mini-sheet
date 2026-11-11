/* =========================================================
   MiniSheet — Cell Format Engine
   ---------------------------------------------------------
   Semua logika formatting angka: general, number, text,
   accounting, scientific, currency, finance.
   Dipakai oleh: useSheet.ts (via formatCellValue)
   ========================================================= */

import type { EvalValue } from "@/constants";

/* ---------- Types ---------- */

export type CellFormat =
  | "general" // Auto — tergantung percent/currency/decimals
  | "number" // 1.500.000 (thousand separator)
  | "text" // Tampilkan apa adanya (tanpa formatting)
  | "accounting" // Rp 1.500.000,00 · (Rp 1.500.000,00) untuk negatif
  | "scientific" // 1,50E+06
  | "currency" // $1,500.00 (USD style)
  | "finance"; // Rp 1.500.000,00 · -Rp 1.500.000,00 untuk negatif

export interface FormatContext {
  decimals?: number;
  percent?: boolean; // Rp toggle lama: %
  currency?: boolean; // Rp toggle lama: Rp
  format?: CellFormat; // format eksplisit dari dropdown
}

export interface FormatOption {
  value: CellFormat;
  label: string;
  description: string;
  example: string;
}

/* =========================================================
   Dropdown Options (dipakai Toolbar)
   ========================================================= */

export const CELL_FORMAT_OPTIONS: ReadonlyArray<FormatOption> = [
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
];

/* =========================================================
   Number formatting internals
   ========================================================= */

const numberFormatters = new Map<number, Intl.NumberFormat>();

function getIDFormatter(decimals: number): Intl.NumberFormat {
  let f = numberFormatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    numberFormatters.set(decimals, f);
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

/**
 * Format angka dengan pemisah ribuan Indonesia + N desimal.
 * 1500000, 0  → "1.500.000"
 * 1500000, 2  → "1.500.000,00"
 */
function formatID(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) >= 1e21) return String(n);
  return getIDFormatter(decimals).format(n);
}

/* =========================================================
   Public API — formatCellValue
   ========================================================= */

export function formatCellValue(v: EvalValue, ctx: FormatContext): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "string") return v;

  if (!Number.isFinite(v)) return "#DIV/0!";

  const format = ctx.format ?? "general";
  const decimals = ctx.decimals;
  const percent = ctx.percent;
  const currency = ctx.currency;

  /* ---------- Explicit formats (dropdown) ---------- */

  if (format === "text") return String(v);

  if (format === "number") {
    return formatID(v, decimals ?? 0);
  }

  if (format === "accounting") {
    const d = decimals ?? 2;
    const abs = formatID(Math.abs(v), d);
    return v < 0 ? `(${`Rp ${abs}`})` : `Rp ${abs}`;
  }

  if (format === "scientific") {
    const d = decimals ?? 2;
    const exp = v.toExponential(d);
    // 1.50e+3 → 1,50E+3 (Indonesian decimal comma)
    return exp.replace(".", ",").replace("e", "E").toUpperCase();
  }

  if (format === "currency") {
    const d = decimals ?? 2;
    return getUSDFormatter(d).format(v);
  }

  if (format === "finance") {
    const d = decimals ?? 2;
    const sign = v < 0 ? "-" : "";
    return `${sign}Rp ${formatID(Math.abs(v), d)}`;
  }

  /* ---------- General + toggles (% / Rp / decimals) ---------- */

  if (percent) {
    const scaled = v * 100;
    const d = decimals ?? 0;
    return Math.abs(scaled) < 1e21
      ? `${scaled.toFixed(d)}%`
      : `${String(scaled)}%`;
  }

  if (currency) {
    const d = decimals ?? 0;
    const sign = v < 0 ? "-" : "";
    return `${sign}Rp ${formatID(Math.abs(v), d)}`;
  }

  if (decimals !== undefined) {
    return Math.abs(v) < 1e21 ? v.toFixed(decimals) : String(v);
  }

  return String(Math.round(v * 1e10) / 1e10);
}
