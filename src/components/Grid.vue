<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {
  COLS,
  NROWS,
  COL_W,
  ROW_HEAD_W,
  ROW_H,
  refToRC,
  rcToRef,
  type CellRef,
  type CellStyle,
  type SelectionRect,
} from "@/constants";
import type { SheetApi, CellRender } from "@/composables/useSheet";

/* ---------- Types ---------- */

export interface CellRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/* ---------- Props & Emits ---------- */

const props = defineProps<{
  sheet: SheetApi;
  editingRef: CellRef | null;
}>();

const emit = defineEmits<{
  /** User memicu mulai edit (double-click). */
  editStart: [ref: CellRef, selectAll: boolean];
  /** Scroll happened — parent repositions CellEditor. */
  scroll: [];
}>();

/* ---------- Refs ---------- */

const gridWrapRef = ref<HTMLElement | null>(null);
const tbodyRef = ref<HTMLTableSectionElement | null>(null);

/* ---------- Constants for template ---------- */

const COLS_LIST = COLS;
const ROW_NUMS = Array.from({ length: NROWS }, (_, i) => i + 1);
const rowHeadStyle = { width: `${ROW_HEAD_W}px`, minWidth: `${ROW_HEAD_W}px` };
const rowHeightStyle = { height: `${ROW_H}px` };

/* ---------- Computed ---------- */

/**
 * Peta display semua sel. Re-compute saat `data` berubah.
 * Untuk 30×10 = 300 sel, biaya negligible — dan lebih
 * sederhana daripada reactive per-cell (yang butuh `<SheetCell>`).
 */
const displayMap = computed<Record<CellRef, CellRender>>(() => {
  const map: Record<CellRef, CellRender> = {};
  for (let r = 0; r < NROWS; r++) {
    for (let c = 0; c < COLS.length; c++) {
      const ref = rcToRef(c, r);
      map[ref] = props.sheet.renderCell(ref);
    }
  }
  return map;
});

/* ---------- Column widths ---------- */

function colStyleFor(c: number): Record<string, string> {
  const w = props.sheet.colWidths[c];
  return { width: `${w}px`, minWidth: `${w}px` };
}

const tableWidth = computed(
  () => ROW_HEAD_W + props.sheet.colWidths.reduce((s, w) => s + w, 0),
);

/* ---------- Selection helpers ---------- */

function isInRange(ref: CellRef): boolean {
  const pos = refToRC(ref);
  if (!pos) return false;
  const { r1, r2, c1, c2 } = props.sheet.selRect.value;
  return pos.r >= r1 && pos.r <= r2 && pos.c >= c1 && pos.c <= c2;
}

function isActive(ref: CellRef): boolean {
  return ref === props.sheet.activeRef.value;
}

function colIsSelected(c: number): boolean {
  const { c1, c2 } = props.sheet.selRect.value;
  return c >= c1 && c <= c2;
}

function rowIsSelected(r: number): boolean {
  const { r1, r2 } = props.sheet.selRect.value;
  return r >= r1 && r <= r2;
}

/* ---------- Cell style & text ---------- */

function cellStyle(ref: CellRef): Record<string, string> {
  const s: CellStyle = props.sheet.styleFor(ref);
  const d = displayMap.value[ref];
  const out: Record<string, string> = {};

  if (s.fontFamily) out.fontFamily = s.fontFamily;
  if (s.fontSize) out.fontSize = `${s.fontSize}px`;
  if (s.bold) out.fontWeight = "700";
  if (s.italic) out.fontStyle = "italic";
  if (s.underline) out.textDecoration = "underline";
  if (s.color) out.color = s.color;
  if (s.bg) out.backgroundColor = s.bg;

  if (s.align) {
    out.textAlign = s.align;
  } else {
    out.textAlign = d?.isNumeric ? "right" : "left";
  }

  if (d?.error) {
    out.color = "var(--danger-700)";
    out.fontWeight = "600";
  }

  return out;
}

function cellText(ref: CellRef): string {
  if (ref === props.editingRef) return "";
  return displayMap.value[ref]?.display ?? "";
}

/* ---------- Drag state (plain vars — tidak perlu reactive) ---------- */

let dragging = false;

/* ---------- Cell mouse handlers ---------- */

function onCellMouseDown(ref: CellRef, e: MouseEvent) {
  if (e.button !== 0) return;
  e.preventDefault();

  if (e.shiftKey) {
    props.sheet.selEnd.value = ref;
  } else {
    props.sheet.selectCell(ref);
  }
  dragging = true;
}

