/* =========================================================
   MiniSheet — Constants & Types
   Fondasi tipe data untuk seluruh aplikasi.
   ========================================================= */

/* ---------- Grid Dimension ---------- */
/* ---------- Grid Dimension ---------- */

/**
 * Generate N kolom menggunakan penamaan bijective base-26:
 * 0→A, 25→Z, 26→AA, 51→AZ, 52→BA, 701→ZZ, dst.
 *
 * Saat ini 26 kolom (A..Z). Ubah angka di bawah ke 52 untuk
 * A..AZ, atau 78 untuk A..BZ, dst — tanpa sentuh kode lain.
 */
function generateCols(count: number): readonly string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let n = i;
    let s = "";
    do {
      s = String.fromCharCode(65 + (n % 26)) + s;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    out.push(s);
  }
  return out;
}

export const COLS: readonly string[] = generateCols(26); // A..Z

export const NROWS = 30;
export const COL_W = 90;
export const MIN_COL_W = 40;
export const MAX_COL_W = 500;
export const ROW_H = 24;
export const ROW_HEAD_W = 44;

/* ---------- Cell Reference ---------- */
/** Referensi sel, contoh: "A1", "B5", "J30" */
export type CellRef = string;

/** Posisi numerik (0-indexed) */
export interface CellPosition {
  /** Column index, 0 = A */
  c: number;
  /** Row index, 0 = row 1 */
  r: number;
}

/** Persegi panjang seleksi (0-indexed, inklusif) */
export interface SelectionRect {
  r1: number;
  r2: number;
  c1: number;
  c2: number;
}

/* ---------- Cell Style ---------- */
export type AlignValue = "left" | "center" | "right";

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bg?: string;
  align?: AlignValue;
  decimals?: number;
  percent?: boolean;
}

/* ---------- Sheet Data ---------- */
/** Raw value (bisa angka, teks, atau formula mulai dengan "=") */
export type CellValue = string;

/** Map ref → raw value */
export type CellMap = Record<CellRef, CellValue>;

/** Map ref → style */
export type StyleMap = Record<CellRef, CellStyle>;

/* ---------- Formula Engine ---------- */
/** Nilai hasil evaluasi (bisa number, string, boolean, null) */
export type EvalValue = number | string | boolean | null;

/** Range marker di dalam parser (internal) */
export interface RangeArg {
  __range: [CellRef, CellRef];
}

/** Argumen parser: nilai atau range */
export type FormulaArg = EvalValue | RangeArg;

/** Konteks evaluasi — Set ref yang sedang dievaluasi (deteksi circular) */
export type EvalStack = Set<CellRef>;

/** Signature semua fungsi rumus */
export type FormulaFunc = (args: FormulaArg[], stack: EvalStack) => EvalValue;

/* ---------- UI / Toolbar ---------- */
/** Aksi yang bisa dipicu dari menu / toolbar / keyboard shortcut */
export type SheetAction =
  | "new"
  | "clear"
  | "bold"
  | "italic"
  | "underline"
  | "align-left"
  | "align-center"
  | "align-right"
  | "clear-format"
  | "increase-decimal"
  | "decrease-decimal"
  | "toggle-percent"
  | "f-sum"
  | "f-average"
  | "f-max"
  | "f-min"
  | "f-count"
  | "about";

/** Nama fungsi rumus yang didukung */
export type FuncName = "SUM" | "AVERAGE" | "MAX" | "MIN" | "COUNT" | "IF";

/* ---------- Default Values ---------- */
export const DEFAULT_FONT_FAMILY = "Inter";
export const DEFAULT_FONT_SIZE = 12;
export const DEFAULT_TEXT_COLOR = "#0f172a";
export const DEFAULT_FILL_COLOR = "#fef3c7"; /* amber-100 */
export const MAX_DECIMALS = 10;
/** Pilihan font yang tersedia di toolbar */
export const FONT_FAMILIES: readonly string[] = [
  "Inter",
  "Arial",
  "Calibri",
  "Verdana",
  "Tahoma",
  "Times New Roman",
  "Georgia",
  "JetBrains Mono",
  "Courier New",
] as const;

/** Pilihan ukuran font */
export const FONT_SIZES: readonly number[] = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36,
] as const;

/* ---------- Helpers — Reference Conversion ---------- */
const REF_REGEX = /^([A-Z]+)(\d+)$/;

/**
 * Konversi "B5" → { c: 1, r: 4 }
 * Return null jika format tidak valid.
 */
export function refToRC(ref: string): CellPosition | null {
  const m = REF_REGEX.exec(ref);
  if (!m) return null;
  const colIdx = COLS.indexOf(m[1]);
  const rowIdx = parseInt(m[2], 10) - 1;
  if (colIdx < 0 || rowIdx < 0) return null;
  return { c: colIdx, r: rowIdx };
}

/**
 * Konversi { c: 1, r: 4 } → "B5"
 */
export function rcToRef(c: number, r: number): CellRef {
  return `${COLS[c]}${r + 1}`;
}

/**
 * Validasi apakah string adalah referensi sel yang valid
 */
export function isValidRef(ref: string): boolean {
  return REF_REGEX.test(ref) && refToRC(ref) !== null;
}

/**
 * Clamp angka ke range [min, max]
 */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Format angka hasil evaluasi untuk ditampilkan.
 * - Bulatkan 10 digit untuk hindari floating-point artifact.
 * - Boolean → "TRUE" / "FALSE".
 */
export function formatValue(
  v: EvalValue,
  decimals?: number,
  percent?: boolean,
): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";

  if (typeof v === "number") {
    if (!Number.isFinite(v)) return "#DIV/0!";

    // Persen: kalikan 100, lalu format dengan decimals + "%"
    if (percent) {
      const scaled = v * 100;
      const d = decimals ?? 0;
      if (Math.abs(scaled) < 1e21) return scaled.toFixed(d) + "%";
      return String(scaled) + "%";
    }

    // Desimal eksplisit
    if (decimals !== undefined) {
      if (Math.abs(v) < 1e21) return v.toFixed(decimals);
    }

    return String(Math.round(v * 1e10) / 1e10);
  }

  return String(v);
}

/**
+ * Hitung jumlah digit di belakang koma dari sebuah angka.
+ * Dipakai untuk "mewarisi" desimal saat user klik pertama kali.
+ */

export function countDecimals(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const s = String(Math.round(n * 1e10) / 1e10);
  const idx = s.indexOf(".");
  return idx === -1 ? 0 : s.length - idx - 1;
}

/**
 * Sesuaikan referensi sel relatif dalam formula.
 * Contoh: adjustFormulaRelative('=B2*C2', 1, 0) → '=B3*C3'
 *
 * - Skip string literal (di dalam "...") — ref di dalam string tidak diubah
 * - Jika hasil di luar grid → '#REF!'
 */
export function adjustFormulaRelative(
  formula: string,
  dr: number,
  dc: number,
): string {
  if (!formula.startsWith("=")) return formula;

  const adjust = (part: string): string =>
    part.replace(/([A-Z]{1,3})(\d{1,5})/g, (match, col, row) => {
      const pos = refToRC(col + row);
      if (!pos) return match;
      const newC = pos.c + dc;
      const newR = pos.r + dr;
      if (newC < 0 || newC >= COLS.length || newR < 0) return "#REF!";
      return rcToRef(newC, newR);
    });

  // Split per string literal — odd indices = "..." (jangan diubah)
  const parts = formula.split(/("[^"]*")/g);
  return parts.map((p, i) => (i % 2 === 1 ? p : adjust(p))).join("");
}
