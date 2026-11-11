import { computed, ref } from "vue";
import { rcToRef } from "@/constants";
import { useSheet } from "@/composables/useSheet";
import { SEED_DATA, SEED_STYLES } from "@/data/seed";
import { useEditing } from "./useEditing";
import { useModals } from "./useModals";
import { useAppActions } from "./useAppActions";
import { useAppKeyboard } from "./useAppKeyboard";
import type { FormulaBarExposed, GridExposed } from "./types";

/**
 * Orchestrator App.vue.
 * Menyatukan sheet + editing + modals + actions + keyboard.
 */
export function useApp() {
  /* ---------- Core ---------- */

  const sheet = useSheet({ data: SEED_DATA, styles: SEED_STYLES });

  const gridRef = ref<GridExposed | null>(null);
  const formulaBarRef = ref<FormulaBarExposed | null>(null);

  /* ---------- Sub-composables ---------- */

  const modals = useModals();
  const editing = useEditing(sheet, gridRef);
  const actions = useAppActions(sheet, modals, formulaBarRef);

  /* ---------- Derived ---------- */

  const selectionLabel = computed(() => {
    const r = sheet.selRect.value;
    if (r.r1 === r.r2 && r.c1 === r.c2) return sheet.activeRef.value;
    return `${rcToRef(r.c1, r.r1)}:${rcToRef(r.c2, r.r2)}`;
  });

  /* ---------- Keyboard ---------- */

  useAppKeyboard({
    sheet,
    editingCell: editing.editingCell,
    anyModalOpen: () => modals.anyOpen.value,
    closeAllModals: modals.closeAll,
    startEdit: editing.startEdit,
    handleAction: actions.handleAction,
  });

  /* ---------- Public API (flat) ---------- */

  return {
    sheet,
    gridRef,
    formulaBarRef,
    selectionLabel,
    ...editing,
    ...modals,
    ...actions,
  };
}

export type AppApi = ReturnType<typeof useApp>;
