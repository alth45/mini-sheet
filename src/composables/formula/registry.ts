import type { AnyFormulaFunc } from "./types";
import { MATH_FUNCS } from "./math";
import { LOGICAL_FUNCS } from "./logical";
import { CONDITIONAL_FUNCS } from "./conditional";
import { STATISTICS_FUNCS } from "./statistics";
import { TEXT_FUNCS } from "./text";
import { INFORMATION_FUNCS } from "./information";
import { DATE_FUNCS } from "./date";

export const FUNCS: Record<string, AnyFormulaFunc> = {
  ...MATH_FUNCS,
  ...LOGICAL_FUNCS,
  ...CONDITIONAL_FUNCS,
  ...STATISTICS_FUNCS,
  ...TEXT_FUNCS,
  ...INFORMATION_FUNCS,
  ...DATE_FUNCS,
};
