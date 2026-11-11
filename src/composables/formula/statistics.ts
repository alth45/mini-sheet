import { FormulaError } from "./types";
import type { AnyFormulaFunc } from "./types";

function variance(ns: number[], population: boolean): number {
  if (ns.length === 0) return 0;
  const mean = ns.reduce((s, v) => s + v, 0) / ns.length;
  const sqSum = ns.reduce((s, v) => s + (v - mean) ** 2, 0);
  const denom = population ? ns.length : ns.length - 1;
  if (denom <= 0) throw new FormulaError("#DIV/0!");
  return sqSum / denom;
}

export const STATISTICS_FUNCS: Record<string, AnyFormulaFunc> = {
  MEDIAN(args: any, stack: any, h: any) {
    const ns = h
      .onlyNumbers(h.collectValues(args, stack))
      .slice()
      .sort((a: any, b: any) => a - b);
    if (!ns.length) throw new FormulaError("#NUM!");
    const mid = Math.floor(ns.length / 2);
    return ns.length % 2 === 0 ? (ns[mid - 1] + ns[mid]) / 2 : ns[mid];
  },

  MODE(args: any, stack: any, h:any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    if (!ns.length) throw new FormulaError("#N/A!");
    const counts = new Map<number, number>();
    let best = 0;
    let bestCount = 0;
    for (const n of ns) {
      const c = (counts.get(n) ?? 0) + 1;
      counts.set(n, c);
      if (c > bestCount) {
        bestCount = c;
        best = n;
      }
    }
    if (bestCount < 2) throw new FormulaError("#N/A!");
    return best;
  },

  LARGE(args: any, stack: any, h: any) {
    const ns = h
      .onlyNumbers(h.collectValues(args, stack))
      .slice()
      .sort((a: any, b: any) => b - a);
    const k = Math.round(h.num(args[args.length - 1]));
    // Jika k adalah argumen terakhir (angka) dan array > 1
    const data = args.length >= 2 ? ns.slice(0, -1) : ns;
    const idx = k - 1;
    if (idx < 0 || idx >= data.length) throw new FormulaError("#NUM!");
    return data[idx];
  },

  SMALL(args: any, stack: any, h: any) {
    const ns = h
      .onlyNumbers(h.collectValues(args, stack))
      .slice()
      .sort((a: any, b: any) => a - b);
    const k = Math.round(h.num(args[args.length - 1]));
    const data = args.length >= 2 ? ns.slice(0, -1) : ns;
    const idx = k - 1;
    if (idx < 0 || idx >= data.length) throw new FormulaError("#NUM!");
    return data[idx];
  },

  "STDEV.S"(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    return Math.sqrt(variance(ns, false));
  },
  "STDEV.P"(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    return Math.sqrt(variance(ns, true));
  },
  "VAR.S"(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    return variance(ns, false);
  },
  "VAR.P"(args: any, stack: any, h: any) {
    const ns = h.onlyNumbers(h.collectValues(args, stack));
    return variance(ns, true);
  },
};
