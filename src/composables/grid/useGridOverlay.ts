import { ref } from "vue";
import { rcToRef, type CellRef } from "@/constants";
import type { SheetApi } from "@/composables/useSheet";
import type { CellRect } from "./types";

/**
 * Mengelola posisi kotak ungu yang mengelilingi seluruh selection range.
 * Bergantung pada getCellRect (disediakan useGrid).
 */
export function useGridOverlay(
  sheet: SheetApi,
  getCellRect: (ref: CellRef) => CellRect | null,
) {
  const overlayStyle = ref<Record<string, string> | null>(null);
  const overlayVisible = ref(false);

  function updateSelectionOverlay() {
    const { r1, r2, c1, c2 } = sheet.selRect.value;
    const tl = getCellRect(rcToRef(c1, r1));
    const br = getCellRect(rcToRef(c2, r2));
    if (!tl || !br) {
      overlayVisible.value = false;
      return;
    }
    overlayStyle.value = {
      top: `${tl.top}px`,
      left: `${tl.left}px`,
      width: `${br.left + br.width - tl.left}px`,
      height: `${br.top + br.height - tl.top}px`,
    };
    overlayVisible.value = true;
  }

  return {
    overlayStyle,
    overlayVisible,
    updateSelectionOverlay,
  };
}
