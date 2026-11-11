import { FormulaError } from "./types";
import type { AnyFormulaFunc } from "./types";

export const INFORMATION_FUNCS: Record<string, AnyFormulaFunc> = {
  ISBLANK(args: any) {
    return args[0] === null || args[0] === undefined || args[0] === "";
  },
  ISNUMBER(args: any) {
    return typeof args[0] === "number" && Number.isFinite(args[0]);
  },
  ISTEXT(args: any) {
    return typeof args[0] === "string";
  },
  ISERROR(args: any) {
    try {
      if (args[0] === "#DIV/0!" || args[0] === "#VALUE!") return true;
      return false;
    } catch (e) {
      return e instanceof FormulaError;
    }
  },
};
