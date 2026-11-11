import type { Ref } from "vue";
import type { CellStyle, SheetAction } from "@/constants";
import type { SheetApi } from "@/composables/useSheet";
import type { FormulaBarExposed } from "./types";
import type { ModalsApi } from "./useModals";

/**
 * Semua action handler yang di-trigger dari MenuBar / Toolbar / Modal:
 * - `handleAction` — dispatch ke sheet atau buka modal
 * - `handleToolbarSetStyle` — proxy dari Toolbar
 * - `confirmReset` — konfirmasi reset (dipanggil dari modal)
 * - `handleApplyXFormat` / `handleClearXFormat` — handler modal custom format
 */
export function useAppActions(
  sheet: SheetApi,
  modals: ModalsApi,
  formulaBarRef: Ref<FormulaBarExposed | null>,
) {
  function handleAction(action: SheetAction) {
    // Action yang butuh modal
    if (action === "new") {
      modals.open("reset");
      return;
    }
    if (action === "about") {
      modals.open("about");
      return;
    }
    if (action === "open-custom-date") {
      modals.open("date-format");
      return;
    }
    if (action === "open-custom-number") {
      modals.open("number-format");
      return;
    }

    // Action normal → dispatch ke sheet
    const result = sheet.dispatch(action);
    if (typeof result === "string") {
      formulaBarRef.value?.setValue(result);
    }
  }

  function handleToolbarSetStyle(key: keyof CellStyle, value: unknown) {
    sheet.setStyle(key, value as never);
  }

  function confirmReset() {
    modals.close("reset");
    sheet.dispatch("new");
  }

  /* ---------- Date format modal ---------- */

  function handleApplyDateFormat(pattern: string) {
    sheet.setCustomDateFormat(pattern);
    modals.close("date-format");
  }

  function handleClearDateFormat() {
    sheet.setCustomDateFormat(null);
    modals.close("date-format");
  }

  /* ---------- Number format modal ---------- */

  function handleApplyNumberFormat(pattern: string) {
    sheet.setCustomNumberFormat(pattern);
    modals.close("number-format");
  }

  function handleClearNumberFormat() {
    sheet.setCustomNumberFormat(null);
    modals.close("number-format");
  }

  return {
    handleAction,
    handleToolbarSetStyle,
    confirmReset,
    handleApplyDateFormat,
    handleClearDateFormat,
    handleApplyNumberFormat,
    handleClearNumberFormat,
  };
}
