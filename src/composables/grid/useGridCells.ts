import { computed, type ComputedRef } from "vue";
import {
  COLS,
  NROWS,
  rcToRef,
  refToRC,
  type CellRef,
  type CellStyle,
} from "@/constants";
import type { SheetApi, CellRender } from "@/composables/useSheet";

/**
 * Menyediakan semua *derived* data untuk rendering cell:
 * - displayMap (text + isNumeric + error per cell)
 * - cellStyle (CSS object per cell)
 * - cellText (string dengan guard editingRef)
 * - Selection query helpers (isInRange, isActive, ...)
 */
export function useGridCells(
  sheet: SheetApi,
  getEditingRef: () => CellRef | null,
) {
  const displayMap: ComputedRef<Record<CellRef, CellRender>> = computed(() => {
    const map: Record<CellRef, CellRender> = {};
    for (let r = 0; r < NROWS; r++) {
      for (let c = 0; c < COLS.length; c++) {
        const ref = rcToRef(c, r);
        map[ref] = sheet.renderCell(ref);
      }
    }
    return map;
  });

  function isInRange(ref: CellRef): boolean {
    const pos = refToRC(ref);
    if (!pos) return false;
    const { r1, r2, c1, c2 } = sheet.selRect.value;
    return pos.r >= r1 && pos.r <= r2 && pos.c >= c1 && pos.c <= c2;
  }

  function isActive(ref: CellRef): boolean {
    return ref === sheet.activeRef.value;
  }

  function colIsSelected(c: number): boolean {
    const { c1, c2 } = sheet.selRect.value;
    return c >= c1 && c <= c2;
  }

  function rowIsSelected(r: number): boolean {
    const { r1, r2 } = sheet.selRect.value;
    return r >= r1 && r <= r2;
  }

  function cellStyle(ref: CellRef): Record<string, string> {
    const s: CellStyle = sheet.styleFor(ref);
    const d = displayMap.value[ref];
    const out: Record<string, string> = {};

    if (s.fontFamily) out.fontFamily = s.fontFamily;
    if (s.fontSize) out.fontSize = `${s.fontSize}px`;
    if (s.bold) out.fontWeight = "700";
    if (s.italic) out.fontStyle = "italic";
    if (s.underline) out.textDecoration = "underline";
    if (s.color) out.color = s.color;
    if (s.bg) out.backgroundColor = s.bg;

    if (s.align) {
      out.textAlign = s.align;
    } else {
      out.textAlign = d?.isNumeric ? "right" : "left";
    }

    if (d?.error) {
      out.color = "var(--danger-700)";
      out.fontWeight = "600";
    }

    // Border via CSS variable
    if (s.border) {
      const parts: string[] = [];
      const b = s.border;
      if (b.top) parts.push(`inset 0 ${b.top.width}px 0 0 ${b.top.color}`);
      if (b.right)
        parts.push(`inset -${b.right.width}px 0 0 0 ${b.right.color}`);
      if (b.bottom)
        parts.push(`inset 0 -${b.bottom.width}px 0 0 ${b.bottom.color}`);
      if (b.left) parts.push(`inset ${b.left.width}px 0 0 0 ${b.left.color}`);
      if (parts.length) out["--cell-border-shadow"] = parts.join(", ");
    }

    return out;
  }

  function cellText(ref: CellRef): string {
    if (ref === getEditingRef()) return "";
    return displayMap.value[ref]?.display ?? "";
  }

  return {
    displayMap,
    isInRange,
    isActive,
    colIsSelected,
    rowIsSelected,
    cellStyle,
    cellText,
  };
}
