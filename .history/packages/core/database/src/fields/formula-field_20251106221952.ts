/**
 * Formula Field
 * Automatically computes a value based on other field values.
 * Example formula: (x + y) - (z + r)
 */

import { Field } from './field';
import { evaluate } from 'mathjs'; // mathjs is already used in NocoBase

export class FormulaField extends Field {
  get dataType() {
    return this.options.dataType || 'float';
  }
  
  /**
   * Automatically recompute formula value when dependent fields change
   */
  async beforeSave(model, options) {
    const formula = this.options.formula;
    if (!formula) return;

    // Extract variable dependencies (a, b, c, etc.)
    const deps = Array.from(new Set(formula.match(/\b[a-zA-Z_]\w*\b/g))) || [];
    const changed = deps.some((dep) => model.changed(dep));

    if (!changed) return;

    try {
      const context: Record<string, any> = {};
      for (const dep of deps) {
        context[dep] = model.get(dep);
      }

      // Explicitly typecast evaluate() result to number | string as needed
      const result = evaluate(formula, context) as unknown as number;

      // Ensure the computed value is valid before saving
      if (typeof result === 'number' && !isNaN(result)) {
        model.set(this.name, result);
      } else {
        console.warn(`[FormulaField] Invalid computed result for "${formula}":`, result);
      }
    } catch (error: any) {
      console.warn(`[FormulaField] Failed to evaluate formula "${formula}":`, error.message);
    }
  }
}
