<script setup lang="ts">
import { computed } from "vue";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Baseline,
  Bold,
  ChevronDown,
  Eraser,
  Italic,
  PaintBucket,
  RotateCcw,
  Underline,
  Percent,
} from "lucide-vue-next";
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  FONT_FAMILIES,
  FONT_SIZES,
  type CellStyle,
  type SheetAction,
} from "@/constants";

/* ---------- Props & Emits ---------- */

const props = defineProps<{
  activeStyle: CellStyle;
}>();

const emit = defineEmits<{
  action: [action: SheetAction];
  setStyle: [key: keyof CellStyle, value: unknown];
}>();

/* ---------- Computed bindings (two-way) ---------- */

const fontFamily = computed({
  get: () => props.activeStyle.fontFamily ?? DEFAULT_FONT_FAMILY,
  set: (v: string) => emit("setStyle", "fontFamily", v),
});

const fontSize = computed({
  get: () => String(props.activeStyle.fontSize ?? DEFAULT_FONT_SIZE),
  set: (v: string) => emit("setStyle", "fontSize", parseInt(v, 10)),
});

const textColor = computed({
  get: () => props.activeStyle.color ?? DEFAULT_TEXT_COLOR,
  set: (v: string) => emit("setStyle", "color", v),
});

const fillColor = computed({
  get: () => props.activeStyle.bg ?? DEFAULT_FILL_COLOR,
  set: (v: string) => emit("setStyle", "bg", v),
});

/* ---------- Active state ---------- */

const isBold = computed(() => !!props.activeStyle.bold);
const isItalic = computed(() => !!props.activeStyle.italic);
const isUnderline = computed(() => !!props.activeStyle.underline);
const align = computed(() => props.activeStyle.align);
const isPercent = computed(() => !!props.activeStyle.percent);
/* ---------- Handlers ---------- */

function trigger(action: SheetAction) {
  emit("action", action);
}
</script>

<template>
  <div class="toolbar">
    <!-- Group: Font -->
    <div class="tb-group">
      <div class="tb-select-wrap">
        <select
          v-model="fontFamily"
          class="tb-select font-family"
          title="Jenis Huruf"
        >
          <option v-for="f in FONT_FAMILIES" :key="f" :value="f">
            {{ f }}
          </option>
        </select>
        <ChevronDown :size="12" class="tb-select-chevron" />
      </div>

      <div class="tb-select-wrap">
        <select
          v-model="fontSize"
          class="tb-select font-size"
          title="Ukuran Huruf"
        >
          <option v-for="s in FONT_SIZES" :key="s" :value="String(s)">
            {{ s }}
          </option>
        </select>
        <ChevronDown :size="12" class="tb-select-chevron" />
      </div>
    </div>

    <div class="tb-divider" />

    <!-- Group: Text formatting -->
    <div class="tb-group">
      <button
        type="button"
        class="tb-btn"
        :class="{ active: isBold }"
        title="Tebal (Ctrl+B)"
        :aria-pressed="isBold"
        @click="trigger('bold')"
      >
        <Bold :size="15" :stroke-width="2.5" />
      </button>
      <button
        type="button"
        class="tb-btn"
        :class="{ active: isItalic }"
        title="Miring (Ctrl+I)"
        :aria-pressed="isItalic"
        @click="trigger('italic')"
      >
        <Italic :size="15" :stroke-width="2.5" />
      </button>
      <button
        type="button"
        class="tb-btn"
        :class="{ active: isUnderline }"
        title="Garis Bawah (Ctrl+U)"
        :aria-pressed="isUnderline"
        @click="trigger('underline')"
      >
        <Underline :size="15" :stroke-width="2.5" />
      </button>
    </div>

    <div class="tb-divider" />

    <!-- Group: Colors -->
    <div class="tb-group">
      <div class="tb-color" title="Warna Teks">
        <Baseline :size="15" :stroke-width="2.25" />
        <div class="tb-color-bar" :style="{ background: textColor }" />
        <input
          v-model="textColor"
          type="color"
          class="tb-color-input"
          aria-label="Warna Teks"
        />
      </div>

      <div class="tb-color" title="Warna Latar Sel">
        <PaintBucket :size="15" :stroke-width="2.25" />
        <div class="tb-color-bar" :style="{ background: fillColor }" />
        <input
          v-model="fillColor"
          type="color"
          class="tb-color-input"
          aria-label="Warna Latar Sel"
        />
      </div>
    </div>

    <div class="tb-divider" />

    <!-- Group: Alignment -->
    <div class="tb-group">
      <button
        type="button"
        class="tb-btn"
        :class="{ active: align === 'left' }"
        title="Rata Kiri"
        @click="trigger('align-left')"
      >
        <AlignLeft :size="15" :stroke-width="2.25" />
      </button>
      <button
        type="button"
        class="tb-btn"
        :class="{ active: align === 'center' }"
        title="Rata Tengah"
        @click="trigger('align-center')"
      >
        <AlignCenter :size="15" :stroke-width="2.25" />
      </button>
      <button
        type="button"
        class="tb-btn"
        :class="{ active: align === 'right' }"
        title="Rata Kanan"
        @click="trigger('align-right')"
      >
        <AlignRight :size="15" :stroke-width="2.25" />
      </button>
    </div>

    <!-- <div class="tb-group">
      <button
        type="button"
        class="tb-btn"
        :class="{ active: align === 'right' }"
        title="Rata Kanan"
        @click="trigger('align-right')"
      >
        <AlignRight :size="15" :stroke-width="2.25" />
      </button>
    </div> -->

    <div class="tb-divider" />

    <!-- Group: Decimal -->

    <div class="tb-group">
      <button
        type="button"
        class="tb-btn tb-decimal"
        title="Kurangi Desimal"
        @click="trigger('decrease-decimal')"
      >
        <span class="tb-decimal-text">.0</span> +
      </button>

      <button
        type="button"
        class="tb-btn tb-decimal"
        title="Tambah Desimal"
        @click="trigger('increase-decimal')"
      >
        <span class="tb-decimal-text">.00</span> +
      </button>

      <button
        type="button"
        class="tb-btn"
        :class="{ active: isPercent }"
        title="Format Persentase"
        :aria-pressed="isPercent"
        @click="trigger('toggle-percent')"
      >
        <Percent :size="15" :stroke-width="2.25" />
      </button>
    </div>

    <div class="tb-spacer" />

    <!-- Group: Danger / reset -->
    <div class="tb-group">
      <button
        type="button"
        class="tb-btn danger"
        title="Hapus Isi (Del)"
        @click="trigger('clear')"
      >
        <Eraser :size="15" :stroke-width="2.25" />
      </button>
      <button
        type="button"
        class="tb-btn"
        title="Reset Lembar"
        @click="trigger('new')"
      >
        <RotateCcw :size="15" :stroke-width="2.25" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* =========================================================
   Toolbar container
   ========================================================= */
