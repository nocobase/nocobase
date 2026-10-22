import type { PermissionEditorSection } from '#components/permission-editor';
import {
  PermissionFilter,
  type PermissionFilterLabels,
} from '#components/permission-filter';
import type {
  PermissionGrant,
  AuthorizationOptionsResponse,
} from '@nocobase/app-plugin-authorization/client';
import { getScopeSelection } from './permissions-model.js';

export function configurePermissionScopes(
  sections: readonly PermissionEditorSection[],
  catalog: AuthorizationOptionsResponse,
  grants: readonly PermissionGrant[],
  text: (key: string, fallback?: string) => string,
  editing: string | undefined,
  setEditing: (id: string | undefined) => void,
  onApply: (id: string, value: unknown) => void,
  disabled: boolean,
): readonly PermissionEditorSection[] {
  const labels = permissionFilterLabels(text);
  const resources = catalog.sections.flatMap((section) =>
    section.subsections.flatMap((sub) => sub.resources),
  );
  return sections.map((section) => ({
    ...section,
    groups: section.groups.map((group) => ({
      ...group,
      rows: group.rows.map((row) => ({
        ...row,
        scopes:
          row.scopes?.map((scope) => {
            if (scope.level !== 'customFilter' && editing !== scope.id)
              return scope;
            const [type, resourceId, action, key] = JSON.parse(
              scope.id,
            ) as string[];
            const definition = resources
              .find(
                (resource) =>
                  resource.type === type && resource.id === resourceId,
              )
              ?.dataScopes?.[action ?? '']?.find((item) => item.key === key);
            const value = getScopeSelection(grants, scope.id);
            const params: unknown =
              value && typeof value === 'object'
                ? Reflect.get(value, 'params')
                : undefined;
            const filter: unknown =
              params && typeof params === 'object'
                ? Reflect.get(params, 'filter')
                : undefined;
            return {
              ...scope,
              configuration: (
                <PermissionFilter
                  open={editing === scope.id}
                  onOpenChange={(open) =>
                    setEditing(open ? scope.id : undefined)
                  }
                  value={filter}
                  fields={(definition?.fields ?? []).map((field) => ({
                    value: field,
                    label: text(`settings.permissionFields.${field}`, field),
                  }))}
                  labels={labels}
                  disabled={disabled}
                  onApply={(filter) =>
                    onApply(scope.id, {
                      type: 'recordAccess',
                      key: 'customFilter',
                      params: { filter },
                    })
                  }
                />
              ),
            };
          }) ?? [],
      })),
    })),
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
