<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Keyboard, Sigma, Table2, X } from "lucide-vue-next";
import { useSheet } from "@/composables/useSheet";
import { SEED_DATA, SEED_STYLES } from "@/data/seed";
import {
  rcToRef,
  type CellRef,
  type CellStyle,
  type SheetAction,
} from "@/constants";
import MenuBar from "@/components/MenuBar.vue";
import Toolbar from "@/components/Toolbar.vue";
import FormulaBar from "@/components/FormulaBar.vue";
import Grid from "@/components/Grid.vue";
import CellEditor from "@/components/CellEditor.vue";
import StatusBar from "@/components/StatusBar.vue";
import DateFormatModal from "@/components/modals/DateFormatModal.vue";
import NumberFormatModal from "@/components/modals/NumberFormatModal.vue";
/* ---------- Types ---------- */

interface EditorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface EditingCell {
  ref: CellRef;
  initialValue: string;
  selectAll: boolean;
  position: EditorRect;
}

interface GridExposed {
  getCellRect(ref: CellRef): EditorRect | null;
}

interface FormulaBarExposed {
  focus(): void;
  setValue(val: string): void;
}

/* ---------- State ---------- */

const sheet = useSheet({ data: SEED_DATA, styles: SEED_STYLES });

const editingCell = ref<EditingCell | null>(null);
const editorDraft = ref<string | null>(null);

const aboutOpen = ref(false);
const resetConfirmOpen = ref(false);
const dateFormatOpen = ref(false);
const numberFormatOpen = ref(false);

const gridRef = ref<GridExposed | null>(null);
const formulaBarRef = ref<FormulaBarExposed | null>(null);

/* ---------- Derived ---------- */

const selectionLabel = computed(() => {
  const r = sheet.selRect.value;
  if (r.r1 === r.r2 && r.c1 === r.c2) return sheet.activeRef.value;
  return `${rcToRef(r.c1, r.r1)}:${rcToRef(r.c2, r.r2)}`;
});

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

/* =========================================================
   Editing lifecycle
   ========================================================= */

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

/* =========================================================
   Formula bar
   ========================================================= */

function handleFormulaCommit(ref: CellRef, value: string) {
  sheet.setRaw(ref, value);
}

function handleFormulaNavigate(direction: "down" | "right") {
  if (direction === "down") sheet.moveSelection(1, 0, false);
  else sheet.moveSelection(0, 1, false);
}

/* =========================================================
   Action dispatcher (menu + toolbar)
   ========================================================= */

function handleAction(action: SheetAction) {
  if (action === "new") {
    resetConfirmOpen.value = true;
    return;
  }
  if (action === "about") {
    aboutOpen.value = true;
    return;
  }
  if (action === "open-custom-date") {
    dateFormatOpen.value = true;
    return;
  }
  if (action === "open-custom-number") {
    numberFormatOpen.value = true;
    return;
  }
  const result = sheet.dispatch(action);
  if (typeof result === "string") {
    formulaBarRef.value?.setValue(result);
  }
}

function handleToolbarSetStyle(key: keyof CellStyle, value: unknown) {
  sheet.setStyle(key, value as never);
}

function confirmReset() {
  resetConfirmOpen.value = false;
  sheet.dispatch("new");
}

function handleApplyDateFormat(pattern: string) {
  sheet.setCustomDateFormat(pattern);
  dateFormatOpen.value = false;
}

function handleClearDateFormat() {
  sheet.setCustomDateFormat(null);
  dateFormatOpen.value = false;
}

function handleApplyNumberFormat(pattern: string) {
  sheet.setCustomNumberFormat(pattern);
  numberFormatOpen.value = false;
}

function handleClearNumberFormat() {
  sheet.setCustomNumberFormat(null);
  numberFormatOpen.value = false;
}

/* =========================================================
   Global keyboard handler
   ========================================================= */

function onGlobalKeyDown(e: KeyboardEvent) {
  // Modal terbuka? Hanya Escape yang valid
  if (aboutOpen.value || resetConfirmOpen.value) {
    if (e.key === "Escape") {
      e.preventDefault();
      aboutOpen.value = false;
      resetConfirmOpen.value = false;
    }
    return;
  }

  // Sedang edit sel? Editor yang handle
  if (editingCell.value) return;

  // Fokus di input/select/textarea? Biarkan browser
  const tag = (e.target as HTMLElement | null)?.tagName?.toUpperCase() ?? "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

  const ctrl = e.ctrlKey || e.metaKey;

  // Ctrl shortcuts
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

  // Navigation
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

  // Ketikan karakter biasa → mulai edit
  if (e.key.length === 1 && !ctrl && !e.altKey) {
    e.preventDefault();
    startEdit(sheet.activeRef.value, false, e.key);
  }
}

