import { COLS, NROWS, rcToRef, type CellRef } from "@/constants";
import type { SheetApi } from "@/composables/useSheet";

/**
 * Handle mouse-down di sel & header, plus drag tracking.
 * Drag move dipanggil dari orchestrator (useGrid) saat
 * document mousemove aktif.
 */
export function useGridSelection(
  sheet: SheetApi,
  emit: (e: "editStart", ref: CellRef, selectAll: boolean) => void,
) {
  let dragging = false;

  function isDragging(): boolean {
    return dragging;
  }

  function endDrag() {
    dragging = false;
  }

  function onCellMouseDown(ref: CellRef, e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();

    if (e.shiftKey) {
      sheet.selEnd.value = ref;
    } else {
      sheet.selectCell(ref);
    }
    dragging = true;
  }

  function onCellDblClick(ref: CellRef) {
    sheet.selectCell(ref);
    emit("editStart", ref, true);
  }

  function onCornerMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    sheet.selStart.value = rcToRef(0, 0);
    sheet.selEnd.value = rcToRef(COLS.length - 1, NROWS - 1);
    sheet.activeRef.value = rcToRef(0, 0);
  }

  function onColMouseDown(c: number, e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    const top = rcToRef(c, 0);
    const bottom = rcToRef(c, NROWS - 1);
    if (e.shiftKey) {
      sheet.selEnd.value = bottom;
    } else {
      sheet.selStart.value = top;
      sheet.selEnd.value = bottom;
      sheet.activeRef.value = top;
    }
    dragging = true;
  }

  function onRowMouseDown(r: number, e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    const left = rcToRef(0, r);
    const right = rcToRef(COLS.length - 1, r);
    if (e.shiftKey) {
      sheet.selEnd.value = right;
    } else {
      sheet.selStart.value = left;
      sheet.selEnd.value = right;
      sheet.activeRef.value = left;
    }
    dragging = true;
  }

  function handleDragMove(e: MouseEvent) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const td = el instanceof Element ? el.closest("td.cell") : null;
    if (!td) return;
    const ref = (td as HTMLElement).dataset.ref;
    if (ref && ref !== sheet.selEnd.value) {
      sheet.selEnd.value = ref;
    }
  }

  return {
    isDragging,
    endDrag,
    onCellMouseDown,
    onCellDblClick,
    onCornerMouseDown,
    onColMouseDown,
    onRowMouseDown,
    handleDragMove,
  };
}
