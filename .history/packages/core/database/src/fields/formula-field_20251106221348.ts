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

    // extract dependencies (e.g., x, y, z, r)
    const deps = Array.from(new Set(formula.match(/\b[a-zA-Z_]\w*\b/g))) || [];
    const changed = deps.some((dep) => model.changed(dep));

    if (!changed) return;

    try {
      const context: Record<string, any> = {};
      for (const dep of deps) {
        context[dep] = model.get(dep);
      }
      const result = evaluate(formula, context);
      model.set(this.name, result);
    } catch (error) {
      console.warn(`[FormulaField] Failed to evaluate formula "${formula}":`, error.message);
    }
  }
}
