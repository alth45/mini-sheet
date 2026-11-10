<script setup lang="ts">
import type { CellRef } from '@/constants'
import type { SheetApi } from '@/composables/useSheet'
import { useGrid } from '@/composables/grid'

/* ---------- Props & Emits ---------- */
const props = defineProps<{
  sheet: SheetApi
  editingRef: CellRef | null
}>()

const emit = defineEmits<{
  editStart: [ref: CellRef, selectAll: boolean]
  scroll: []
}>()

/* ---------- Semua logic dari composable ---------- */
const {
  // refs
  gridWrapRef,
  tbodyRef,
  // template constants
  COLS_LIST,
  ROW_NUMS,
  rowHeadStyle,
  rowHeightStyle,
  // computed & style
  tableWidth,
  colStyleFor,
  getCellRect,
  onScroll,
  // cells
  displayMap: _displayMap, // tidak dipakai langsung di template, tapi tersedia
  isInRange,
  isActive,
  colIsSelected,
  rowIsSelected,
  cellStyle,
  cellText,
  // selection
  onCellMouseDown,
  onCellDblClick,
  onCornerMouseDown,
  onColMouseDown,
  onRowMouseDown,
  // overlay
  overlayStyle,
  overlayVisible,
  // fill
  fillPreviewStyle,
  onFillHandleMouseDown,
  // resize
  onResizeStart,
  onResizeReset,
} = useGrid(props, emit)

defineExpose({ getCellRect })
</script>

<template>
  <div ref="gridWrapRef" class="grid-wrap" @scroll="onScroll">
    <table class="sheet" :style="{ width: tableWidth + 'px' }">
      <thead>
        <tr>
          <!-- Corner: select-all -->
          <th
            class="corner"
            :style="rowHeadStyle"
            title="Pilih semua"
            @mousedown="onCornerMouseDown"
          />

          <!-- Column headers -->
          <th
            v-for="(col, c) in COLS_LIST"
            :key="col"
            class="colhead"
            :class="{ hl: colIsSelected(c) }"
            :style="colStyleFor(c)"
            @mousedown="onColMouseDown(c, $event)"
          >
            {{ col }}
            <div
              class="col-resize-handle"
              title="Drag untuk ubah lebar · dblclick untuk reset"
              @mousedown.stop.prevent="onResizeStart(c, $event)"
              @dblclick.stop.prevent="onResizeReset(c)"
            />
          </th>
        </tr>
      </thead>

      <tbody ref="tbodyRef">
        <tr v-for="(rowNum, r) in ROW_NUMS" :key="rowNum">
          <!-- Row header -->
          <th
            class="rowhead"
            :class="{ hl: rowIsSelected(r) }"
            :style="rowHeadStyle"
            @mousedown="onRowMouseDown(r, $event)"
          >
            {{ rowNum }}
          </th>

          <!-- Cells -->
          <td
            v-for="(col, c) in COLS_LIST"
            :key="col"
            :data-ref="col + rowNum"
            class="cell"
            :class="{
              active: isActive(col + rowNum),
              'in-range': isInRange(col + rowNum),
            }"
            :style="{ ...cellStyle(col + rowNum), ...rowHeightStyle }"
            @mousedown="onCellMouseDown(col + rowNum, $event)"
            @dblclick="onCellDblClick(col + rowNum)"
          >
            {{ cellText(col + rowNum) }}
          </td>
        </tr>
      </tbody>
    </table>
    <div
      v-if="overlayVisible"
      class="selection-overlay"
      :style="overlayStyle ?? {}"
    >
      <div
        v-if="!editingRef"
        class="fill-handle"
        title="Drag untuk copy"
        @mousedown="onFillHandleMouseDown"
      />
    </div>

    <!-- Preview target fill (dashed) -->

    <div
      v-if="fillPreviewStyle"
      class="fill-preview"
      :style="fillPreviewStyle"
    />

    <slot name="overlay" />
  </div>
</template>
<style scoped src="../styles/components/grid.css""></style>
