import { computed, ref, type Ref } from "vue";
import type { CellRef } from "@/constants";
import type { SheetApi } from "@/composables/useSheet";
import type { EditingCell, GridExposed } from "./types";

/**
 * Editing lifecycle:
 * - state: editingCell, editorDraft
 * - computed: formulaBarValue (live sync saat edit)
 * - handlers: commit, cancel, update, navigate
 */
export function useEditing(sheet: SheetApi, gridRef: Ref<GridExposed | null>) {
  const editingCell = ref<EditingCell | null>(null);
  const editorDraft = ref<string | null>(null);

  /* ---------- Derived ---------- */

  /**
   * Nilai yang tampil di formula bar:
   * - saat editing sel → ikut draft editor (live)
   * - selain itu → raw value sel aktif
   */
  const formulaBarValue = computed(() => {
    if (editingCell.value && editorDraft.value !== null) {
      return editorDraft.value;
    }
    return sheet.rawFor(sheet.activeRef.value);
  });

  /* ---------- Editing lifecycle ---------- */

  function startEdit(ref: CellRef, selectAll = false, initialValue?: string) {
    const pos = gridRef.value?.getCellRect(ref);
    if (!pos) return;
    const initial = initialValue ?? sheet.rawFor(ref);
    editingCell.value = {
      ref,
      initialValue: initial,
      selectAll,
      position: pos,
    };
    editorDraft.value = initial;
  }

  function handleEditStart(ref: CellRef, selectAll: boolean) {
    startEdit(ref, selectAll);
  }

  function handleEditorCommit(value: string) {
    const ec = editingCell.value;
    if (!ec) return;
    sheet.setRaw(ec.ref, value);
    editingCell.value = null;
    editorDraft.value = null;
  }

  function handleEditorCancel() {
    editingCell.value = null;
    editorDraft.value = null;
  }

  function handleEditorUpdate(value: string) {
    editorDraft.value = value;
  }

  function handleEditorNavigate(direction: "down" | "right") {
    if (direction === "down") sheet.moveSelection(1, 0, false);
    else sheet.moveSelection(0, 1, false);
  }

  /* ---------- Formula bar ---------- */

  function handleFormulaCommit(ref: CellRef, value: string) {
    sheet.setRaw(ref, value);
  }

  function handleFormulaNavigate(direction: "down" | "right") {
    if (direction === "down") sheet.moveSelection(1, 0, false);
    else sheet.moveSelection(0, 1, false);
  }

  /* ---------- Public API ---------- */

  return {
    editingCell,
    editorDraft,
    formulaBarValue,
    startEdit,
    handleEditStart,
    handleEditorCommit,
    handleEditorCancel,
    handleEditorUpdate,
    handleEditorNavigate,
    handleFormulaCommit,
    handleFormulaNavigate,
  };
}
