export interface FormEditorValues {
  name?: string;
  priority?: 'low' | 'normal' | 'high';
  budget?: string;
  subscribe?: boolean;
}

/** Keep numeric text drafts intact; convert only at the explicit snapshot/apply boundary. */
export function parseEditorValues(
  values: FormEditorValues,
): Record<string, string | number | boolean> {
  return {
    ...(values.name === undefined ? {} : { name: values.name }),
    ...(values.priority === undefined ? {} : { priority: values.priority }),
    ...(values.budget === undefined
      ? {}
      : { budget: values.budget.trim() ? Number(values.budget) : Number.NaN }),
    ...(values.subscribe === undefined ? {} : { subscribe: values.subscribe }),
  };
}