/* ---------- Lifecycle ---------- */

onMounted(() => {
  document.addEventListener("keydown", onGlobalKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onGlobalKeyDown);
});
</script>

<template>
  <div class="app">
    <MenuBar @action="handleAction" />

    <Toolbar
      :active-style="sheet.activeStyle.value"
      @action="handleAction"
      @set-style="handleToolbarSetStyle"
    />

    <FormulaBar
      ref="formulaBarRef"
      :active-ref="sheet.activeRef.value"
      :selection-label="selectionLabel"
      :raw-value="formulaBarValue"
      @commit="handleFormulaCommit"
      @navigate="handleFormulaNavigate"
    />

    <Grid
      ref="gridRef"
      :sheet="sheet"
      :editing-ref="editingCell?.ref ?? null"
      @edit-start="handleEditStart"
    >
      <template #overlay>
        <CellEditor
          v-if="editingCell"
          :key="editingCell.ref"
          :initial-value="editingCell.initialValue"
          :position="editingCell.position"
          :style="sheet.styleFor(editingCell.ref)"
          :select-all="editingCell.selectAll"
          @commit="handleEditorCommit"
          @cancel="handleEditorCancel"
          @update="handleEditorUpdate"
          @navigate="handleEditorNavigate"
        />
      </template>
    </Grid>

    <StatusBar
      :selection-label="selectionLabel"
      :stats="sheet.stats.value"
      :is-editing="!!editingCell"
    />

    <!-- ============================================================
         About modal
         ============================================================ -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="aboutOpen"
          class="modal-backdrop"
          @click.self="aboutOpen = false"
        >
          <div class="modal-panel" role="dialog" aria-modal="true">
            <header class="modal-header">
              <div class="modal-brand">
                <div class="modal-logo">
                  <Table2 :size="16" :stroke-width="2.25" />
                </div>
                <div>
                  <h2 class="modal-title">MiniSheet</h2>
                  <p class="modal-subtitle">
                    Spreadsheet sederhana · v2.0 · Vue Edition
                  </p>
                </div>
              </div>
              <button
                type="button"
                class="modal-close"
                aria-label="Tutup"
                @click="aboutOpen = false"
              >
                <X :size="16" />
              </button>
            </header>

            <div class="modal-body">
              <section>
                <h3 class="section-title">
                  <Sigma :size="13" />
                  Formula Utama
                </h3>
                <div class="formula-grid">
                  <code>=SUM(A1:A10)</code><span>Jumlahkan rentang</span>
                  <code>=AVERAGE(A1:A10)</code><span>Rata-rata</span>
                  <code>=MAX(A1:A10)</code><span>Nilai terbesar</span>
                  <code>=MIN(A1:A10)</code><span>Nilai terkecil</span>
                  <code>=COUNT(A1:A10)</code><span>Hitung sel angka</span>
                  <code>=IF(cond, a, b)</code><span>Kondisional</span>
                </div>
                <p class="hint">
                  Operator: <code>+ - * / ^</code> dan perbandingan
                  <code>= &lt;&gt; &lt; &gt; &lt;= &gt;=</code>
                </p>
              </section>

              <section>
                <h3 class="section-title">
                  <Keyboard :size="13" />
                  Keyboard
                </h3>
                <div class="shortcut-grid">
                  <kbd>Ctrl+B</kbd><span>Tebal</span> <kbd>Ctrl+I</kbd
                  ><span>Miring</span> <kbd>Ctrl+U</kbd><span>Garis bawah</span>
                  <kbd>F2</kbd><span>Mode edit</span> <kbd>Del</kbd
                  ><span>Hapus isi</span> <kbd>Enter</kbd
                  ><span>Pindah ke bawah</span> <kbd>Tab</kbd
                  ><span>Pindah ke kanan</span> <kbd>Shift+Enter</kbd
                  ><span>Pindah ke atas</span>
                </div>
              </section>
            </div>

            <footer class="modal-footer">
              <span>Dibangun dengan Vue 3 + TypeScript</span>
              <button
                type="button"
                class="btn-primary"
                @click="aboutOpen = false"
              >
                Tutup
              </button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Date format modal -->
    <DateFormatModal
      v-if="dateFormatOpen"
      :current-pattern="
        sheet.activeStyle.value.customDateFormat ?? 'DD/MM/YYYY'
      "
      :preview-value="sheet.rawFor(sheet.activeRef.value)"
      @apply="handleApplyDateFormat"
      @clear="handleClearDateFormat"
      @close="dateFormatOpen = false"
    />

    <!-- Number format modal -->
    <NumberFormatModal
      v-if="numberFormatOpen"
      :current-pattern="
        sheet.activeStyle.value.customNumberFormat ?? '#.##0,00'
      "
      :preview-value="sheet.rawFor(sheet.activeRef.value)"
      @apply="handleApplyNumberFormat"
      @clear="handleClearNumberFormat"
      @close="numberFormatOpen = false"
    />

    <!-- ============================================================
         Reset confirm modal
         ============================================================ -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="resetConfirmOpen"
          class="modal-backdrop"
          @click.self="resetConfirmOpen = false"
        >
          <div
            class="modal-panel modal-sm"
            role="alertdialog"
            aria-modal="true"
          >
            <header class="modal-header">
              <div>
                <h2 class="modal-title">Reset lembar?</h2>
                <p class="modal-subtitle">
                  Semua data dan format akan dihapus. Tindakan ini tidak bisa
                  dibatalkan.
                </p>
              </div>
            </header>
            <footer class="modal-footer">
              <button
                type="button"
                class="btn-secondary"
                @click="resetConfirmOpen = false"
              >
                Batal
              </button>
              <button type="button" class="btn-danger" @click="confirmReset">
                Reset
              </button>
            </footer>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* =========================================================
   App shell
   ========================================================= */
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
}

