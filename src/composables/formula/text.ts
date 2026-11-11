import { FormulaError } from "./types";
import type { AnyFormulaFunc } from "./types";

function argStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  return String(v);
}

export const TEXT_FUNCS: Record<string, AnyFormulaFunc> = {
  CONCAT(args: any, stack: any, h: any) {
    const vals = h.collectValues(args, stack);
    return vals.map(argStr).join("");
  },

  LEFT(args: any, _stack: any, h: any) {
    const s = argStr(args[0]);
    const n = args.length > 1 ? Math.max(0, Math.floor(h.num(args[1]))) : 1;
    return s.slice(0, n);
  },

  RIGHT(args: any, _stack: any, h: any) {
    const s = argStr(args[0]);
    const n = args.length > 1 ? Math.max(0, Math.floor(h.num(args[1]))) : 1;
    return n === 0 ? "" : s.slice(-n);
  },

  MID(args: any, _stack: any, h: any) {
    const s = argStr(args[0]);
    const start = Math.max(1, Math.floor(h.num(args[1])));
    const len = Math.max(0, Math.floor(h.num(args[2])));
    return s.slice(start - 1, start - 1 + len);
  },

  LEN(args: any, _stack: any) {
    return argStr(args[0]).length;
  },

  UPPER(args: any, _stack: any) {
    return argStr(args[0]).toUpperCase();
  },

  LOWER(args: any, _stack: any) {
    return argStr(args[0]).toLowerCase();
  },

  TRIM(args: any, _stack: any) {
    return argStr(args[0]).replace(/\s+/g, " ").trim();
  },

  VALUE(args: any) {
    const s = argStr(args[0]).trim();
    if (s === "") return 0;
    const n = Number(s.replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(n)) throw new FormulaError("#VALUE!");
    return n;
  },
};
