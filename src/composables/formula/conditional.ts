import { FormulaError } from "./types";
import type { AnyFormulaFunc } from "./types";

export const CONDITIONAL_FUNCS: Record<string, AnyFormulaFunc> = {
  SUMIF(args: any, stack: any, h: any) {
    if (args.length < 2) throw new FormulaError("#ERROR!");
    const critRefs = h.refsFromArg(args[0]);
    if (!critRefs.length) throw new FormulaError("#VALUE!");
    const matcher = h.parseCriteria(args[1] as never);
    const sumRefs = args.length > 2 ? h.refsFromArg(args[2]) : null;

    let total = 0;
    for (let i = 0; i < critRefs.length; i++) {
      const cv = h.evalCell(critRefs[i], stack);
      if (!matcher(cv)) continue;
      if (sumRefs) {
        if (i >= sumRefs.length) break;
        const sv = h.evalCell(sumRefs[i], stack);
        if (typeof sv === "number") total += sv;
      } else if (typeof cv === "number") {
        total += cv;
      }
    }
    return total;
  },

  COUNTIF(args: any, stack: any, h: any) {
    if (args.length < 2) throw new FormulaError("#ERROR!");
    const refs = h.refsFromArg(args[0]);
    if (!refs.length) throw new FormulaError("#VALUE!");
    const matcher = h.parseCriteria(args[1] as never);
    let count = 0;
    for (const ref of refs) {
      if (matcher(h.evalCell(ref, stack))) count++;
    }
    return count;
  },

  AVERAGEIF(args: any, stack: any, h: any) {
    if (args.length < 2) throw new FormulaError("#ERROR!");
    const critRefs = h.refsFromArg(args[0]);
    if (!critRefs.length) throw new FormulaError("#VALUE!");
    const matcher = h.parseCriteria(args[1] as never);
    const avgRefs = args.length > 2 ? h.refsFromArg(args[2]) : null;

    let total = 0;
    let count = 0;
    for (let i = 0; i < critRefs.length; i++) {
      const cv = h.evalCell(critRefs[i], stack);
      if (!matcher(cv)) continue;
      if (avgRefs) {
        if (i >= avgRefs.length) break;
        const av = h.evalCell(avgRefs[i], stack);
        if (typeof av === "number") {
          total += av;
          count++;
        }
      } else if (typeof cv === "number") {
        total += cv;
        count++;
      }
    }
    if (count === 0) throw new FormulaError("#DIV/0!");
    return total / count;
  },
};
