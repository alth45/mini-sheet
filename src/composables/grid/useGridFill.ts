import { ref } from "vue";
import {
  rcToRef,
  refToRC,
  type CellRef,
  type SelectionRect,
} from "@/constants";
import type { SheetApi } from "@/composables/useSheet";
import type { CellRect } from "./types";

/**
 * Fill handle (drag pojok kanan-bawah selection) untuk copy range.
 * Menampilkan preview dashed saat drag.
 */
export function useGridFill(
  sheet: SheetApi,
  getCellRect: (ref: CellRef) => CellRect | null,
) {
  let filling = false;
  let fillSource: SelectionRect | null = null;
  let fillTarget: SelectionRect | null = null;

  const fillPreviewStyle = ref<Record<string, string> | null>(null);

  function isFilling(): boolean {
    return filling;
  }

  function onFillHandleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const src = sheet.selRect.value;
    fillSource = { ...src };
    fillTarget = { ...src };
    filling = true;
    updateFillPreview();
  }

  function updateFillPreview() {
    if (!fillTarget || !fillSource) {
      fillPreviewStyle.value = null;
      return;
    }
    // Target == source → tidak ada preview
    if (
      fillTarget.r1 === fillSource.r1 &&
      fillTarget.r2 === fillSource.r2 &&
      fillTarget.c1 === fillSource.c1 &&
      fillTarget.c2 === fillSource.c2
    ) {
      fillPreviewStyle.value = null;
      return;
    }
    const tl = getCellRect(rcToRef(fillTarget.c1, fillTarget.r1));
    const br = getCellRect(rcToRef(fillTarget.c2, fillTarget.r2));
    if (!tl || !br) {
      fillPreviewStyle.value = null;
      return;
    }
    fillPreviewStyle.value = {
      top: `${tl.top}px`,
      left: `${tl.left}px`,
      width: `${br.left + br.width - tl.left}px`,
      height: `${br.top + br.height - tl.top}px`,
    };
  }

  function handleFillMove(e: MouseEvent) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const td = el instanceof Element ? el.closest("td.cell") : null;
    if (!td || !fillSource) return;
    const ref = (td as HTMLElement).dataset.ref;
    if (!ref) return;
    const pos = refToRC(ref);
    if (!pos) return;

    fillTarget = {
      r1: Math.min(fillSource.r1, pos.r),
      r2: Math.max(fillSource.r2, pos.r),
      c1: Math.min(fillSource.c1, pos.c),
      c2: Math.max(fillSource.c2, pos.c),
    };
    updateFillPreview();
  }

  function commitFill() {
    filling = false;
    const src = fillSource;
    const tgt = fillTarget;
    fillSource = null;
    fillTarget = null;
    fillPreviewStyle.value = null;

    if (!src || !tgt) return;
    if (
      tgt.r1 === src.r1 &&
      tgt.r2 === src.r2 &&
      tgt.c1 === src.c1 &&
      tgt.c2 === src.c2
    )
      return;

    sheet.fillRange(src, tgt);
  }

  return {
    isFilling,
    onFillHandleMouseDown,
    handleFillMove,
    commitFill,
    fillPreviewStyle,
    updateFillPreview,
  };
}
