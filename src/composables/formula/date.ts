import { FormulaError } from "./types";
import type { AnyFormulaFunc } from "./types";
import { toDate } from "@/formatters/cellFormat";

function argDate(v: unknown): Date {
  const d = toDate(v as never);
  if (!d) throw new FormulaError("#VALUE!");
  return d;
}

export const DATE_FUNCS: Record<string, AnyFormulaFunc> = {
  TODAY() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  },
  NOW() {
    return Date.now();
  },
  YEAR(args: any) {
    return argDate(args[0]).getFullYear();
  },
  MONTH(args: any) {
    return argDate(args[0]).getMonth() + 1;
  },
  DAY(args: any) {
    return argDate(args[0]).getDate();
  },
  HOUR(args: any) {
    return argDate(args[0]).getHours();
  },
  MINUTE(args: any) {
    return argDate(args[0]).getMinutes();
  },
  SECOND(args: any) {
    return argDate(args[0]).getSeconds();
  },
};
