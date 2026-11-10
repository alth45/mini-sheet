import type { CellRef } from "@/constants";
import type { SheetApi } from "@/composables/useSheet";

export interface CellRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GridProps {
  sheet: SheetApi;
  editingRef: CellRef | null;
}

export interface GridEmit {
  (e: "editStart", ref: CellRef, selectAll: boolean): void;
  (e: "scroll"): void;
}
