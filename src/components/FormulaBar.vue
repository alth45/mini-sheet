<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Sigma } from "lucide-vue-next";
import type { CellRef } from "@/constants";

/* ---------- Props & Emits ---------- */

const props = defineProps<{
  /** Ref dari sel aktif (contoh: "A1") */
  activeRef: CellRef;
  /** Label untuk namebox (contoh: "A1" atau "A1:C5") */
  selectionLabel: string;
  /** Raw value dari sel aktif */
  rawValue: string;
}>();

const emit = defineEmits<{
  /** Commit value ke sel yang sedang diedit (ref di-capture saat focus). */
  commit: [ref: CellRef, value: string];
  /** User tekan Enter/Tab → parent yang handle navigasi sel. */
  navigate: [direction: "down" | "right"];
}>();

/* ---------- Local state ---------- */

const draft = ref(props.rawValue);
const isFocused = ref(false);
/**
 * Ref yang di-capture saat formula bar difokuskan.
 * Ini krusial: jika user pindah sel saat blur, kita tetap commit
 * ke sel yang BENAR (yang sedang diedit), bukan sel baru.
 */
const editingRef = ref<CellRef | null>(null);

const inputRef = ref<HTMLInputElement | null>(null);

/* ---------- Computed ---------- */

const hasFormula = computed(() => draft.value.trim().startsWith("="));

/* ---------- Sync: props → draft (hanya saat tidak focused) ---------- */

watch(
  () => props.rawValue,
  (val) => {
    // Jangan override saat user sedang mengetik
    if (!isFocused.value) draft.value = val;
  },
);

watch(
  () => props.activeRef,
  (val, prev) => {
    // Saat sel berubah tanpa blur (misal lewat keyboard nav),
    // tetap sinkronkan draft jika tidak focused
    if (!isFocused.value && val !== prev) draft.value = props.rawValue;
  },
);

/* ---------- Handlers ---------- */

function handleFocus() {
  isFocused.value = true;
  editingRef.value = props.activeRef;
  // Sync draft dari nilai terkini (bisa berubah sejak last render)
  draft.value = props.rawValue;
}

function handleBlur() {
  if (!isFocused.value) return;
  isFocused.value = false;

  const ref = editingRef.value;
  editingRef.value = null;
  if (!ref) return;

  // Commit hanya jika value berubah
  if (draft.value !== props.rawValue) {
    emit("commit", ref, draft.value);
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    commitAndBlur();
    emit("navigate", "down");
  } else if (e.key === "Tab") {
    e.preventDefault();
    commitAndBlur();
    emit("navigate", "right");
  } else if (e.key === "Escape") {
    e.preventDefault();
    cancel();
  }
}

function commitAndBlur() {
  const ref = editingRef.value;
  if (!ref) return;
  if (draft.value !== props.rawValue) {
    emit("commit", ref, draft.value);
  }
  isFocused.value = false;
  editingRef.value = null;
  inputRef.value?.blur();
}

function cancel() {
  draft.value = props.rawValue;
  isFocused.value = false;
  editingRef.value = null;
  inputRef.value?.blur();
}

/* ---------- Public API (dipanggil parent via ref) ---------- */

function focus() {
  inputRef.value?.focus();
  inputRef.value?.select();
}

function setValue(val: string) {
  draft.value = val;
  inputRef.value?.focus();
  // Pindahkan cursor ke akhir
  requestAnimationFrame(() => {
    const el = inputRef.value;
    if (el) {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  });
}

defineExpose({ focus, setValue });
</script>

<template>
  <div class="formula-bar">
    <!-- Name box -->
    <div class="namebox" :title="selectionLabel">
      <span class="namebox-text">{{ selectionLabel }}</span>
    </div>

    <!-- fx icon -->
    <div class="fx-icon" aria-hidden="true">
      <Sigma :size="13" :stroke-width="2.25" />
    </div>

    <!-- Formula input -->
    <input
      ref="inputRef"
      v-model="draft"
      class="formula-input"
      :class="{ 'has-formula': hasFormula }"
      type="text"
      spellcheck="false"
      autocomplete="off"
      autocapitalize="off"
      placeholder="Ketik nilai atau rumus, contoh: =SUM(A1:A10)"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeyDown"
    />
  </div>
</template>

<style scoped>
/* =========================================================
   Container
   ========================================================= */
.formula-bar {
  height: var(--formula-h);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
  flex-shrink: 0;
}

/* =========================================================
   Name box
   ========================================================= */
.namebox {
  width: 92px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--slate-50);
  border: 1px solid transparent;
  border-radius: var(--radius);
  padding: 0 8px;
  flex-shrink: 0;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);
}

.namebox:hover {
  background: var(--slate-100);
}

.namebox-text {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--slate-700);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.02em;
}

/* =========================================================
   fx icon
   ========================================================= */
.fx-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-500);
  background: var(--primary-50);
  border-radius: var(--radius);
  flex-shrink: 0;
  user-select: none;
}

/* =========================================================
   Input
   ========================================================= */
.formula-input {
  flex: 1;
  min-width: 0;
  height: 24px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius);
  color: var(--slate-800);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: -0.01em;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.formula-input::placeholder {
  color: var(--slate-400);
  font-family: var(--font-sans);
  font-style: normal;
  letter-spacing: 0;
}

.formula-input:hover {
  background: var(--slate-50);
}

.formula-input:focus {
  background: #fff;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
  outline: none;
}

/* Warna indigo untuk formula (dimulai "=") */
.formula-input.has-formula {
  color: var(--primary-700);
  font-weight: 500;
}
</style>
