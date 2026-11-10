<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, type Component } from "vue";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  BarChart3,
  Bold,
  BookOpen,
  Database,
  Eraser,
  FilePlus2,
  FileText,
  Hash,
  HelpCircle,
  Info,
  Italic,
  LayoutGrid,
  Paintbrush,
  Pencil,
  Plus,
  Sigma,
  TrendingDown,
  TrendingUp,
  Underline,
  Minus,
} from "lucide-vue-next";
import type { SheetAction } from "@/constants";

/* ---------- Types ---------- */

interface MenuItem {
  label: string;
  action: SheetAction;
  icon: Component;
  shortcut?: string;
}
interface Separator {
  separator: true;
}
type MenuEntry = MenuItem | Separator;

interface MenuGroup {
  id: string;
  label: string;
  icon: Component;
  items: MenuEntry[];
}

/* ---------- Emits ---------- */

const emit = defineEmits<{
  action: [action: SheetAction];
}>();

/* ---------- State ---------- */

const openMenu = ref<string | null>(null);
const rootRef = ref<HTMLElement | null>(null);

/* ---------- Menu Config ---------- */

const menus: MenuGroup[] = [
  {
    id: "file",
    label: "File",
    icon: FileText,
    items: [
      {
        label: "Lembar Baru",
        action: "new",
        icon: FilePlus2,
        shortcut: "Ctrl+N",
      },
      { separator: true },
      { label: "Tentang MiniSheet", action: "about", icon: Info },
    ],
  },
  {
    id: "edit",
    label: "Edit",
    icon: Pencil,
    items: [
      {
        label: "Hapus Isi Sel",
        action: "clear",
        icon: Eraser,
        shortcut: "Del",
      },
      { separator: true },
      { label: "Tebal", action: "bold", icon: Bold, shortcut: "Ctrl+B" },
      { label: "Miring", action: "italic", icon: Italic, shortcut: "Ctrl+I" },
      {
        label: "Garis Bawah",
        action: "underline",
        icon: Underline,
        shortcut: "Ctrl+U",
      },
    ],
  },
  {
    id: "insert",
    label: "Sisipkan",
    icon: Plus,
    items: [
      { label: "SUM", action: "f-sum", icon: Sigma },
      { label: "AVERAGE", action: "f-average", icon: BarChart3 },
      { label: "MAX", action: "f-max", icon: TrendingUp },
      { label: "MIN", action: "f-min", icon: TrendingDown },
      { label: "COUNT", action: "f-count", icon: Hash },
    ],
  },
  {
    id: "format",
    label: "Format",
    icon: Paintbrush,
    items: [
      { label: "Rata Kiri", action: "align-left", icon: AlignLeft },
      { label: "Rata Tengah", action: "align-center", icon: AlignCenter },
      { label: "Rata Kanan", action: "align-right", icon: AlignRight },
      { separator: true },
      { label: "Tambah Desimal", action: "increase-decimal", icon: Plus },
      { label: "Kurangi Desimal", action: "decrease-decimal", icon: Minus },
      { separator: true },
      { label: "Hapus Format", action: "clear-format", icon: Eraser },
    ],
  },
  {
    id: "data",
    label: "Data",
    icon: Database,
    items: [
      { label: "Jumlahkan Seleksi", action: "f-sum", icon: Sigma },
      { label: "Rata-rata Seleksi", action: "f-average", icon: BarChart3 },
      { label: "Hitung Angka", action: "f-count", icon: Hash },
    ],
  },
  {
    id: "help",
    label: "Bantuan",
    icon: HelpCircle,
    items: [{ label: "Daftar Rumus", action: "about", icon: BookOpen }],
  },
];

/* ---------- Helpers ---------- */

function isSeparator(entry: MenuEntry): entry is Separator {
  return "separator" in entry;
}

/* ---------- Handlers ---------- */

function toggleMenu(id: string) {
  openMenu.value = openMenu.value === id ? null : id;
}

/** Hover di menu lain saat dropdown terbuka → pindah (seperti menu native). */
function hoverMenu(id: string) {
  if (openMenu.value !== null && openMenu.value !== id) {
    openMenu.value = id;
  }
}

