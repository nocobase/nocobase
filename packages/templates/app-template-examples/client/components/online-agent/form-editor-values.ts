import type { FormProposalValues } from '../../../shared/ai-form-fill.js';

export interface FormEditorValues {
  name?: string;
  department?: FormProposalValues['department'];
  quantity?: string;
  budget?: string;
  arrival?: string;
  purpose?: string;
  // Old conversation cards may still display these fields.
  priority?: 'low' | 'normal' | 'high';
  subscribe?: boolean;
}

/** Keep numeric text drafts intact; convert only at the explicit snapshot/apply boundary. */
export function parseEditorValues(
  values: FormEditorValues,
): Record<string, string | number | boolean> {
  const { budget, quantity, ...otherValues } = values;
  return {
    ...otherValues,
    ...(budget === undefined
      ? {}
      : { budget: budget.trim() ? Number(budget) : Number.NaN }),
    ...(quantity === undefined
      ? {}
      : { quantity: quantity.trim() ? Number(quantity) : Number.NaN }),
  };
}

export function toEditorValues(values: FormProposalValues): FormEditorValues {
  const { budget, quantity, ...otherValues } = values;
  return {
    ...otherValues,
    ...(budget === undefined ? {} : { budget: String(budget) }),
    ...(quantity === undefined ? {} : { quantity: String(quantity) }),
  };
}
