import { onBeforeUnmount, onMounted, type Ref } from "vue";
import type { CellRef, SheetAction } from "@/constants";
import type { SheetApi } from "@/composables/useSheet";
import type { EditingCell } from "./types";

interface KeyboardDeps {
  sheet: SheetApi;
  editingCell: Ref<EditingCell | null>;
  /** Cek apakah ADA modal yang sedang terbuka. */
  anyModalOpen: () => boolean;
  /** Tutup semua modal (dipanggil saat Escape). */
  closeAllModals: () => void;
  startEdit: (ref: CellRef, selectAll?: boolean, initialValue?: string) => void;
  handleAction: (action: SheetAction) => void;
}

/**
 * Global keyboard handler untuk App.
 * Priority guard:
 *   1. Modal terbuka → hanya Escape
 *   2. Editor aktif → editor yang handle
 *   3. Focus di input/select/textarea → browser handle
 *   4. Global shortcuts (Ctrl+B/I/U/N)
 *   5. Navigation (panah, Enter, Tab, F2, Del, Escape)
 *   6. Typing → start edit
 */
export function useAppKeyboard(deps: KeyboardDeps) {
  const {
    sheet,
    editingCell,
    anyModalOpen,
    closeAllModals,
    startEdit,
    handleAction,
  } = deps;

  function onGlobalKeyDown(e: KeyboardEvent) {
    /* ---------- 1. Modal terbuka ---------- */
    // ✅ Fix bug: sekarang juga menangani Escape untuk date-format
    //    dan number-format modal (sebelumnya hanya about & reset)
    if (anyModalOpen()) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeAllModals();
      }
      return;
    }

    /* ---------- 2. Editor aktif ---------- */
    if (editingCell.value) return;

    /* ---------- 3. Focus di form element ---------- */
    const tag = (e.target as HTMLElement | null)?.tagName?.toUpperCase() ?? "";
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

    const ctrl = e.ctrlKey || e.metaKey;

    /* ---------- 4. Ctrl shortcuts ---------- */
    if (ctrl && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        handleAction("bold");
        return;
      }
      if (k === "i") {
        e.preventDefault();
        handleAction("italic");
        return;
      }
      if (k === "u") {
        e.preventDefault();
        handleAction("underline");
        return;
      }
      if (k === "n") {
        e.preventDefault();
        handleAction("new");
        return;
      }
    }

    /* ---------- 5. Navigation ---------- */
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        sheet.moveSelection(-1, 0, e.shiftKey);
        return;
      case "ArrowDown":
        e.preventDefault();
        sheet.moveSelection(1, 0, e.shiftKey);
        return;
      case "ArrowLeft":
        e.preventDefault();
        sheet.moveSelection(0, -1, e.shiftKey);
        return;
      case "ArrowRight":
        e.preventDefault();
        sheet.moveSelection(0, 1, e.shiftKey);
        return;
      case "Enter":
        e.preventDefault();
        sheet.moveSelection(1, 0, false);
        return;
      case "Tab":
        e.preventDefault();
        sheet.moveSelection(0, e.shiftKey ? -1 : 1, false);
        return;
      case "F2":
        e.preventDefault();
        startEdit(sheet.activeRef.value, true);
        return;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        sheet.clearContent();
        return;
      case "Escape":
        sheet.selectCell(sheet.activeRef.value);
        return;
    }

    /* ---------- 6. Typing → start edit ---------- */
    if (e.key.length === 1 && !ctrl && !e.altKey) {
      e.preventDefault();
      startEdit(sheet.activeRef.value, false, e.key);
    }
  }

  onMounted(() => {
    document.addEventListener("keydown", onGlobalKeyDown);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("keydown", onGlobalKeyDown);
  });
}
