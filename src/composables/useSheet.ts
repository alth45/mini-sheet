/* =========================================================
   MiniSheet — Sheet State Composable
   ---------------------------------------------------------
   Sumber kebenaran tunggal untuk:
   - data sel & style (reactive)
   - seleksi (activeRef, selStart, selEnd)
   - formula engine (di-wire dengan reactive data)
   - semua action (setRaw, setStyle, dispatch, dll)

   Design: factory function → tiap komponen bisa punya
   instance sendiri (berguna untuk unit test / multi-sheet
   nanti), tapi saat ini App membuat satu instance global.
   ========================================================= */

import { computed, reactive, ref, type ComputedRef } from "vue";
import {
  type CellRef,
  type CellMap,
  type StyleMap,
  type CellStyle,
  type SelectionRect,
  type SheetAction,
  type EvalValue,
  type AlignValue,
  COLS,
  NROWS,
  MIN_COL_W,
  MAX_COL_W,
  refToRC,
  rcToRef,
  clamp,
  formatValue,
  adjustFormulaRelative,
  countDecimals,
  MAX_DECIMALS,
  COL_W,
} from "@/constants";
import {
  createFormulaEngine,
  FormulaError,
  type FormulaEngine,
} from "./useFormula";

/* =========================================================
   Types
   ========================================================= */

export interface CellRender {
  display: string;
  isNumeric: boolean;
  error: boolean;
}

export interface SheetStats {
  sum: number;
  count: number;
  avg: number;
}

export interface UseSheetOptions {
  data?: CellMap;
  styles?: StyleMap;
  activeRef?: CellRef;
}

/** Konstanta kosong yang di-freeze supaya identitas stabil. */
const EMPTY_STYLE: CellStyle = Object.freeze({});

/* =========================================================
   Composable
   ========================================================= */

