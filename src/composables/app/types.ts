import type { CellRef } from "@/constants";

/* ---------- Editor / Layout ---------- */

export interface EditorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface EditingCell {
  ref: CellRef;
  initialValue: string;
  selectAll: boolean;
  position: EditorRect;
}

/* ---------- Component Expose API ---------- */

export interface GridExposed {
  getCellRect(ref: CellRef): EditorRect | null;
}

export interface FormulaBarExposed {
  focus(): void;
  setValue(val: string): void;
}

/* ---------- Modal ---------- */

export type ModalId = "about" | "reset" | "date-format" | "number-format";