function closeMenu() {
  openMenu.value = null;
}

function handleAction(action: SheetAction) {
  closeMenu();
  emit("action", action);
}

function handleDocumentClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
    closeMenu();
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && openMenu.value) closeMenu();
}

/* ---------- Lifecycle ---------- */

onMounted(() => {
  document.addEventListener("mousedown", handleDocumentClick);
  document.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleDocumentClick);
  document.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <nav ref="rootRef" class="menubar">
    <!-- Brand -->
    <div class="brand">
      <div class="brand-logo">
        <LayoutGrid :size="13" :stroke-width="2.25" />
      </div>
      <span class="brand-name">MiniSheet</span>
    </div>

    <!-- Menus -->
    <div class="menus">
      <div
        v-for="menu in menus"
        :key="menu.id"
        class="menu"
        :class="{ open: openMenu === menu.id }"
      >
        <button
          type="button"
          class="menu-trigger"
          :aria-expanded="openMenu === menu.id"
          aria-haspopup="menu"
          @click="toggleMenu(menu.id)"
          @mouseenter="hoverMenu(menu.id)"
        >
          <component :is="menu.icon" :size="13" :stroke-width="2" />
          <span>{{ menu.label }}</span>
        </button>

        <Transition name="dropdown">
          <div v-if="openMenu === menu.id" class="menu-panel" role="menu">
            <template v-for="(item, idx) in menu.items" :key="idx">
              <div v-if="isSeparator(item)" class="menu-sep" />
              <button
                v-else
                type="button"
                class="menu-item"
                role="menuitem"
                @click="handleAction(item.action)"
              >
                <component
                  :is="item.icon"
                  :size="14"
                  :stroke-width="2"
                  class="menu-item-icon"
                />
                <span class="menu-item-label">{{ item.label }}</span>
                <span v-if="item.shortcut" class="menu-item-shortcut">
                  {{ item.shortcut }}
                </span>
              </button>
            </template>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* =========================================================
   Menubar container
   ========================================================= */
.menubar {
  height: var(--header-h);
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 4px;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

/* =========================================================
   Brand
   ========================================================= */
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 14px;
  margin-right: 4px;
  border-right: 1px solid var(--border);
  height: 24px;
}

.brand-logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.35);
  flex-shrink: 0;
}

.brand-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--slate-800);
  letter-spacing: -0.01em;
}

/* =========================================================
   Menus row
   ========================================================= */
.menus {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.menu {
  position: relative;
}

.menu-trigger {
  height: 28px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--slate-600);
  font-size: 12px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.menu-trigger:hover {
  background: var(--slate-100);
  color: var(--slate-900);
}

.menu.open .menu-trigger {
  background: var(--primary-50);
  color: var(--primary-700);
}

.menu-trigger:focus-visible {
  outline: none;
  box-shadow: var(--shadow-focus);
}

/* =========================================================
   Dropdown panel
   ========================================================= */
.menu-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 232px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 5px;
  z-index: 200;
}

/* ---------- Item ---------- */
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border: none;
  background: transparent;
  border-radius: var(--radius);
  color: var(--slate-700);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--dur) var(--ease);
}

.menu-item:hover {
  background: var(--slate-100);
}

.menu-item:focus-visible {
  outline: none;
  background: var(--primary-50);
}

.menu-item-icon {
  color: var(--slate-500);
  flex-shrink: 0;
  transition: color var(--dur) var(--ease);
}

.menu-item:hover .menu-item-icon {
  color: var(--primary-500);
}

.menu-item-label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item-shortcut {
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1;
  color: var(--slate-400);
  background: var(--slate-100);
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px solid var(--slate-200);
  transition:
    background-color var(--dur) var(--ease),
    color var(--dur) var(--ease);
}

.menu-item:hover .menu-item-shortcut {
  color: var(--slate-600);
  background: #fff;
}

/* ---------- Separator ---------- */
.menu-sep {
  height: 1px;
  background: var(--border);
  margin: 4px 4px;
}

/* =========================================================
   Transition
   ========================================================= */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease);
  transform-origin: top left;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}
</style>
