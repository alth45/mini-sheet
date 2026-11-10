/* =========================================================
   MiniSheet — Seed Data
   ---------------------------------------------------------
   Data contoh saat aplikasi pertama kali dibuka.
   Style menggunakan palet modern (indigo header, slate bg).
   ========================================================= */

import type { CellMap, StyleMap, CellStyle } from "@/constants";

/* =========================================================
   Reusable style fragments
   ========================================================= */

const HEADER_STYLE: CellStyle = {
  bold: true,
  bg: "#eef2ff" /* primary-50 */,
  color: "#4338ca" /* primary-700 */,
  align: "center",
};

const LABEL_STYLE: CellStyle = {
  bold: true,
  bg: "#f8fafc" /* slate-50 */,
  color: "#334155" /* slate-700 */,
};

const RESULT_STYLE: CellStyle = {
  bold: true,
  bg: "#f0fdf4" /* success-50 */,
  color: "#15803d" /* success-700 */,
  align: "right",
};

const CENTER_STYLE: CellStyle = { align: "center" };
const RIGHT_STYLE: CellStyle = { align: "right" };

/* =========================================================
   SEED_DATA — raw values
   ========================================================= */

export const SEED_DATA: CellMap = {
  /* ----- Header tabel ----- */
  A1: "Barang",
  B1: "Qty",
  C1: "Harga",
  D1: "Total",

  /* ----- Baris data ----- */
  A2: "Laptop",
  B2: "2",
  C2: "7500000",
  D2: "=B2*C2",
  A3: "Mouse",
  B3: "5",
  C3: "150000",
  D3: "=B3*C3",
  A4: "Keyboard",
  B4: "3",
  C4: "350000",
  D4: "=B4*C4",
  A5: "Monitor",
  B5: "1",
  C5: "2100000",
  D5: "=B5*C5",
  A6: "Printer",
  B6: "2",
  C6: "1250000",
  D6: "=B6*C6",

  /* ----- Summary ----- */
  A8: "JUMLAH",
  D8: "=SUM(D2:D6)",
  A9: "RATA-RATA",
  D9: "=AVERAGE(D2:D6)",
  A10: "TERBESAR",
  D10: "=MAX(D2:D6)",
  A11: "TERKECIL",
  D11: "=MIN(D2:D6)",
  A12: "JML ITEM",
  D12: "=COUNT(B2:B6)",
  A13: "RATA QTY",
  D13: "=AVERAGE(B2:B6)",
};

/* =========================================================
   SEED_STYLES — per-cell style override
   ========================================================= */

export const SEED_STYLES: StyleMap = {
  /* ----- Header row ----- */
  A1: { ...HEADER_STYLE },
  B1: { ...HEADER_STYLE },
  C1: { ...HEADER_STYLE },
  D1: { ...HEADER_STYLE },

  /* ----- Qty column: rata tengah ----- */
  B2: { ...CENTER_STYLE },
  B3: { ...CENTER_STYLE },
  B4: { ...CENTER_STYLE },
  B5: { ...CENTER_STYLE },
  B6: { ...CENTER_STYLE },

  /* ----- Harga & Total: rata kanan ----- */
  C2: { ...RIGHT_STYLE },
  C3: { ...RIGHT_STYLE },
  C4: { ...RIGHT_STYLE },
  C5: { ...RIGHT_STYLE },
  C6: { ...RIGHT_STYLE },
  D2: { ...RIGHT_STYLE },
  D3: { ...RIGHT_STYLE },
  D4: { ...RIGHT_STYLE },
  D5: { ...RIGHT_STYLE },
  D6: { ...RIGHT_STYLE },

  /* ----- Label baris summary ----- */
  A8: { ...LABEL_STYLE },
  A9: { ...LABEL_STYLE },
  A10: { ...LABEL_STYLE },
  A11: { ...LABEL_STYLE },
  A12: { ...LABEL_STYLE },
  A13: { ...LABEL_STYLE },

  /* ----- Nilai summary: highlight hijau ----- */
  D8: { ...RESULT_STYLE },
  D9: { ...RESULT_STYLE },
  D10: { ...RESULT_STYLE },
  D11: { ...RESULT_STYLE },
  D12: { ...RESULT_STYLE },
  D13: { ...RESULT_STYLE },
};