function onCellDblClick(ref: CellRef) {
  props.sheet.selectCell(ref);
  emit("editStart", ref, true);
}

/* ---------- Header click handlers ---------- */

function onCornerMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  props.sheet.selStart.value = rcToRef(0, 0);
  props.sheet.selEnd.value = rcToRef(COLS.length - 1, NROWS - 1);
  props.sheet.activeRef.value = rcToRef(0, 0);
}

function onColMouseDown(c: number, e: MouseEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  const top = rcToRef(c, 0);
  const bottom = rcToRef(c, NROWS - 1);
  if (e.shiftKey) {
    props.sheet.selEnd.value = bottom;
  } else {
    props.sheet.selStart.value = top;
    props.sheet.selEnd.value = bottom;
    props.sheet.activeRef.value = top;
  }
  dragging = true;
}

function onRowMouseDown(r: number, e: MouseEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  const left = rcToRef(0, r);
  const right = rcToRef(COLS.length - 1, r);
  if (e.shiftKey) {
    props.sheet.selEnd.value = right;
  } else {
    props.sheet.selStart.value = left;
    props.sheet.selEnd.value = right;
    props.sheet.activeRef.value = left;
  }
  dragging = true;
}

/* ---------- Document-level drag tracking ---------- */

function onDocMouseMove(e: MouseEvent) {
  if (resizing) {
    handleResizeMove(e);
    return;
  }
  if (filling) {
    handleFillMove(e);
    return;
  }
  if (!dragging) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const td = el instanceof Element ? el.closest("td.cell") : null;
  if (!td) return;
  const ref = (td as HTMLElement).dataset.ref;
  if (ref && ref !== props.sheet.selEnd.value) {
    props.sheet.selEnd.value = ref;
  }
}

function onDocMouseUp() {
  if (resizing) {
    commitResize();
    return;
  }
  if (filling) {
    commitFill();
    return;
  }
  dragging = false;
}

/* ---------- Scroll ---------- */

function onScroll() {
  emit("scroll");
}

/* ---------- Auto scroll active cell into view ---------- */

function scrollToRef(ref: CellRef) {
  const td = tbodyRef.value?.querySelector(
    `td.cell[data-ref="${ref}"]`,
  ) as HTMLElement | null;
  td?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

watch(
  () => props.sheet.activeRef.value,
  (ref) => scrollToRef(ref),
);

// Lebar kolom berubah → overlay & preview perlu re-measure
watch(
  () => props.sheet.colWidths,
  () => {
    updateSelectionOverlay();
    updateFillPreview();
  },
  { flush: "post", deep: true },
);

/* ---------- Public API (for CellEditor positioning) ---------- */

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

defineExpose({ getCellRect });

/* ---------- Selection range overlay ---------- */

/* ---------- Selection range overlay ---------- */

const overlayStyle = ref<Record<string, string> | null>(null);
const overlayVisible = ref(false);

function updateSelectionOverlay() {
  const { r1, r2, c1, c2 } = props.sheet.selRect.value;
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

watch(
  () => props.sheet.selRect.value,
  () => updateSelectionOverlay(),
  { flush: "post" },
);

/* ---------- Fill handle drag ---------- */

let filling = false;
let fillSource: SelectionRect | null = null;
let fillTarget: SelectionRect | null = null;
const fillPreviewStyle = ref<Record<string, string> | null>(null);

function onFillHandleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  const src = props.sheet.selRect.value;
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
  // Tidak ada preview jika target == source
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

/* ---------- Column resize ---------- */

let resizing = false;
let resizeCol = -1;
let resizeStartX = 0;
let resizeStartW = 0;

function onResizeStart(c: number, e: MouseEvent) {
  if (e.button !== 0) return;
  if (props.editingRef) return;
  e.preventDefault();
  e.stopPropagation();

  resizing = true;
  resizeCol = c;
  resizeStartX = e.clientX;
  resizeStartW = props.sheet.colWidths[c];
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function handleResizeMove(e: MouseEvent) {
  if (!resizing) return;
  const dx = e.clientX - resizeStartX;
  props.sheet.setColWidth(resizeCol, resizeStartW + dx);
}

function commitResize() {
  resizing = false;
  resizeCol = -1;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}

function onResizeReset(c: number) {
  props.sheet.setColWidth(c, COL_W);
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

  props.sheet.fillRange(src, tgt);
}

// Re-measure saat window resize (font load, zoom, dsb)
function onWindowResize() {
  updateSelectionOverlay();
}

/* ---------- Lifecycle ---------- */

onMounted(async () => {
  document.addEventListener("mousemove", onDocMouseMove);
  document.addEventListener("mouseup", onDocMouseUp);
  window.addEventListener("resize", onWindowResize);
  await nextTick();
  updateSelectionOverlay();
});

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onDocMouseMove);
  document.removeEventListener("mouseup", onDocMouseUp);
  window.removeEventListener("resize", onWindowResize);
});
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

