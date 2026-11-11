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
  SquareDashed,
  Grid2x2,
  PanelTop,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Square,
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

/* ---------- Border options ---------- */

import type { BorderScope } from "@/constants";

interface BorderOption {
  value: BorderScope;
  label: string;
  description: string;
  icon: Component;
}

const BORDER_OPTIONS: readonly BorderOption[] = [
  {
    value: "none",
    label: "Tanpa Border",
    description: "Hapus semua border",
    icon: SquareDashed,
  },
  {
    value: "all",
    label: "Semua Border",
    description: "Semua sisi",
    icon: Grid2x2,
  },
  {
    value: "outer",
    label: "Border Luar",
    description: "Hanya perimeter",
    icon: Square,
  },
  {
    value: "top",
    label: "Atas",
    description: "Hanya sisi atas",
    icon: PanelTop,
  },
  {
    value: "bottom",
    label: "Bawah",
    description: "Hanya sisi bawah",
    icon: PanelBottom,
  },
  {
    value: "left",
    label: "Kiri",
    description: "Hanya sisi kiri",
    icon: PanelLeft,
  },
  {
    value: "right",
    label: "Kanan",
    description: "Hanya sisi kanan",
    icon: PanelRight,
  },
];
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

  /* ---------- Border dropdown ---------- */

  const borderMenuOpen = ref(false);
  const borderMenuRef = ref<HTMLElement | null>(null);
  const borderPanelRef = ref<HTMLElement | null>(null);
  const borderTriggerRef = ref<HTMLElement | null>(null);
  const borderPanelPosition = ref({ top: 0, left: 0 });

  function computeBorderPanelPosition() {
    if (!borderTriggerRef.value) return;
    const rect = borderTriggerRef.value.getBoundingClientRect();
    const panelWidth = 240;
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8;
    }
    borderPanelPosition.value = {
      top: rect.bottom + 4,
      left,
    };
  }

  function toggleBorderMenu() {
    if (!borderMenuOpen.value) {
      computeBorderPanelPosition();
    }
    borderMenuOpen.value = !borderMenuOpen.value;
  }

  function closeBorderMenu() {
    borderMenuOpen.value = false;
  }

  function selectBorder(scope: BorderScope) {
    closeBorderMenu();
    trigger(`border-${scope}` as SheetAction);
  }

  /* ---------- Border icon & state ---------- */

  const currentBorderIcon = computed<Component>(() => {
    const b = getStyle().border;
    if (!b) return SquareDashed;
    const hasTop = !!b.top;
    const hasRight = !!b.right;
    const hasBottom = !!b.bottom;
    const hasLeft = !!b.left;
    const count = [hasTop, hasRight, hasBottom, hasLeft].filter(Boolean).length;
    if (count === 0) return SquareDashed;
    if (count === 4) return Grid2x2;
    if (count === 1) {
      if (hasTop) return PanelTop;
      if (hasRight) return PanelRight;
      if (hasBottom) return PanelBottom;
      if (hasLeft) return PanelLeft;
    }
    return Grid2x2;
  });

  const hasBorder = computed(() => {
    const b = getStyle().border;
    return !!b && Object.keys(b).length > 0;
  });

  /* ---------- Document listeners ---------- */

  function handleDocumentClick(e: MouseEvent) {
    const target = e.target as Node;
    if (formatMenuOpen.value) {
      const insideFormat =
        formatMenuRef.value?.contains(target) ||
        (document.querySelector(".tb-dropdown-panel")?.contains(target) ??
          false);
      if (!insideFormat) closeFormatMenu();
    }
    if (borderMenuOpen.value) {
      const insideBorder =
        borderMenuRef.value?.contains(target) ||
        borderPanelRef.value?.contains(target);
      if (!insideBorder) closeBorderMenu();
    }
  }

  function handleScrollOrResize() {
    if (formatMenuOpen.value) closeFormatMenu();
    if (borderMenuOpen.value) closeBorderMenu();
  }

  function handleDocumentKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (formatMenuOpen.value) closeFormatMenu();
      if (borderMenuOpen.value) closeBorderMenu();
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

    // border
    borderMenuOpen,
    borderMenuRef,
    borderPanelRef,
    borderTriggerRef,
    borderPanelPosition,
    toggleBorderMenu,
    closeBorderMenu,
    selectBorder,
    currentBorderIcon,
    hasBorder,
    BORDER_OPTIONS,
  };
}
