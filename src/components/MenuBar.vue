<script setup lang="ts">
import { LayoutGrid } from "lucide-vue-next";
import type { SheetAction } from "@/constants";
import { MENUS, useMenuBar, isSeparator } from "@/composables/menubar";

/* ---------- Emits ---------- */

const emit = defineEmits<{
  action: [action: SheetAction];
}>();

/* ---------- Composable ---------- */

const { openMenu, rootRef, toggleMenu, hoverMenu, handleAction } =
  useMenuBar(emit);
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
        v-for="menu in MENUS"
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

<style scoped src="../styles/components/menubar.css"></style>
