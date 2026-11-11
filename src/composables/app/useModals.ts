import { computed, ref } from "vue";
import type { ModalId } from "./types";

/**
 * State 4 modal (About, Reset, Date-format, Number-format)
 * + helper open/close generik.
 *
 * Pattern:
 * - `anyOpen` — untuk guard di keyboard handler
 * - `closeAll` — Escape dari keyboard handler
 */
export function useModals() {
  const aboutOpen = ref(false);
  const resetConfirmOpen = ref(false);
  const dateFormatOpen = ref(false);
  const numberFormatOpen = ref(false);

  const anyOpen = computed(
    () =>
      aboutOpen.value ||
      resetConfirmOpen.value ||
      dateFormatOpen.value ||
      numberFormatOpen.value,
  );

  function open(id: ModalId) {
    switch (id) {
      case "about":
        aboutOpen.value = true;
        break;
      case "reset":
        resetConfirmOpen.value = true;
        break;
      case "date-format":
        dateFormatOpen.value = true;
        break;
      case "number-format":
        numberFormatOpen.value = true;
        break;
    }
  }

  function close(id: ModalId) {
    switch (id) {
      case "about":
        aboutOpen.value = false;
        break;
      case "reset":
        resetConfirmOpen.value = false;
        break;
      case "date-format":
        dateFormatOpen.value = false;
        break;
      case "number-format":
        numberFormatOpen.value = false;
        break;
    }
  }

  function closeAll() {
    aboutOpen.value = false;
    resetConfirmOpen.value = false;
    dateFormatOpen.value = false;
    numberFormatOpen.value = false;
  }

  return {
    aboutOpen,
    resetConfirmOpen,
    dateFormatOpen,
    numberFormatOpen,
    anyOpen,
    open,
    close,
    closeAll,
  };
}

export type ModalsApi = ReturnType<typeof useModals>;
