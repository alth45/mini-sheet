<script setup lang="ts">
import { computed } from "vue";
import { Check, LayoutList, Sigma, TrendingUp } from "lucide-vue-next";
import type { CellRef } from "@/constants";
import type { SheetStats } from "@/composables/useSheet";

/* ---------- Props ---------- */

const props = defineProps<{
  selectionLabel: string;
  stats: SheetStats;
  /** Kalau true → tampilkan indikator "Editing..." */
  isEditing?: boolean;
}>();

/* ---------- Format helpers ---------- */

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "#DIV/0!";
  return numberFormatter.format(Math.round(n * 100) / 100);
}

/* ---------- Computed ---------- */

const formattedSum = computed(() => fmt(props.stats.sum));
const formattedAvg = computed(() => fmt(props.stats.avg));
const formattedCount = computed(() => String(props.stats.count));

/** Tampilkan stats hanya jika ada >=1 angka di seleksi. */
const hasNumbers = computed(() => props.stats.count > 0);
</script>

<template>
  <footer class="statusbar">
    <!-- Left: tab + selection -->
    <div class="status-left">
      <button type="button" class="sheet-tab" title="Sheet1">
        <LayoutList :size="12" :stroke-width="2.25" />
        <span>Sheet1</span>
      </button>

      <div class="status-divider" />

      <div class="status-indicator" :class="{ editing: isEditing }">
        <Check v-if="!isEditing" :size="12" :stroke-width="2.5" />
        <span v-else class="pulse-dot" />
        <span class="status-text">
          {{ isEditing ? "Mengedit…" : "Siap" }}
        </span>
      </div>

      <div class="status-divider" />

      <span class="sel-label" :title="selectionLabel">{{
        selectionLabel
      }}</span>
    </div>

    <!-- Right: stats -->
    <div class="status-right">
      <div class="stat" :class="{ muted: !hasNumbers }">
        <Sigma :size="11" :stroke-width="2.5" class="stat-icon" />
        <span class="stat-key">Jumlah</span>
        <span class="stat-value">{{ formattedSum }}</span>
      </div>

      <div class="stat" :class="{ muted: !hasNumbers }">
        <TrendingUp :size="11" :stroke-width="2.5" class="stat-icon" />
        <span class="stat-key">Rata-rata</span>
        <span class="stat-value">{{ formattedAvg }}</span>
      </div>

      <div class="stat" :class="{ muted: !hasNumbers }">
        <span class="stat-icon hash">#</span>
        <span class="stat-key">Data</span>
        <span class="stat-value">{{ formattedCount }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* =========================================================
   Container
   ========================================================= */
.statusbar {
  height: var(--status-h);
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  flex-shrink: 0;
  user-select: none;
  font-size: 11px;
}

/* =========================================================
   Left side
   ========================================================= */
.status-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.sheet-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 20px;
  padding: 0 9px;
  border: 1px solid var(--primary-200);
  background: var(--primary-50);
  color: var(--primary-700);
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: default;
  transition:
    background-color var(--dur) var(--ease),
    border-color var(--dur) var(--ease);
}

.sheet-tab:hover {
  background: var(--primary-100);
  border-color: var(--primary-400);
}

.status-divider {
  width: 1px;
  height: 14px;
  background: var(--border);
  flex-shrink: 0;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--success-700);
  font-size: 11px;
  font-weight: 500;
}

.status-indicator.editing {
  color: var(--primary-600);
}

.status-text {
  color: var(--slate-500);
  font-weight: 500;
}

.status-indicator:not(.editing) .status-text {
  color: var(--success-700);
}

.status-indicator.editing .status-text {
  color: var(--primary-600);
}

/* Pulse dot animation */
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-500);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.35;
    transform: scale(0.85);
  }
}

.sel-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--slate-600);
  letter-spacing: -0.02em;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================================================
   Right side — stats
   ========================================================= */
.status-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: opacity var(--dur) var(--ease);
}

.stat.muted {
  opacity: 0.45;
}

.stat-icon {
  color: var(--slate-400);
  flex-shrink: 0;
}

.stat-icon.hash {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 11px;
  line-height: 1;
  color: var(--slate-400);
}

.stat-key {
  color: var(--slate-500);
  font-size: 11px;
  font-weight: 500;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--slate-800);
  letter-spacing: -0.02em;
  min-width: 12px;
  text-align: right;
}
</style>
