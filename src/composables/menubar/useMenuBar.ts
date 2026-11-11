import { onBeforeUnmount, onMounted, ref } from "vue";
import type { SheetAction } from "@/constants";

/**
 * Composable untuk MenuBar.
 * Mengelola state open/close dropdown + document listeners.
 *
 * `emit` di-pass dari komponen (bukan dari composable) supaya
 * parent tetap bisa mengontrol signature event.
 */
export function useMenuBar(
  emit: (event: "action", action: SheetAction) => void,
) {
  /* ---------- State ---------- */
  const openMenu = ref<string | null>(null);
  const rootRef = ref<HTMLElement | null>(null);

  /* ---------- Actions ---------- */

  function toggleMenu(id: string) {
    openMenu.value = openMenu.value === id ? null : id;
  }

  /** Hover di menu lain saat dropdown terbuka → pindah (native behavior). */
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

  /* ---------- Document-level listeners ---------- */

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

  /* ---------- Return ---------- */

  return {
    openMenu,
    rootRef,
    toggleMenu,
    hoverMenu,
    closeMenu,
    handleAction,
  };
}
