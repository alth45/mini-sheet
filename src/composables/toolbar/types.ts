import type { CellStyle, SheetAction } from "@/constants";

/* ---------- Props ---------- */

export interface ToolbarProps {
  /** Style dari sel aktif (dipakai untuk state button & select) */
  activeStyle: CellStyle;
}

/* ---------- Emits ---------- */

export interface ToolbarEmit {
  (e: "action", action: SheetAction): void;
  (e: "setStyle", key: keyof CellStyle, value: unknown): void;
}
