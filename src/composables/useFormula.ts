/* =========================================================
   MiniSheet — Formula Engine
   Tokenizer + Recursive Descent Parser
   ---------------------------------------------------------
   Design: factory pattern. Engine dibuat via createFormulaEngine()
   dengan `getRaw` callback → terdecouple dari Vue reactivity,
   mudah di-test, dan bisa dipakai di luar component.
   ========================================================= */

import {
  type CellRef,
  type CellValue,
  type EvalValue,
  type EvalStack,
  type FormulaArg,
  type RangeArg,
  type FormulaFunc,
  type FuncName,
  refToRC,
  rcToRef,
} from "@/constants";

/* =========================================================
   Error
   ========================================================= */

export class FormulaError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "FormulaError";
  }
}

/* =========================================================
   Token
   ========================================================= */

export type Token =
  | { type: "num"; value: number }
  | { type: "str"; value: string }
  | { type: "id"; value: string }
  | { type: "op"; value: string };

/* =========================================================
   Helpers (pure)
   ========================================================= */

const TWO_CHAR_OPS = new Set(["<=", ">=", "<>", "=="]);
const CELL_REF_RE = /^[A-Z]+\d+$/;

function isRangeArg(v: FormulaArg): v is RangeArg {
  return typeof v === "object" && v !== null && "__range" in v;
}

/** Coerce ke number; lempar FormulaError kalau tidak mungkin. */
function num(v: FormulaArg): number {
  if (isRangeArg(v)) throw new FormulaError("#VALUE!");
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new FormulaError("#DIV/0!");
    return v;
  }
  if (typeof v === "boolean") return v ? 1 : 0;
  if (v === null || v === undefined) return 0;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return 0;
    const n = Number(t);
    if (Number.isNaN(n)) throw new FormulaError("#VALUE!");
    return n;
  }
  throw new FormulaError("#VALUE!");
}

/** Coerce ke boolean (dipakai IF). */
function truthy(v: FormulaArg): boolean {
  if (isRangeArg(v)) return true;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (v === null || v === undefined) return false;
  return String(v).trim() !== "";
}

/** Bandingkan dua nilai dengan operator. */
function compareValues(a: EvalValue, b: EvalValue, op: string): boolean {
  const isNumeric = (v: EvalValue): boolean =>
    typeof v === "number" ||
    (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));

  const toStr = (v: EvalValue): string =>
    v === null || v === undefined ? "" : String(v).toUpperCase();

  let x: number | string;
  let y: number | string;

  if (isNumeric(a) && isNumeric(b)) {
    x = Number(a);
    y = Number(b);
  } else {
    x = toStr(a);
    y = toStr(b);
  }

  switch (op) {
    case "=":
      return x === y;
    case "<>":
      return x !== y;
    case "<":
      return x < y;
    case ">":
      return x > y;
    case "<=":
      return x <= y;
    case ">=":
      return x >= y;
  }
  return false;
}

/* =========================================================
   Tokenizer
   ========================================================= */

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    // whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // number: 123 / 12.5 / .5
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      let j = i;
      let dots = 0;
      while (j < src.length && /[0-9.]/.test(src[j])) {
        if (src[j] === ".") dots++;
        j++;
      }
      if (dots > 1) throw new FormulaError("#ERROR!");
      tokens.push({ type: "num", value: parseFloat(src.slice(i, j)) });
      i = j;
      continue;
    }

    // string literal: "abc"
    if (ch === '"') {
      let j = i + 1;
      let s = "";
      while (j < src.length && src[j] !== '"') {
        s += src[j];
        j++;
      }
      if (j >= src.length) throw new FormulaError("#ERROR!");
      tokens.push({ type: "str", value: s });
      i = j + 1;
      continue;
    }

    // identifier: A1, SUM, TRUE, FALSE
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      tokens.push({ type: "id", value: src.slice(i, j).toUpperCase() });
      i = j;
      continue;
    }

    // comparison / equality (1-2 chars)
    if (ch === "<" || ch === ">" || ch === "=") {
      const two = src.substr(i, 2);
      if (TWO_CHAR_OPS.has(two)) {
        tokens.push({ type: "op", value: two === "==" ? "=" : two });
        i += 2;
        continue;
      }
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }

    // arithmetic + structural chars
    if ("+-*/^(),:".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }

    throw new FormulaError("#ERROR!");
  }

  return tokens;
}

