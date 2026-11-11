import type { FormulaArg } from "@/constants";
import { FormulaError } from "./types";
import type { AnyFormulaFunc } from "./types";

export const MATH_FUNCS: Record<string, AnyFormulaFunc> = {
  SUM(args: any, stack: any, h: any) {
    return h
      .onlyNumbers(h.collectValues(args, stack))
      .reduce((s: any, v: any) => s + v, 0);
  },
  PRODUCT(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    return ns.length ? ns.reduce((p: any, v: any) => p * v, 1) : 0;
  },
  AVERAGE(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    if (!ns.length) throw new FormulaError("#DIV/0!");
    return ns.reduce((s: any, v: any) => s + v, 0) / ns.length;
  },
  MAX(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    return ns.length ? Math.max(...ns) : 0;
  },
  MIN(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    return ns.length ? Math.min(...ns) : 0;
  },
  COUNT(args: any, stack: any, h: any) {
    return h.onlyNumbers(h.collectValues(args, stack)).length;
  },
  ROUND(args: any, stack: any, h: any) {
    const v = h.num(args[0]);
    const d = args.length > 1 ? h.num(args[1]) : 0;
    const m = Math.pow(10, d);
    return Math.round(v * m) / m;
  },
  ROUNDUP(args: any, stack: any, h: any) {
    const v = h.num(args[0]);
    const d = args.length > 1 ? h.num(args[1]) : 0;
    const m = Math.pow(10, d);
    return Math.ceil(v * m) / m;
  },
  ROUNDDOWN(args: any, stack: any, h: any) {
    const v = h.num(args[0]);
    const d = args.length > 1 ? h.num(args[1]) : 0;
    const m = Math.pow(10, d);
    return Math.floor(v * m) / m;
  },
  ABS(args: any, stack: any, h: any) {
    return Math.abs(h.num(args[0]));
  },
  SQRT(args: any, stack: any, h: any) {
    const v = h.num(args[0]);
    if (v < 0) throw new FormulaError("#NUM!");
    return Math.sqrt(v);
  },
  POWER(args: any, stack: any, h: any) {
    return Math.pow(h.num(args[0]), h.num(args[1]));
  },
  MOD(args: any, stack: any, h: any) {
    const d = h.num(args[1]);
    if (d === 0) throw new FormulaError("#DIV/0!");
    return h.num(args[0]) % d;
  },
  INT(args: any, stack: any, h: any) {
    return Math.floor(h.num(args[0]));
  },
  SIGN(args: any, stack: any, h: any) {
    return Math.sign(h.num(args[0]));
  },
  CEILING(args: any, stack: any, h: any) {
    const v = h.num(args[0]);
    const s = args.length > 1 ? Math.abs(h.num(args[1])) : 1;
    if (s === 0) return 0;
    return Math.ceil(v / s) * s;
  },
  FLOOR(args: any, stack: any, h: any) {
    const v = h.num(args[0]);
    const s = args.length > 1 ? Math.abs(h.num(args[1])) : 1;
    if (s === 0) return 0;
    return Math.floor(v / s) * s;
  },
  PI() {
    return Math.PI;
  },
  RAND() {
    return Math.random();
  },
  RANDBETWEEN(args: any, stack: any, h: any) {
    const lo = Math.ceil(h.num(args[0]));
    const hi = Math.floor(h.num(args[1]));
    if (lo > hi) throw new FormulaError("#NUM!");
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  },
};

// Helper typing shortcut (tidak dipakai langsung — hanya untuk import tree)
export type _MathFuncs = typeof MATH_FUNCS;
export type _Arg = FormulaArg;
