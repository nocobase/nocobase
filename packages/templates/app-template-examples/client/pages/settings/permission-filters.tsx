import type {
  PermissionGrants,
  PermissionObject,
} from '#components/permission-editor';
import { configurationLocked } from '#components/permission-editor-model';
import {
  PermissionFilter,
  type PermissionFilterLabels,
} from '#components/permission-filter';
import {
  CUSTOM_FILTER,
  filterKey,
  type PermissionFilters,
  type PermissionWorkspace,
} from './permissions-model.js';
import { permissionFilterFieldLabel } from './permission-workspace.js';

/** Attach the custom-filter editor to every enabled scope set to a custom filter. */
export function withPermissionFilters(
  objects: readonly PermissionObject[],
  workspace: PermissionWorkspace,
  draft: PermissionGrants,
  filters: PermissionFilters,
  text: (key: string, fallback?: string) => string,
  editing: string | undefined,
  setEditing: (key: string | undefined) => void,
  onApply: (actionId: string, slotId: string, filter: unknown) => void,
  disabled: boolean,
): readonly PermissionObject[] {
  const labels = permissionFilterLabels(text);
  // The name a View's options give a custom filter, for a follower that lists none, such as one stored by a seed.
  const customLabel = objects
    .flatMap((object) => object.actions)
    .flatMap((action) => action.scopes ?? [])
    .flatMap((slot) => slot.options ?? [])
    .find((option) => option.value === CUSTOM_FILTER)?.label;
  return objects.map((object) => ({
    ...object,
    actions: object.actions.map((action) => {
      const binding = workspace.bindings.get(action.id);
      if (!action.scopes || !binding) return action;
      return {
        ...action,
        scopes: action.scopes.map((slot) => {
          if (draft[action.id]?.scopes?.[slot.id] !== CUSTOM_FILTER)
            return slot;
          const key = filterKey(action.id, slot.id);
          const scope = binding.scopes.find((item) => item.key === slot.id);
          return {
            ...slot,
            // A slot holding a custom filter its options do not list, such as a follower whose View is off, reads it
            // by name rather than by its key.
            ...(slot.options?.length &&
            customLabel &&
            !slot.options.some((option) => option.value === CUSTOM_FILTER)
              ? {
                  options: [
                    ...slot.options,
                    { value: CUSTOM_FILTER, label: customLabel },
                  ],
                }
              : {}),
            configuration: (
              <PermissionFilter
                open={editing === key}
                onOpenChange={(open) => setEditing(open ? key : undefined)}
                value={filters[key]}
                fields={(scope?.fields ?? []).map((field) => ({
                  value: field,
                  label: permissionFilterFieldLabel(
                    scope?.collection ?? '',
                    field,
                    text,
                  ),
                }))}
                labels={labels}
                // A follower's stored filter shows its summary; its scope is set by picking from its options.
                disabled={
                  disabled || configurationLocked(object, slot, objects)
                }
                onApply={(filter) => onApply(action.id, slot.id, filter)}
              />
            ),
          };
        }),
      };
    }),
  }));
}

export function permissionFilterLabels(
  text: (key: string, fallback?: string) => string,
): PermissionFilterLabels {
  return {
    limit: text('settings.permissionFilter.limit'),
    configure: text('settings.permissionFilter.configure'),
    title: text('settings.permissionFilter.title'),
    description: text('settings.permissionFilter.description'),
    all: text('settings.permissionFilter.all'),
    any: text('settings.permissionFilter.any'),
    field: text('settings.permissionFilter.field'),
    operator: text('settings.permissionFilter.operator'),
    valueType: text('settings.permissionFilter.valueType'),
    value: text('settings.permissionFilter.value'),
    text: text('settings.permissionFilter.text'),
    number: text('settings.permissionFilter.number'),
    boolean: text('settings.permissionFilter.boolean'),
    true: text('settings.permissionFilter.true'),
    false: text('settings.permissionFilter.false'),
    add: text('settings.permissionFilter.add'),
    remove: text('settings.permissionFilter.remove'),
    cancel: text('settings.permissionFilter.cancel'),
    apply: text('settings.permissionFilter.apply'),
    invalid: text('settings.permissionFilter.invalid'),
    advanced: text('settings.permissionFilter.advanced'),
    reconfigure: text('settings.permissionFilter.reconfigure'),
    operators: Object.fromEntries(
      [
        '$eq',
        '$ne',
        '$includes',
        '$gt',
        '$gte',
        '$lt',
        '$lte',
        '$empty',
        '$notEmpty',
      ].map((key) => [key, text(`settings.permissionFilter.operators.${key}`)]),
    ),
  };
}
