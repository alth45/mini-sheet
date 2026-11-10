<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  type CellStyle,
} from "@/constants";

/* ---------- Types ---------- */

interface EditorPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

/* ---------- Props & Emits ---------- */

const props = defineProps<{
  /** Nilai awal (raw, termasuk formula "=...") */
  initialValue: string;
  /** Posisi relatif terhadap grid-wrap (px) */
  position: EditorPosition;
  /** Style sel — dipakai supaya editing terlihat in-place */
  style?: CellStyle;
  /**
   * true  → select semua teks (double-click edit)
   * false → cursor di akhir (mulai mengetik dari karakter)
   */
  selectAll?: boolean;
}>();

const emit = defineEmits<{
  commit: [value: string];
  cancel: [];
  /** Dipancarkan tiap keystroke → parent bisa sync ke formula bar */
  update: [value: string];
  navigate: [direction: "down" | "right"];
}>();

/* ---------- State ---------- */

const draft = ref(props.initialValue);
const inputRef = ref<HTMLInputElement | null>(null);

/** Flag anti double-commit (Enter → commit → blur → commit lagi) */
let done = false;

/* ---------- Style binding ---------- */

const editorStyle = computed(() => {
  const s = props.style ?? {};
  const p = props.position;
  return {
    top: `${p.top}px`,
    left: `${p.left}px`,
    width: `${p.width}px`,
    height: `${p.height}px`,
    fontFamily: s.fontFamily ?? DEFAULT_FONT_FAMILY,
    fontSize: `${s.fontSize ?? DEFAULT_FONT_SIZE}px`,
    fontWeight: s.bold ? "700" : "400",
    fontStyle: s.italic ? "italic" : "normal",
    textDecoration: s.underline ? "underline" : "none",
    color: s.color ?? DEFAULT_TEXT_COLOR,
    textAlign: s.align ?? "left",
  };
});

/* ---------- Lifecycle ---------- */

onMounted(async () => {
  await nextTick();
  const el = inputRef.value;
  if (!el) return;
  el.focus();
  if (props.selectAll) {
    el.select();
  } else {
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }
});

/* ---------- Sync draft → parent ---------- */

watch(draft, (val) => {
  emit("update", val);
});

/* ---------- Actions ---------- */

function commit() {
  if (done) return false;
  done = true;
  emit("commit", draft.value);
  return true;
}

function cancel() {
  if (done) return;
  done = true;
  emit("cancel");
}

/* ---------- Events ---------- */

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
    if (commit()) emit("navigate", "down");
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    e.stopPropagation();
    if (commit()) emit("navigate", "right");
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    cancel();
    return;
  }
  // Cegah grid navigation selama editing (arrow keys, dsb)
  e.stopPropagation();
}

function handleBlur() {
  if (!done) commit();
}
</script>

<template>
  <input
    ref="inputRef"
    v-model="draft"
    type="text"
    class="cell-editor"
    :style="editorStyle"
    spellcheck="false"
    autocomplete="off"
    autocapitalize="off"
    @keydown="handleKeyDown"
    @blur="handleBlur"
  />
</template>

<style scoped>
.cell-editor {
  position: absolute;
  z-index: 50;
  padding: 0 4px;
  background: #fff;
  border: 2px solid var(--primary-500);
  border-radius: 0;
  outline: none;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.22);
  box-sizing: border-box;
  letter-spacing: -0.01em;
}

.cell-editor::selection {
  background: var(--primary-200);
}

.cell-editor::placeholder {
  color: var(--slate-400);
}
</style>
