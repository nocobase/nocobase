import type { ConfigurableParameter } from '@nocobase/lifecycle';
import type { ParameterGroupView } from '@nocobase/app-plugin-lifecycle-example/client';

/** Render a shared field once, under its declared state or first transition. */
export function parameterSectionKey(
  field: Pick<ConfigurableParameter, 'bindings'>,
): string {
  const state = field.bindings?.find((binding) => binding.state)?.state;
  if (state) return `state:${state}`;
  const transition = field.bindings?.find(
    (binding) => binding.transition,
  )?.transition;
  return transition ? `transition:${transition}` : 'workflow';
}

export function parameterSections(
  groups: readonly ParameterGroupView[],
  title: (key: string) => string,
): ParameterGroupView[] {
  const sections = new Map<string, ParameterGroupView>();
  for (const group of groups) {
    for (const [name, field] of Object.entries(group.fields)) {
      const key = parameterSectionKey(field);
      const previous = sections.get(key);
      sections.set(key, {
        ...group,
        key,
        title: title(key),
        canUpdate: (previous?.canUpdate ?? true) && group.canUpdate,
        fields: { ...previous?.fields, [name]: field },
        values: { ...previous?.values, [name]: group.values[name] },
        uses: [
          ...(previous?.uses ?? []),
          ...group.uses.filter((use) => use.field === name),
        ],
      });
    }
  }
  return [...sections.values()];
}
