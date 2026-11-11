<script setup lang="ts">
import { Keyboard, Sigma, Table2, X } from "lucide-vue-next";
import { useApp } from "@/composables/app";
import MenuBar from "@/components/MenuBar.vue";
import Toolbar from "@/components/Toolbar.vue";
import FormulaBar from "@/components/FormulaBar.vue";
import Grid from "@/components/Grid.vue";
import CellEditor from "@/components/CellEditor.vue";
import StatusBar from "@/components/StatusBar.vue";
import DateFormatModal from "@/components/modals/DateFormatModal.vue";
import NumberFormatModal from "@/components/modals/NumberFormatModal.vue";

const {
  // core
  sheet,
  gridRef,
  formulaBarRef,
  selectionLabel,
  // editing
  editingCell,
  formulaBarValue,
  handleEditStart,
  handleEditorCommit,
  handleEditorCancel,
  handleEditorUpdate,
  handleEditorNavigate,
  handleFormulaCommit,
  handleFormulaNavigate,
  // modals
  aboutOpen,
  resetConfirmOpen,
  dateFormatOpen,
  numberFormatOpen,
  // actions
  handleAction,
  handleToolbarSetStyle,
  confirmReset,
  handleApplyDateFormat,
  handleClearDateFormat,
  handleApplyNumberFormat,
  handleClearNumberFormat,
} = useApp();
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

<style scoped src="./styles/components/app.css""></style>