export function useSheet(options: UseSheetOptions = {}) {
  /* ---------- Reactive state ---------- */
  const data = reactive<CellMap>({ ...(options.data ?? {}) });
  const styles = reactive<StyleMap>({ ...(options.styles ?? {}) });

  const colWidths = reactive<number[]>(
    Array.from({ length: COLS.length }, () => COL_W),
  );
  const activeRef = ref<CellRef>(options.activeRef ?? "A1");
  const selStart = ref<CellRef>(activeRef.value);
  const selEnd = ref<CellRef>(activeRef.value);

  /* ---------- Formula engine (dipanggil di computed → reaktif) ---------- */
  const engine: FormulaEngine = createFormulaEngine((ref) => data[ref] ?? "");

  /* =========================================================
     Derived state
     ========================================================= */

  const selRect: ComputedRef<SelectionRect> = computed(() => {
    const a = refToRC(selStart.value) ?? { c: 0, r: 0 };
    const b = refToRC(selEnd.value) ?? { c: 0, r: 0 };
    return {
      r1: Math.min(a.r, b.r),
      r2: Math.max(a.r, b.r),
      c1: Math.min(a.c, b.c),
      c2: Math.max(a.c, b.c),
    };
  });

  const isSingleSel = computed(() => {
    const r = selRect.value;
    return r.r1 === r.r2 && r.c1 === r.c2;
  });

  /** Style dari sel aktif — dipakai toolbar untuk `active` class. */
  const activeStyle: ComputedRef<CellStyle> = computed(
    () => styles[activeRef.value] ?? EMPTY_STYLE,
  );

  /** Statistik seleksi (untuk status bar). */
  const stats: ComputedRef<SheetStats> = computed(() => {
    const rect = selRect.value;
    let sum = 0;
    let count = 0;
    for (let r = rect.r1; r <= rect.r2; r++) {
      for (let c = rect.c1; c <= rect.c2; c++) {
        const ref = rcToRef(c, r);
        if (!data[ref]) continue;
        try {
          const v = engine.evalCell(ref);
          if (typeof v === "number") {
            sum += v;
            count++;
          }
        } catch {
          /* abaikan sel ber-error */
        }
      }
    }
    return { sum, count, avg: count ? sum / count : 0 };
  });

  /* =========================================================
     Reading API
     ========================================================= */

  function rawFor(ref: CellRef): string {
    return data[ref] ?? "";
  }

  function styleFor(ref: CellRef): CellStyle {
    return styles[ref] ?? EMPTY_STYLE;
  }

  /**
   * Kalkulasi display value + metadata untuk satu sel.
   * Grid memakainya untuk render (memoization di level Grid).
   */
  function renderCell(ref: CellRef): CellRender {
    const raw = data[ref] ?? "";
    if (raw === "") return { display: "", isNumeric: false, error: false };

    const st = styles[ref];
    const decimals = st?.decimals;
    const percent = st?.percent;

    // Formula
    if (raw.startsWith("=")) {
      try {
        const v: EvalValue = engine.evalCell(ref);
        return {
          display: formatValue(v, decimals, percent),
          isNumeric: typeof v === "number",
          error: false,
        };
      } catch (e) {
        return {
          display: e instanceof FormulaError ? e.code : "#ERROR!",
          isNumeric: false,
          error: true,
        };
      }
    }

    // Literal
    const t = raw.trim();
    const isNumeric = t !== "" && !Number.isNaN(Number(t));
    if (isNumeric && (decimals !== undefined || percent)) {
      return {
        display: formatValue(Number(t), decimals, percent),
        isNumeric: true,
        error: false,
      };
    }
    return { display: raw, isNumeric, error: false };
  }

  /* =========================================================
     Writing API
     ========================================================= */

  function setRaw(ref: CellRef, value: string | number | null | undefined) {
    if (value === "" || value === null || value === undefined) {
      delete data[ref];
    } else {
      data[ref] = String(value);
    }
  }

  /** Set satu properti style untuk seluruh sel dalam seleksi. */
  function setStyle<K extends keyof CellStyle>(
    key: K,
    value: CellStyle[K] | null,
  ) {
    const rect = selRect.value;
    for (let r = rect.r1; r <= rect.r2; r++) {
      for (let c = rect.c1; c <= rect.c2; c++) {
        const ref = rcToRef(c, r);
        if (!styles[ref]) styles[ref] = {};
        const s = styles[ref];

        if (value === null || value === undefined) {
          delete s[key];
        } else {
          s[key] = value;
        }

        if (Object.keys(s).length === 0) delete styles[ref];
      }
    }
  }

  /** Toggle bold/italic/underline untuk sel aktif. */
  function toggleStyle(key: "bold" | "italic" | "underline") {
    const cur = styles[activeRef.value];
    const on = !!(cur && cur[key]);
    setStyle(key, on ? null : true);
  }

  function setAlign(align: AlignValue) {
    setStyle("align", align);
  }

  /* =========================================================
     Selection
     ========================================================= */

  function selectCell(ref: CellRef) {
    activeRef.value = ref;
    selStart.value = ref;
    selEnd.value = ref;
  }

  function extendTo(ref: CellRef) {
    selEnd.value = ref;
  }

  function moveSelection(dr: number, dc: number, extend: boolean) {
    const base = extend ? selEnd.value : activeRef.value;
    const pos = refToRC(base);
    if (!pos) return;
    const nr = clamp(pos.r + dr, 0, NROWS - 1);
    const nc = clamp(pos.c + dc, 0, COLS.length - 1);
    const ref = rcToRef(nc, nr);
    if (extend) {
      selEnd.value = ref;
    } else {
      selectCell(ref);
    }
  }

  /* ---------- Column widths ---------- */

  function setColWidth(c: number, w: number) {
    if (c < 0 || c >= colWidths.length) return;
    colWidths[c] = clamp(Math.round(w), MIN_COL_W, MAX_COL_W);
  }

  function resetColWidths() {
    for (let i = 0; i < colWidths.length; i++) colWidths[i] = COL_W;
  }

  /**
   * Isi range target dari source (fill handle).
   * - Source 1 cell  → copy ke semua target
   * - Source N cell  → repeat pattern N sel (Excel-like)
   * - Formula        → referensi relatif di-adjust (dr, dc)
   * - Style          → ikut dicopy
   */
  function fillRange(source: SelectionRect, target: SelectionRect) {
    const srcH = source.r2 - source.r1 + 1;
    const srcW = source.c2 - source.c1 + 1;

    for (let r = target.r1; r <= target.r2; r++) {
      for (let c = target.c1; c <= target.c2; c++) {
        // Skip cell di dalam source
        if (
          r >= source.r1 &&
          r <= source.r2 &&
          c >= source.c1 &&
          c <= source.c2
        )
          continue;

        const relR = (((r - source.r1) % srcH) + srcH) % srcH;
        const relC = (((c - source.c1) % srcW) + srcW) % srcW;
        const srcRef = rcToRef(source.c1 + relC, source.r1 + relR);
        const dstRef = rcToRef(c, r);

        const raw = data[srcRef];
        if (raw === undefined) {
          delete data[dstRef];
        } else if (raw.startsWith("=")) {
          data[dstRef] = adjustFormulaRelative(
            raw,
            r - (source.r1 + relR),
            c - (source.c1 + relC),
          );
        } else {
          data[dstRef] = raw;
        }

        const st = styles[srcRef];
        if (st) styles[dstRef] = { ...st };
        else delete styles[dstRef];
      }
    }

    // Pilih range target
    activeRef.value = rcToRef(target.c1, target.r1);
    selStart.value = activeRef.value;
    selEnd.value = rcToRef(target.c2, target.r2);
  }

  /* =========================================================
     Bulk operations
     ========================================================= */

  function forEachSelected(fn: (ref: CellRef) => void) {
    const rect = selRect.value;
    for (let r = rect.r1; r <= rect.r2; r++) {
      for (let c = rect.c1; c <= rect.c2; c++) {
        fn(rcToRef(c, r));
      }
    }
  }

  function clearContent() {
    forEachSelected((ref) => {
      delete data[ref];
    });
  }

  function clearFormat() {
    forEachSelected((ref) => {
      delete styles[ref];
    });
  }

  function resetSheet() {
    for (const k of Object.keys(data)) delete data[k];
    for (const k of Object.keys(styles)) delete styles[k];
    resetColWidths();
    selectCell("A1");
  }

  /** Muat data + style dari luar (seed / file baru). */
  function loadSheet(sheetData: CellMap, sheetStyles: StyleMap = {}) {
    resetSheet();
    for (const [ref, val] of Object.entries(sheetData)) data[ref] = val;
    for (const [ref, val] of Object.entries(sheetStyles)) {
      styles[ref] = { ...val };
    }
  }

  /* =========================================================
     Formula helpers
     ========================================================= */

  /**
   * Buat string `=SUM(A1:A5)` untuk dimasukkan ke formula bar.
   * Kalau seleksi >1 sel, otomatis pakai range.
   */
  function buildFunctionFormula(name: string): string {
    const rect = selRect.value;
    let range = "";
    if (rect.r1 !== rect.r2 || rect.c1 !== rect.c2) {
      range = `${rcToRef(rect.c1, rect.r1)}:${rcToRef(rect.c2, rect.r2)}`;
    }
    return `=${name}(${range})`;
  }

  /* ---------- Decimal adjustment ---------- */

  function getNumericValue(ref: CellRef): number | null {
    const raw = data[ref] ?? "";
    if (raw === "") return null;
    if (raw.startsWith("=")) {
      try {
        const v = engine.evalCell(ref);
        return typeof v === "number" && Number.isFinite(v) ? v : null;
      } catch {
        return null;
      }
    }
    const t = raw.trim();
    if (t === "" || Number.isNaN(Number(t))) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }

  function adjustDecimals(delta: number) {
    forEachSelected((ref) => {
      const cur = styles[ref]?.decimals;
      let base: number;
      if (cur !== undefined) {
        base = cur;
      } else {
        // Tidak ada style → mulai dari jumlah desimal nilai saat ini
        const val = getNumericValue(ref);
        base = val !== null ? countDecimals(val) : 0;
      }
      const next = Math.min(Math.max(base + delta, 0), MAX_DECIMALS);
      if (!styles[ref]) styles[ref] = {};
      styles[ref].decimals = next;
    });
  }

  function increaseDecimal() {
    adjustDecimals(1);
  }
  function decreaseDecimal() {
    adjustDecimals(-1);
  }
  function togglePercent() {
    const cur = styles[activeRef.value];
    const on = !!(cur && cur.percent);
    setStyle("percent", on ? null : true);
  }

  /* =========================================================
     Action dispatcher
     ---------------------------------------------------------
     Return `string` → App harus memasukkan ke formula bar.
     Return `null`  → tidak ada yang perlu dilakukan di UI.
     Action `'about'` di-handle App secara terpisah (dialog).
     ========================================================= */

  function dispatch(action: SheetAction): string | null {
    switch (action) {
      case "new":
        resetSheet();
        return null;
      case "clear":
        clearContent();
        return null;
      case "bold":
        toggleStyle("bold");
        return null;
      case "italic":
        toggleStyle("italic");
        return null;
      case "underline":
        toggleStyle("underline");
        return null;
      case "align-left":
        setAlign("left");
        return null;
      case "align-center":
        setAlign("center");
        return null;
      case "align-right":
        setAlign("right");
        return null;
      case "clear-format":
        clearFormat();
      case "increase-decimal":
        increaseDecimal();
        return null;
      case "decrease-decimal":
        decreaseDecimal();
        return null;
      case "toggle-percent":
        togglePercent();
        return null;
      case "f-sum":
        return buildFunctionFormula("SUM");
      case "f-average":
        return buildFunctionFormula("AVERAGE");
      case "f-max":
        return buildFunctionFormula("MAX");
      case "f-min":
        return buildFunctionFormula("MIN");
      case "f-count":
        return buildFunctionFormula("COUNT");
      case "about":
        return null;
    }
  }

  /* =========================================================
     Public API
     ========================================================= */

  return {
    // state
    data,
    styles,
    colWidths,
    activeRef,
    selStart,
    selEnd,
    // derived
    selRect,
    isSingleSel,
    activeStyle,
    stats,
    // reading
    rawFor,
    styleFor,
    renderCell,
    // writing
    setRaw,
    setStyle,
    toggleStyle,
    setAlign,
    clearContent,
    clearFormat,
    resetSheet,
    loadSheet,
    increaseDecimal,
    decreaseDecimal,
    togglePercent,
    // selection
    selectCell,
    extendTo,
    moveSelection,
    setColWidth,
    resetColWidths,
    fillRange,
    // formula
    buildFunctionFormula,
    dispatch,
    // engine (advanced)
    engine,
  };
}

export type SheetApi = ReturnType<typeof useSheet>;
