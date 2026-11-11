import type { Component } from "vue";
import type { SheetAction } from "@/constants";

/* ---------- Menu Types ---------- */

export interface MenuItem {
  label: string;
  action: SheetAction;
  icon: Component;
  shortcut?: string;
}

export interface Separator {
  separator: true;
}

export type MenuEntry = MenuItem | Separator;

export interface MenuGroup {
  id: string;
  label: string;
  icon: Component;
  items: MenuEntry[];
}

/* ---------- Type Guards ---------- */

export function isSeparator(entry: MenuEntry): entry is Separator {
  return "separator" in entry;
}