<style scoped>
/* =========================================================
   Grid wrapper
   ========================================================= */
.grid-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bg-surface);
  position: relative;
}

.sheet {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 12px;
  user-select: none;
}

/* =========================================================
   Headers (sticky)
   ========================================================= */
.sheet thead th,
.sheet tbody th {
  background: var(--slate-50);
  color: var(--slate-500);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.02em;
  text-align: center;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  height: 28px;
  padding: 0 4px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none;
}

/* Col headers sticky top */
.sheet thead th {
  position: sticky;
  top: 0;
  z-index: 3;
}

/* Row headers sticky left */
.sheet tbody th {
  position: sticky;
  left: 0;
  z-index: 2;
}

/* Corner sticky both */
.sheet thead th.corner {
  left: 0;
  z-index: 5;
  cursor: pointer;
  border-right: 1px solid var(--border-strong);
  position: sticky;
  background: var(--slate-50);
}

/* Corner triangle hint */
.sheet thead th.corner::after {
  content: "";
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 5px 5px;
  border-color: transparent transparent var(--slate-400) transparent;
  pointer-events: none;
}

/* Clickable headers */
.sheet thead th.colhead,
.sheet tbody th.rowhead {
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.sheet thead th.colhead:hover,
.sheet tbody th.rowhead:hover {
  background: var(--slate-100);
  color: var(--slate-700);
}

/* Highlighted headers (in-selection) */
.sheet thead th.hl,
.sheet tbody th.hl {
  background: var(--primary-50);
  color: var(--primary-700);
}

/* =========================================================
   Column resize handle
   ========================================================= */
.col-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 2;
  user-select: none;
  touch-action: none;
}

/* Garis feedback saat hover — subtle */
.col-resize-handle::after {
  content: "";
  position: absolute;
  top: 20%;
  bottom: 20%;
  left: 50%;
  width: 1.5px;
  background: var(--primary-500);
  border-radius: 1px;
  transform: translateX(-50%) scaleY(0);
  transform-origin: center;
  opacity: 0;
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

.sheet thead th.colhead:hover .col-resize-handle::after {
  opacity: 1;
  transform: translateX(-50%) scaleY(1);
}

/* =========================================================
   Cells
   ========================================================= */
.sheet td.cell {
  padding: 0 5px;
  font-size: 12px;
  font-weight: 400;
  color: var(--slate-800);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: #fff;
  cursor: cell;
  position: relative;
}

/* Tint seluruh sel dalam range (subtle) */

.sheet td.cell.in-range {
  box-shadow: inset 0 0 0 9999px rgba(99, 102, 241, 0.06);
}

/* =========================================================
+   Selection overlay + fill handle
+   ========================================================= */
.selection-overlay {
  position: absolute;
  pointer-events: none;
  border: 2px solid var(--primary-500);
  box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.15);
  z-index: 2;
  box-sizing: border-box;
}

.fill-handle {
  position: absolute;
  right: -4px;
  bottom: -4px;
  width: 8px;
  height: 8px;
  background: var(--primary-500);
  border: 1px solid #fff;
  border-radius: 1px;
  cursor: crosshair;
  pointer-events: auto;
  box-sizing: border-box;
  transition: background-color var(--dur) var(--ease);
}

.fill-handle::before {
  content: "";
  position: absolute;
  inset: -4px;
}

.fill-handle:hover {
  background: var(--primary-600);
}

/* Preview target (dashed) */
.fill-preview {
  position: absolute;
  pointer-events: none;
  border: 1.5px dashed var(--primary-500);
  background: rgba(99, 102, 241, 0.04);
  border-radius: 1px;
  box-sizing: border-box;
  z-index: 1;
}
</style>