.toolbar {
  height: var(--toolbar-h);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 6px;
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  user-select: none;
}

.toolbar::-webkit-scrollbar {
  display: none;
}

.tb-group {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.tb-divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
  flex-shrink: 0;
}

.tb-spacer {
  flex: 1;
  min-width: 8px;
}

/* =========================================================
   Icon button
   ========================================================= */
.tb-btn {
  height: 28px;
  min-width: 28px;
  padding: 0 6px;
  border: none;
  background: transparent;
  color: var(--slate-600);
  border-radius: var(--radius);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.tb-btn:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

.tb-btn.active {
  background: var(--primary-50);
  color: var(--primary-700);
  box-shadow: inset 0 0 0 1px var(--primary-200);
}

.tb-btn:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

.tb-btn.danger:hover {
  background: var(--danger-50);
  color: var(--danger-700);
}

/* =========================================================
   Select (custom chevron)
   ========================================================= */
.tb-select-wrap {
  position: relative;
  display: inline-flex;
}

.tb-select {
  height: 28px;
  padding: 0 24px 0 8px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: var(--radius);
  font-size: 12px;
  font-weight: 500;
  color: var(--slate-700);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.tb-select:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

.tb-select:focus {
  outline: none;
  background: #fff;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.tb-select.font-family {
  width: 140px;
}
.tb-select.font-size {
  width: 64px;
  padding-right: 20px;
}

.tb-select-chevron {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--slate-400);
}

/* =========================================================
   Color picker (icon + swatch bar below)
   ========================================================= */
.tb-color {
  position: relative;
  height: 28px;
  width: 30px;
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  color: var(--slate-600);
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.tb-color:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

.tb-color:focus-within {
  box-shadow: var(--shadow-focus);
}

.tb-color-bar {
  width: 14px;
  height: 3px;
  border-radius: 1px;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.1);
  transition: background-color var(--dur) var(--ease);
}

.tb-color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  padding: 0;
}

/* =========================================================
   Decimal buttons (.0 / .00)
   ========================================================= */
.tb-btn.tb-decimal {
  min-width: 30px;
  padding: 0 6px;
}

.tb-decimal-text {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
  color: inherit;
}
</style>
