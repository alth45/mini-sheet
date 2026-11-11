<script setup lang="ts">
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
  Percent,
  RotateCcw,
  Underline,
} from "lucide-vue-next";
import {
  FONT_FAMILIES,
  FONT_SIZES,
  type CellStyle,
  type SheetAction,
} from "@/constants";
import { useToolbar } from "@/composables/toolbar";

/* ---------- Props & Emits ---------- */

const props = defineProps<{
  activeStyle: CellStyle;
}>();

const emit = defineEmits<{
  action: [action: SheetAction];
  setStyle: [key: keyof CellStyle, value: unknown];
}>();

/* ---------- Composable ---------- */

const {
  fontFamily,
  fontSize,
  textColor,
  fillColor,
  isBold,
  isItalic,
  isUnderline,
  align,
  isPercent,
  isCurrency,
  isFormatActive,
  currentFormat,
  currentFormatIcon,
  formatMenuOpen,
  formatMenuRef,
  panelRef,
  triggerRef,
  panelPosition,
  toggleFormatMenu,
  selectFormat,
  getFormatIcon,
  CELL_FORMAT_OPTIONS,
  CheckIcon,
  trigger,
} = useToolbar(() => props.activeStyle, emit);
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

    <div class="tb-divider" />

    <!-- Group: Decimal -->
    <div class="tb-group">
      <button
        type="button"
        class="tb-btn tb-decimal"
        title="Kurangi Desimal"
        @click="trigger('decrease-decimal')"
      >
        <span class="tb-decimal-text">.0</span>
      </button>

      <button
        type="button"
        class="tb-btn tb-decimal"
        title="Tambah Desimal"
        @click="trigger('increase-decimal')"
      >
        <span class="tb-decimal-text">.00</span>
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
      <button
        type="button"
        class="tb-btn"
        :class="{ active: isCurrency }"
        title="Format Rupiah"
        :aria-pressed="isCurrency"
        @click="trigger('toggle-currency')"
      >
        <span class="tb-currency-text">Rp</span>
      </button>
      <!-- Trigger: tetap di dalam toolbar -->
      <div ref="formatMenuRef" class="tb-dropdown">
        <button
          ref="triggerRef"
          type="button"
          class="tb-btn tb-dropdown-trigger"
          :class="{ active: isFormatActive || formatMenuOpen }"
          :title="`Format sel: ${currentFormat}`"
          :aria-expanded="formatMenuOpen"
          aria-haspopup="menu"
          @click="toggleFormatMenu"
        >
          <component :is="currentFormatIcon" :size="14" :stroke-width="2.25" />
          <ChevronDown
            :size="10"
            :stroke-width="2.5"
            class="tb-dropdown-chevron"
          />
        </button>
      </div>

      <!-- Panel: teleport ke body (escape toolbar overflow) -->
      <Teleport to="body">
        <Transition name="tb-dropdown">
          <div
            v-if="formatMenuOpen"
            ref="panelRef"
            class="tb-dropdown-panel"
            role="menu"
            :style="{
              top: panelPosition.top + 'px',
              left: panelPosition.left + 'px',
            }"
          >
            <button
              v-for="opt in CELL_FORMAT_OPTIONS"
              :key="opt.value"
              type="button"
              class="tb-dropdown-item"
              :class="{ active: currentFormat === opt.value }"
              role="menuitemradio"
              :aria-checked="currentFormat === opt.value"
              @click="selectFormat(opt.value)"
            >
              <component
                :is="getFormatIcon(opt.value)"
                :size="14"
                :stroke-width="2"
                class="tb-dropdown-item-icon"
              />
              <div class="tb-dropdown-item-text">
                <span class="tb-dropdown-item-label">{{ opt.label }}</span>
                <span class="tb-dropdown-item-desc">{{ opt.description }}</span>
              </div>
              <span class="tb-dropdown-item-example">{{ opt.example }}</span>
              <component
                v-if="currentFormat === opt.value"
                :is="CheckIcon"
                :size="13"
                :stroke-width="2.5"
                class="tb-dropdown-item-check"
              />
            </button>
          </div>
        </Transition>
      </Teleport>
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

<style scoped src="../styles/components/toolbar.css"></style>
