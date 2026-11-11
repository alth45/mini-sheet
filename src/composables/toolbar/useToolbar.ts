import { computed, onBeforeUnmount, onMounted, ref, type Component } from "vue";
import {
  Banknote,
  Calculator,
  Check,
  DollarSign,
  FlaskConical,
  Hash,
  Sparkles,
  Type,
  Calendar,
  Sliders,
} from "lucide-vue-next";
import {
  DEFAULT_FILL_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_COLOR,
  type CellStyle,
  type SheetAction,
} from "@/constants";
import { CELL_FORMAT_OPTIONS, type CellFormat } from "@/formatters/cellFormat";
import type { ToolbarEmit } from "./types";

/* =========================================================
   Format → Icon map
   ========================================================= */

const FORMAT_ICONS: Record<CellFormat, Component> = {
  general: Sparkles,
  number: Hash,
  text: Type,
  accounting: Calculator,
  scientific: FlaskConical,
  currency: DollarSign,
  finance: Banknote,
  "custom-date": Calendar,
  "custom-number": Sliders,
};

/* =========================================================
   Composable
   ========================================================= */

/**
 * Semua logic Toolbar:
 * - Two-way binding: fontFamily, fontSize, textColor, fillColor
 * - Active state: bold, italic, underline, align, percent, currency
 * - Format dropdown: state, open/close, select
 * - Document listeners: click-outside & Escape untuk close dropdown
 *
 * `getStyle` di-pass sebagai getter supaya tetap reaktif terhadap props.
 */
export function useToolbar(getStyle: () => CellStyle, emit: ToolbarEmit) {
  /* ---------- Two-way bindings ---------- */

  const fontFamily = computed({
    get: () => getStyle().fontFamily ?? DEFAULT_FONT_FAMILY,
    set: (v: string) => emit("setStyle", "fontFamily", v),
  });

  const fontSize = computed({
    get: () => String(getStyle().fontSize ?? DEFAULT_FONT_SIZE),
    set: (v: string) => emit("setStyle", "fontSize", parseInt(v, 10)),
  });

  const textColor = computed({
    get: () => getStyle().color ?? DEFAULT_TEXT_COLOR,
    set: (v: string) => emit("setStyle", "color", v),
  });

  const fillColor = computed({
    get: () => getStyle().bg ?? DEFAULT_FILL_COLOR,
    set: (v: string) => emit("setStyle", "bg", v),
  });

  /* ---------- Active state ---------- */

  const isBold = computed(() => !!getStyle().bold);
  const isItalic = computed(() => !!getStyle().italic);
  const isUnderline = computed(() => !!getStyle().underline);
  const align = computed(() => getStyle().align);
  const isPercent = computed(() => !!getStyle().percent);
  const isCurrency = computed(() => !!getStyle().currency);

  /* ---------- Action dispatcher ---------- */

  function trigger(action: SheetAction) {
    emit("action", action);
  }

  /* ---------- Format dropdown ---------- */

  const currentFormat = computed<CellFormat>(
    () => getStyle().format ?? "general",
  );
  const currentFormatIcon = computed(() => FORMAT_ICONS[currentFormat.value]);
  const isFormatActive = computed(() => currentFormat.value !== "general");

  const formatMenuOpen = ref(false);
  const formatMenuRef = ref<HTMLElement | null>(null); // wrapper trigger
  const panelRef = ref<HTMLElement | null>(null); // teleported panel
  const triggerRef = ref<HTMLElement | null>(null); // button
  const panelPosition = ref({ top: 0, left: 0 });

  function computePanelPosition() {
    if (!triggerRef.value) return;
    const rect = triggerRef.value.getBoundingClientRect();
    panelPosition.value = {
      top: rect.bottom + 4,
      left: rect.left,
    };
  }

  function toggleFormatMenu() {
    if (!formatMenuOpen.value) {
      computePanelPosition();
    }
    formatMenuOpen.value = !formatMenuOpen.value;
  }

  function closeFormatMenu() {
    formatMenuOpen.value = false;
  }

  function selectFormat(format: CellFormat) {
    closeFormatMenu();
    if (format === "custom-date") {
      trigger("open-custom-date");
    } else if (format === "custom-number") {
      trigger("open-custom-number");
    } else {
      trigger(`set-format-${format}` as SheetAction);
    }
  }

  function getFormatIcon(format: CellFormat): Component {
    return FORMAT_ICONS[format];
  }

  /* ---------- Document listeners ---------- */

  function handleDocumentClick(e: MouseEvent) {
    if (!formatMenuOpen.value) return;
    const target = e.target as Node;
    if (
      !formatMenuRef.value?.contains(target) &&
      !panelRef.value?.contains(target)
    ) {
      closeFormatMenu();
    }
  }

  function handleScrollOrResize() {
    if (formatMenuOpen.value) closeFormatMenu();
  }

  function handleDocumentKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape" && formatMenuOpen.value) {
      closeFormatMenu();
    }
  }

  function attachListeners() {
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeyDown);
    window.addEventListener("resize", handleScrollOrResize);
    // capture: true → juga menangkap scroll dari .toolbar
    window.addEventListener("scroll", handleScrollOrResize, true);
  }

  function detachListeners() {
    document.removeEventListener("mousedown", handleDocumentClick);
    document.removeEventListener("keydown", handleDocumentKeyDown);
    window.removeEventListener("resize", handleScrollOrResize);
    window.removeEventListener("scroll", handleScrollOrResize, true);
  }

  onMounted(attachListeners);
  onBeforeUnmount(detachListeners);

  /* ---------- Public API ---------- */

  return {
    // two-way bindings
    fontFamily,
    fontSize,
    textColor,
    fillColor,
    // active state
    isBold,
    isItalic,
    isUnderline,
    align,
    isPercent,
    isCurrency,
    // action
    trigger,
    // format dropdown
    isFormatActive,
    currentFormat,
    currentFormatIcon,
    formatMenuOpen,
    formatMenuRef,
    panelRef,
    triggerRef,
    panelPosition,
    toggleFormatMenu,
    closeFormatMenu,
    selectFormat,
    getFormatIcon,
    // format options & icon (untuk template)
    CELL_FORMAT_OPTIONS,
    CheckIcon: Check,
  };
}
