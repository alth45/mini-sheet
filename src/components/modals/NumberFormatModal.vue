<script setup lang="ts">
import { computed, ref } from "vue";
import { Sliders, X } from "lucide-vue-next";
import {
  NUMBER_FORMAT_PRESETS,
  applyCustomNumberFormat,
} from "@/formatters/cellFormat";

const props = defineProps<{
  currentPattern: string;
  previewValue: string;
}>();

const emit = defineEmits<{
  apply: [pattern: string];
  clear: [];
  close: [];
}>();

const selected = ref(props.currentPattern);
const customInput = ref("");

const previewNumber = computed(() => {
  const n = Number(props.previewValue);
  return Number.isFinite(n) ? n : 1500000;
});

function previewFor(pattern: string): string {
  if (!pattern.trim()) return String(previewNumber.value);
  return applyCustomNumberFormat(previewNumber.value, pattern);
}

const currentPreview = computed(() => previewFor(selected.value));

const isCustom = computed(
  () => !NUMBER_FORMAT_PRESETS.some((p) => p.pattern === selected.value),
);

function useCustom() {
  if (customInput.value.trim()) selected.value = customInput.value.trim();
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-panel" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div class="modal-title-group">
            <div class="modal-icon">
              <Sliders :size="16" :stroke-width="2.25" />
            </div>
            <div>
              <h2 class="modal-title">Format Angka Khusus</h2>
              <p class="modal-subtitle">Pilih pola atau tulis format sendiri</p>
            </div>
          </div>
          <button class="modal-close" @click="emit('close')">
            <X :size="16" />
          </button>
        </header>

        <div class="modal-body">
          <div class="preview-box">
            <div class="preview-label">Pratinjau</div>
            <div class="preview-value">{{ currentPreview }}</div>
            <div class="preview-raw">
              Nilai mentah: <code>{{ props.previewValue || "1500000" }}</code>
            </div>
          </div>

          <div class="preset-grid">
            <button
              v-for="preset in NUMBER_FORMAT_PRESETS"
              :key="preset.pattern"
              type="button"
              class="preset-card"
              :class="{ active: selected === preset.pattern }"
              @click="selected = preset.pattern"
            >
              <div class="preset-label">{{ preset.label }}</div>
              <div class="preset-example">{{ previewFor(preset.pattern) }}</div>
            </button>
          </div>

          <div class="custom-section">
            <label class="custom-label">Pola kustom</label>
            <div class="custom-input-row">
              <input
                v-model="customInput"
                type="text"
                class="custom-input"
                placeholder="Contoh: #.##0,00 atau Rp #.##0"
                spellcheck="false"
                @keydown.enter="useCustom"
              />
              <button class="btn-secondary" @click="useCustom">Gunakan</button>
            </div>
            <p class="custom-hint">
              Token: <code>#</code> <code>0</code> digit · <code>.</code> ribuan
              · <code>,</code> desimal · <code>%</code> persen · teks literal
              (mis. <code>Rp </code>)
            </p>
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn-secondary" @click="emit('clear')">
            Hapus Format
          </button>
          <div class="footer-right">
            <button class="btn-secondary" @click="emit('close')">Batal</button>
            <button class="btn-primary" @click="emit('apply', selected)">
              Terapkan
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Sama seperti DateFormatModal — copy dari file #6 */
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
  max-width: 560px;
  width: 100%;
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--border);
}
.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.modal-icon {
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
  font-size: 14px;
  font-weight: 700;
  color: var(--slate-900);
  margin: 0;
}
.modal-subtitle {
  font-size: 11.5px;
  color: var(--slate-500);
  margin: 1px 0 0;
}
.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--slate-500);
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}
.modal-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.preview-box {
  background: var(--slate-50);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
}
.preview-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--slate-500);
  margin-bottom: 6px;
}
.preview-value {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-700);
  margin-bottom: 4px;
}
.preview-raw {
  font-size: 11px;
  color: var(--slate-500);
}
.preview-raw code {
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 1px 5px;
  background: #fff;
  border-radius: 3px;
  border: 1px solid var(--slate-200);
}
.preset-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.preset-card {
  text-align: left;
  padding: 10px 12px;
  border: 1px solid var(--border);
  background: #fff;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all var(--dur) var(--ease);
}
.preset-card:hover {
  border-color: var(--primary-400);
  background: var(--primary-50);
}
.preset-card.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}
.preset-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--slate-800);
  margin-bottom: 3px;
}
.preset-card.active .preset-label {
  color: var(--primary-700);
}
.preset-example {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--slate-500);
}
.preset-card.active .preset-example {
  color: var(--primary-600);
}
.custom-section {
  padding-top: 4px;
}
.custom-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--slate-600);
  margin-bottom: 6px;
}
.custom-input-row {
  display: flex;
  gap: 8px;
}
.custom-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  font-family: var(--font-mono);
  font-size: 12px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: #fff;
  color: var(--slate-800);
  outline: none;
  transition: all var(--dur) var(--ease);
}
.custom-input:focus {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}
.custom-hint {
  margin: 8px 0 0;
  font-size: 10.5px;
  color: var(--slate-500);
  line-height: 1.6;
}
.custom-hint code {
  font-family: var(--font-mono);
  padding: 0 4px;
  background: var(--slate-100);
  border-radius: 2px;
  color: var(--slate-700);
}
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--slate-50);
}
.footer-right {
  display: flex;
  gap: 8px;
}
.btn-primary,
.btn-secondary {
  height: 32px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--dur) var(--ease);
}
.btn-primary {
  background: var(--primary-500);
  color: #fff;
}
.btn-primary:hover {
  background: var(--primary-600);
}
.btn-secondary {
  background: #fff;
  color: var(--slate-700);
  border-color: var(--slate-300);
}
.btn-secondary:hover {
  background: var(--slate-50);
}
</style>
