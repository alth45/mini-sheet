/* =========================================================
   MiniSheet — Formula Engine (Refactored)
   ---------------------------------------------------------
   Formula functions dipindah ke ./formula/*
   File ini hanya: tokenizer, parser, evaluasi cell, helpers.
   ========================================================= */

import {
  type CellRef,
  type CellValue,
  type EvalValue,
  type EvalStack,
  type FormulaArg,
  type RangeArg,
  refToRC,
  rcToRef,
} from "@/constants";
import { createHelpers } from "./formula/utils";
import {
  FUNCS,
  FormulaError,
  type AnyFormulaFunc,
  type Thunk,
} from "./formula";

export { FormulaError };

/* =========================================================
   Tokenizer
   ========================================================= */

export type Token =
  | { type: "num"; value: number }
  | { type: "str"; value: string }
  | { type: "id"; value: string }
  | { type: "op"; value: string };

const TWO_CHAR_OPS = new Set(["<=", ">=", "<>", "=="]);
const CELL_REF_RE = /^[A-Z]+\d+$/;

function isRangeArg(v: FormulaArg): v is RangeArg {
  return typeof v === "object" && v !== null && "__range" in v;
}

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
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
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_.]/.test(src[j])) j++;
      tokens.push({ type: "id", value: src.slice(i, j).toUpperCase() });
      i = j;
      continue;
    }
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
  evaluate(src: string): EvalValue;
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

  /* ---------- Helpers (shared with FUNCS) ---------- */

  const helpers = createHelpers({
    expandRange,
    evalCell: evalCellImpl,
    collectValues,
  });

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
        left = helpers.compareValues(left, right, op);
      }
      return left;
    }

    function parseAdditive(): EvalValue {
      let left = parseMultiplicative();
      let op: string | null;
      while ((op = peekOp()) === "+" || op === "-") {
        i++;
        const right = parseMultiplicative();
        left =
          op === "+"
            ? helpers.num(left) + helpers.num(right)
            : helpers.num(left) - helpers.num(right);
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
          const d = helpers.num(right);
          if (d === 0) throw new FormulaError("#DIV/0!");
          left = helpers.num(left) / d;
        } else {
          left = helpers.num(left) * helpers.num(right);
        }
      }
      return left;
    }

    function parseUnary(): EvalValue {
      const op = peekOp();
      if (op === "-") {
        i++;
        return -helpers.num(parseUnary());
      }
      if (op === "+") {
        i++;
        return helpers.num(parseUnary());
      }
      return parsePower();
    }

    function parsePower(): EvalValue {
      const base = parsePrimary();
      if (peekOp() === "^") {
        i++;
        return Math.pow(helpers.num(base), helpers.num(parsePower()));
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

        if (peekOp() === "(") {
          i++;
          const fn: AnyFormulaFunc | undefined = FUNCS[t.value];
          if (typeof fn !== "function") throw new FormulaError("#NAME?");

          // Lazy function → pass thunks
          if ("__lazy" in fn) {
            const thunks: Thunk[] = [];
            if (peekOp() !== ")") {
              thunks.push(() => parseArg());
              while (peekOp() === ",") {
                i++;
                thunks.push(() => parseArg());
              }
            }
            if (peekOp() !== ")") throw new FormulaError("#ERROR!");
            i++;
            return fn(thunks, stack, helpers);
          }

          // Eager function → pass values
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
          return fn(args, stack, helpers);
        }

        if (t.value === "TRUE") return true;
        if (t.value === "FALSE") return false;
        if (CELL_REF_RE.test(t.value)) return evalCellImpl(t.value, stack);
        throw new FormulaError("#NAME?");
      }

      throw new FormulaError("#ERROR!");
    }

    function parseArg(): FormulaArg {
      const t = tokens[i];
      const t2 = tokens[i + 1];
      const t3 = tokens[i + 2];

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
    evalCell(ref: CellRef, stack: EvalSet = new Set()): EvalValue {
      return evalCellImpl(ref, stack);
    },
  };
}

type EvalSet = EvalStack;
