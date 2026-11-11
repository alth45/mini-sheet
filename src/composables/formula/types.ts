import type {
  CellRef,
  EvalValue,
  EvalStack,
  FormulaArg,
  RangeArg,
} from "@/constants";

export class FormulaError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "FormulaError";
  }
}

export type Thunk = () => FormulaArg;

export interface FormulaHelpers {
  num: (v: FormulaArg) => number;
  truthy: (v: FormulaArg) => boolean;
  compareValues: (a: EvalValue, b: EvalValue, op: string) => boolean;
  isRangeArg: (v: FormulaArg) => v is RangeArg;
  expandRange: (a: CellRef, b: CellRef) => CellRef[];
  evalCell: (ref: CellRef, stack: EvalStack) => EvalValue;
  collectValues: (args: FormulaArg[], stack: EvalStack) => EvalValue[];
  onlyNumbers: (vals: EvalValue[]) => number[];
  refsFromArg: (arg: FormulaArg) => CellRef[];
  parseCriteria: (criteria: EvalValue) => (v: EvalValue) => boolean;
}

export interface FormulaFunc {
  (args: FormulaArg[], stack: EvalStack, h: FormulaHelpers): EvalValue;
}

export interface LazyFormulaFunc {
  __lazy: true;
  (thunks: Thunk[], stack: EvalStack, h: FormulaHelpers): EvalValue;
}

export type AnyFormulaFunc = FormulaFunc | LazyFormulaFunc;
