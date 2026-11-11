import type { EvalValue, FormulaArg, CellRef, RangeArg } from "@/constants";
import { FormulaError, type FormulaHelpers } from "./types";

/** Coerce ke number. */
export function num(v: FormulaArg): number {
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

export function truthy(v: FormulaArg): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (v === null || v === undefined) return false;
  if (typeof v === "object") return true; // range dianggap truthy
  return String(v).trim() !== "";
}

export function compareValues(a: EvalValue, b: EvalValue, op: string): boolean {
  const isNum = (v: EvalValue): boolean =>
    typeof v === "number" ||
    (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)));
  const toStr = (v: EvalValue): string =>
    v === null || v === undefined ? "" : String(v).toUpperCase();

  let x: number | string;
  let y: number | string;
  if (isNum(a) && isNum(b)) {
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

export function isRangeArg(v: FormulaArg): v is RangeArg {
  return typeof v === "object" && v !== null && "__range" in v;
}

/** Bangun matcher dari criteria SUMIF/COUNTIF. */
export function parseCriteria(criteria: EvalValue): (v: EvalValue) => boolean {
  if (typeof criteria === "number") {
    return (v) => {
      try {
        return num(v as FormulaArg) === criteria;
      } catch {
        return false;
      }
    };
  }
  if (typeof criteria === "boolean") {
    return (v) => truthy(v as FormulaArg) === criteria;
  }

  const s = String(criteria ?? "");
  const m = /^(>=|<=|<>|>|<|=)?\s*(.*)$/.exec(s);
  const op = m?.[1] || "=";
  const rhs = (m?.[2] ?? s).trim();
  const rhsNum = Number(rhs);
  const isNumRhs = rhs !== "" && !Number.isNaN(rhsNum);

  if (isNumRhs) {
    return (v) => {
      try {
        const nv = num(v as FormulaArg);
        switch (op) {
          case ">":
            return nv > rhsNum;
          case "<":
            return nv < rhsNum;
          case ">=":
            return nv >= rhsNum;
          case "<=":
            return nv <= rhsNum;
          case "<>":
            return nv !== rhsNum;
          default:
            return nv === rhsNum;
        }
      } catch {
        return false;
      }
    };
  }

  const upper = rhs.toUpperCase();
  return (v) => {
    if (v === null || v === undefined) return false;
    return String(v).toUpperCase() === upper;
  };
}

/** Buat helper context. */
export function createHelpers(impl: {
  expandRange: FormulaHelpers["expandRange"];
  evalCell: FormulaHelpers["evalCell"];
  collectValues: FormulaHelpers["collectValues"];
}): FormulaHelpers {
  return {
    num,
    truthy,
    compareValues,
    isRangeArg,
    expandRange: impl.expandRange,
    evalCell: impl.evalCell,
    collectValues: impl.collectValues,
    onlyNumbers: (vals) =>
      vals.filter((v): v is number => typeof v === "number"),
    refsFromArg: (arg) => {
      if (!isRangeArg(arg)) return [];
      return impl.expandRange(arg.__range[0], arg.__range[1]);
    },
    parseCriteria,
  };
}