/* =========================================================
   Modal
   ========================================================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-panel {
  background: #fff;
  border-radius: var(--radius-xl);
  box-shadow:
    0 25px 50px -12px rgba(15, 23, 42, 0.25),
    0 0 0 1px rgba(15, 23, 42, 0.05);
  max-width: 520px;
  width: 100%;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-panel.modal-sm {
  max-width: 400px;
}

/* ---------- Header ---------- */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
}

.modal-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.35);
  flex-shrink: 0;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--slate-900);
  margin: 0;
  letter-spacing: -0.01em;
}

.modal-subtitle {
  font-size: 12px;
  color: var(--slate-500);
  margin: 2px 0 0;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--slate-500);
  border-radius: var(--radius);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-close:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

/* ---------- Body ---------- */
.modal-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--slate-500);
  margin: 0 0 10px;
}

.formula-grid,
.shortcut-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 14px;
  row-gap: 7px;
  align-items: center;
}

.formula-grid code,
.shortcut-grid kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 3px 7px;
  background: var(--slate-100);
  border: 1px solid var(--slate-200);
  border-radius: var(--radius-sm);
  color: var(--slate-700);
  white-space: nowrap;
  justify-self: start;
}

.formula-grid code {
  color: var(--primary-700);
  background: var(--primary-50);
  border-color: var(--primary-200);
}

.shortcut-grid span,
.formula-grid span {
  font-size: 12px;
  color: var(--slate-600);
}

.hint {
  font-size: 11px;
  color: var(--slate-500);
  margin: 12px 0 0;
}

.hint code {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--slate-700);
  background: var(--slate-100);
  padding: 1px 5px;
  border-radius: 3px;
}

/* ---------- Footer ---------- */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--slate-50);
  font-size: 11px;
  color: var(--slate-500);
}

.btn-primary,
.btn-secondary,
.btn-danger {
  height: 30px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.btn-primary {
  background: var(--primary-500);
  color: #fff;
  box-shadow: 0 1px 2px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  background: var(--primary-600);
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.btn-secondary {
  background: #fff;
  color: var(--slate-700);
  border-color: var(--slate-300);
}

.btn-secondary:hover {
  background: var(--slate-50);
}

.btn-danger {
  background: var(--danger-500);
  color: #fff;
  box-shadow: 0 1px 2px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover {
  background: #dc2626;
}

/* ---------- Transitions ---------- */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 150ms var(--ease);
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    transform 180ms var(--ease),
    opacity 180ms var(--ease);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}
</style>
