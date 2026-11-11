import type { EvalStack, EvalValue } from "@/constants";
import { FormulaError } from "./types";
import type {
  AnyFormulaFunc,
  FormulaHelpers,
  LazyFormulaFunc,
  Thunk,
} from "./types";

type LazyBody = (
  thunks: Thunk[],
  stack: EvalStack,
  h: FormulaHelpers,
) => EvalValue;

function lazy(fn: LazyBody): LazyFormulaFunc {
  return Object.assign(fn, { __lazy: true as const });
}

export const LOGICAL_FUNCS: Record<string, AnyFormulaFunc> = {
  IF: lazy((thunks: any, _stack: any, h: any) => {
    if (thunks.length < 2) throw new FormulaError("#ERROR!");
    return h.truthy(thunks[0]())
      ? thunks[1]()
      : thunks.length > 2
        ? thunks[2]()
        : false;
  }),

  IFERROR: lazy((thunks: any, _stack: any, h: any) => {
    if (thunks.length < 2) throw new FormulaError("#ERROR!");
    try {
      const v = thunks[0]();
      // Range → koleksi & cek error di dalamnya? Untuk simplicity, return as-is
      return h.isRangeArg(v) ? v : v;
    } catch (e) {
      if (e instanceof FormulaError) return thunks[1]();
      throw e;
    }
  }),

  AND: lazy((thunks: any, stack: any, h: any) => {
    for (const t of thunks) {
      const v = t();
      if (h.isRangeArg(v)) {
        for (const ref of h.refsFromArg(v)) {
          if (!h.truthy(h.evalCell(ref, stack))) return false;
        }
      } else if (!h.truthy(v)) {
        return false;
      }
    }
    return true;
  }),

  OR: lazy((thunks: any, stack: any, h: any) => {
    for (const t of thunks) {
      const v = t();
      if (h.isRangeArg(v)) {
        for (const ref of h.refsFromArg(v)) {
          if (h.truthy(h.evalCell(ref, stack))) return true;
        }
      } else if (h.truthy(v)) {
        return true;
      }
    }
    return false;
  }),

  NOT(args: any, _stack: any, h: any) {
    return !h.truthy(args[0]);
  },

  XOR(args: any, _stack: any, h: any) {
    let count = 0;
    for (const a of args) {
      if (h.truthy(a)) count++;
    }
    return count % 2 === 1;
  },
};
