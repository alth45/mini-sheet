import { COL_W, type CellRef } from "@/constants";
import type { SheetApi } from "@/composables/useSheet";

/**
 * Column resize via drag di border kanan header kolom.
 * Double-click = reset ke lebar default.
 */
export function useGridResize(
  sheet: SheetApi,
  getEditingRef: () => CellRef | null,
) {
  let resizing = false;
  let resizeCol = -1;
  let resizeStartX = 0;
  let resizeStartW = 0;

  function isResizing(): boolean {
    return resizing;
  }

  function onResizeStart(c: number, e: MouseEvent) {
    if (e.button !== 0) return;
    if (getEditingRef()) return; // block saat editing
    e.preventDefault();
    e.stopPropagation();

    resizing = true;
    resizeCol = c;
    resizeStartX = e.clientX;
    resizeStartW = sheet.colWidths[c];
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function handleResizeMove(e: MouseEvent) {
    if (!resizing) return;
    const dx = e.clientX - resizeStartX;
    sheet.setColWidth(resizeCol, resizeStartW + dx);
  }

  function commitResize() {
    resizing = false;
    resizeCol = -1;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }

  function onResizeReset(c: number) {
    sheet.setColWidth(c, COL_W);
  }

  return {
    isResizing,
    onResizeStart,
    handleResizeMove,
    commitResize,
    onResizeReset,
  };
}