/* =========================================================
   Engine
   ========================================================= */

export type RawGetter = (ref: CellRef) => CellValue | undefined;

export interface FormulaEngine {
  /** Evaluasi string formula (boleh dengan atau tanpa leading "="). */
  evaluate(src: string): EvalValue;
  /** Evaluasi nilai cell. `stack` opsional untuk deteksi circular. */
  evalCell(ref: CellRef, stack?: EvalStack): EvalValue;
}

export function createFormulaEngine(getRaw: RawGetter): FormulaEngine {
  /* ---------- Cell evaluation ---------- */

  function evalCellImpl(ref: CellRef, stack: EvalStack): EvalValue {
    if (stack.has(ref)) throw new FormulaError("#CIRC!");

    const raw = getRaw(ref) ?? "";
    if (raw === "") return null;

    if (raw.startsWith("=")) {
      stack.add(ref);
      try {
        return parseFormula(raw.slice(1), stack);
      } finally {
        stack.delete(ref);
      }
    }

    const t = raw.trim();
    if (t !== "" && !Number.isNaN(Number(t))) return Number(t);
    return raw;
  }

  /* ---------- Range expansion ---------- */

  function expandRange(a: CellRef, b: CellRef): CellRef[] {
    const pa = refToRC(a);
    const pb = refToRC(b);
    if (!pa || !pb) throw new FormulaError("#REF!");

    const out: CellRef[] = [];
    const r1 = Math.min(pa.r, pb.r);
    const r2 = Math.max(pa.r, pb.r);
    const c1 = Math.min(pa.c, pb.c);
    const c2 = Math.max(pa.c, pb.c);

    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        out.push(rcToRef(c, r));
      }
    }
    return out;
  }

  /* ---------- Argument collection ---------- */

  function collectValues(args: FormulaArg[], stack: EvalStack): EvalValue[] {
    const out: EvalValue[] = [];
    for (const a of args) {
      if (isRangeArg(a)) {
        for (const ref of expandRange(a.__range[0], a.__range[1])) {
          out.push(evalCellImpl(ref, stack));
        }
      } else {
        out.push(a);
      }
    }
    return out;
  }

  const onlyNumbers = (vals: EvalValue[]): number[] =>
    vals.filter((v): v is number => typeof v === "number");

  /* ---------- Built-in functions ---------- */

  const FUNCS: Record<string, FormulaFunc> = {
    SUM(args, stack) {
      return onlyNumbers(collectValues(args, stack)).reduce((s, v) => s + v, 0);
    },

    AVERAGE(args, stack) {
      const ns = onlyNumbers(collectValues(args, stack));
      if (ns.length === 0) throw new FormulaError("#DIV/0!");
      return ns.reduce((s, v) => s + v, 0) / ns.length;
    },

    MAX(args, stack) {
      const ns = onlyNumbers(collectValues(args, stack));
      return ns.length ? Math.max(...ns) : 0;
    },

    MIN(args, stack) {
      const ns = onlyNumbers(collectValues(args, stack));
      return ns.length ? Math.min(...ns) : 0;
    },

    COUNT(args, stack) {
      return onlyNumbers(collectValues(args, stack)).length;
    },

    IF(args) {
      if (args.length < 2) throw new FormulaError("#ERROR!");
      const result = truthy(args[0]) ? args[1] : args.length > 2 ? args[2] : false;
      if (isRangeArg(result)) throw new FormulaError("#VALUE!");
      return result;
    },
  };

  /* ---------- Parser (recursive descent) ---------- */

  function parseFormula(src: string, stack: EvalStack): EvalValue {
    const tokens = tokenize(src);
    let i = 0;

    const peek = (): Token | undefined => tokens[i];
    const peekOp = (): string | null => {
      const t = tokens[i];
      return t && t.type === "op" ? t.value : null;
    };

    function parseComparison(): EvalValue {
      let left = parseAdditive();
      let op: string | null;
      while (
        (op = peekOp()) !== null &&
        ["=", "<>", "<", ">", "<=", ">="].includes(op)
      ) {
        i++;
        const right = parseAdditive();
        left = compareValues(left, right, op);
      }
      return left;
    }

    function parseAdditive(): EvalValue {
      let left = parseMultiplicative();
      let op: string | null;
      while ((op = peekOp()) === "+" || op === "-") {
        i++;
        const right = parseMultiplicative();
        left = op === "+" ? num(left) + num(right) : num(left) - num(right);
      }
      return left;
    }

    function parseMultiplicative(): EvalValue {
      let left = parseUnary();
      let op: string | null;
      while ((op = peekOp()) === "*" || op === "/") {
        i++;
        const right = parseUnary();
        if (op === "/") {
          const d = num(right);
          if (d === 0) throw new FormulaError("#DIV/0!");
          left = num(left) / d;
        } else {
          left = num(left) * num(right);
        }
      }
      return left;
    }

    function parseUnary(): EvalValue {
      const op = peekOp();
      if (op === "-") {
        i++;
        return -num(parseUnary());
      }
      if (op === "+") {
        i++;
        return num(parseUnary());
      }
      return parsePower();
    }

    function parsePower(): EvalValue {
      const base = parsePrimary();
      if (peekOp() === "^") {
        i++;
        return Math.pow(num(base), num(parsePower()));
      }
      return base;
    }

    function parsePrimary(): EvalValue {
      const t = peek();
      if (!t) throw new FormulaError("#ERROR!");

      if (t.type === "num") {
        i++;
        return t.value;
      }
      if (t.type === "str") {
        i++;
        return t.value;
      }

      if (t.type === "op" && t.value === "(") {
        i++;
        const v = parseComparison();
        if (peekOp() !== ")") throw new FormulaError("#ERROR!");
        i++;
        return v;
      }

      if (t.type === "id") {
        i++;

        // Function call
        if (peekOp() === "(") {
          i++;
          const args: FormulaArg[] = [];
          if (peekOp() !== ")") {
            args.push(parseArg());
            while (peekOp() === ",") {
              i++;
              args.push(parseArg());
            }
          }
          if (peekOp() !== ")") throw new FormulaError("#ERROR!");
          i++;

          const fn = FUNCS[t.value];
          if (typeof fn !== "function") throw new FormulaError("#NAME?");
          return fn(args, stack);
        }

        // Boolean literal
        if (t.value === "TRUE") return true;
        if (t.value === "FALSE") return false;

        // Cell reference
        if (CELL_REF_RE.test(t.value)) {
          return evalCellImpl(t.value, stack);
        }

        throw new FormulaError("#NAME?");
      }

      throw new FormulaError("#ERROR!");
    }

    function parseArg(): FormulaArg {
      const t = tokens[i];
      const t2 = tokens[i + 1];
      const t3 = tokens[i + 2];

      // Deteksi range A1:B5 hanya dalam konteks argument fungsi
      if (
        t &&
        t.type === "id" &&
        CELL_REF_RE.test(t.value) &&
        t2 &&
        t2.type === "op" &&
        t2.value === ":" &&
        t3 &&
        t3.type === "id" &&
        CELL_REF_RE.test(t3.value)
      ) {
        i += 3;
        return { __range: [t.value, t3.value] };
      }

      return parseComparison();
    }

    const result = parseComparison();
    if (i < tokens.length) throw new FormulaError("#ERROR!");
    return result;
  }

  /* ---------- Public API ---------- */

  return {
    evaluate(src: string): EvalValue {
      const trimmed = src.trim();
      if (trimmed === "") return null;
      const body = trimmed.startsWith("=") ? trimmed.slice(1) : trimmed;
      if (body === "") return null;
      return parseFormula(body, new Set());
    },

    evalCell(ref: CellRef, stack: EvalStack = new Set()): EvalValue {
      return evalCellImpl(ref, stack);
    },
  };
}
