import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { COLS, NROWS, ROW_HEAD_W, ROW_H, type CellRef } from "@/constants";
import type { GridProps, GridEmit, CellRect } from "./types";
import { useGridCells } from "./useGridCells";
import { useGridSelection } from "./useGridSelection";
import { useGridOverlay } from "./useGridOverlay";
import { useGridFill } from "./useGridFill";
import { useGridResize } from "./useGridResize";

/**
 * Orchestrator untuk Grid.vue.
 * Menyatukan semua sub-composable + document-level event handling.
 */
export function useGrid(props: GridProps, emit: GridEmit) {
  const sheet = props.sheet;

  /* ---------- Refs ---------- */
  const gridWrapRef = ref<HTMLElement | null>(null);
  const tbodyRef = ref<HTMLTableSectionElement | null>(null);

  /* ---------- Template constants ---------- */
  const COLS_LIST = COLS;
  const ROW_NUMS = Array.from({ length: NROWS }, (_, i) => i + 1);
  const rowHeadStyle = {
    width: `${ROW_HEAD_W}px`,
    minWidth: `${ROW_HEAD_W}px`,
  };
  const rowHeightStyle = { height: `${ROW_H}px` };

  /* ---------- Geometry ---------- */
  function getCellRect(ref: CellRef): CellRect | null {
    const td = tbodyRef.value?.querySelector(
      `td.cell[data-ref="${ref}"]`,
    ) as HTMLElement | null;
    const wrap = gridWrapRef.value;
    if (!td || !wrap) return null;

    const tdRect = td.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();

    return {
      top: tdRect.top - wrapRect.top + wrap.scrollTop,
      left: tdRect.left - wrapRect.left + wrap.scrollLeft,
      width: tdRect.width,
      height: tdRect.height,
    };
  }

  function colStyleFor(c: number): Record<string, string> {
    const w = sheet.colWidths[c];
    return { width: `${w}px`, minWidth: `${w}px` };
  }

  const tableWidth = computed(
    () => ROW_HEAD_W + sheet.colWidths.reduce((s, w) => s + w, 0),
  );

  /* ---------- Sub-composables ---------- */
  const editingRefGetter = () => props.editingRef;

  const cells = useGridCells(sheet, editingRefGetter);
  const selection = useGridSelection(sheet, emit);
  const overlay = useGridOverlay(sheet, getCellRect);
  const fill = useGridFill(sheet, getCellRect);
  const resize = useGridResize(sheet, editingRefGetter);

  /* ---------- Scroll ---------- */
  function onScroll() {
    emit("scroll");
  }

  function scrollToRef(ref: CellRef) {
    const td = tbodyRef.value?.querySelector(
      `td.cell[data-ref="${ref}"]`,
    ) as HTMLElement | null;
    td?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  /* ---------- Document-level mouse dispatch ---------- */

  function onDocMouseMove(e: MouseEvent) {
    // Priority: resize > fill > selection drag
    if (resize.isResizing()) {
      resize.handleResizeMove(e);
      return;
    }
    if (fill.isFilling()) {
      fill.handleFillMove(e);
      return;
    }
    if (selection.isDragging()) {
      selection.handleDragMove(e);
    }
  }

  function onDocMouseUp() {
    if (resize.isResizing()) {
      resize.commitResize();
      return;
    }
    if (fill.isFilling()) {
      fill.commitFill();
      return;
    }
    selection.endDrag();
  }

  function onWindowResize() {
    overlay.updateSelectionOverlay();
  }

  /* ---------- Watchers ---------- */

  watch(
    () => sheet.activeRef.value,
    (ref) => scrollToRef(ref),
  );

  watch(
    () => sheet.colWidths,
    () => {
      overlay.updateSelectionOverlay();
      fill.updateFillPreview();
    },
    { flush: "post", deep: true },
  );

  watch(
    () => sheet.selRect.value,
    () => overlay.updateSelectionOverlay(),
    { flush: "post" },
  );

  /* ---------- Lifecycle ---------- */

  onMounted(async () => {
    document.addEventListener("mousemove", onDocMouseMove);
    document.addEventListener("mouseup", onDocMouseUp);
    window.addEventListener("resize", onWindowResize);
    await nextTick();
    overlay.updateSelectionOverlay();
  });

  onBeforeUnmount(() => {
    document.removeEventListener("mousemove", onDocMouseMove);
    document.removeEventListener("mouseup", onDocMouseUp);
    window.removeEventListener("resize", onWindowResize);
  });

  /* ---------- Return (flat, untuk destructure) ---------- */

  return {
    // refs & template constants
    gridWrapRef,
    tbodyRef,
    COLS_LIST,
    ROW_NUMS,
    rowHeadStyle,
    rowHeightStyle,
    // computed & style helpers
    tableWidth,
    colStyleFor,
    getCellRect,
    onScroll,
    // sub-composables
    ...cells,
    ...selection,
    ...overlay,
    ...fill,
    ...resize,
  };
}
