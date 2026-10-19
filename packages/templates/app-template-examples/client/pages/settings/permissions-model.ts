import type {
  AuthorizationOptionsResponse,
  PermissionGrant,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import type { PermissionEditorSection } from '#components/permission-editor';

export type CatalogResource =
  AuthorizationOptionsResponse['sections'][number]['subsections'][number]['resources'][number];
export const permissionRowId = (
  resource: { type: string; id: string },
  action: string,
): string => JSON.stringify([resource.type, resource.id, action]);
export function setPermission(
  grants: readonly PermissionGrant[],
  resource: CatalogResource,
  action: string,
  enabled: boolean,
): readonly PermissionGrant[] {
  const next = grants.map((grant) => ({
    ...grant,
    actions: [...grant.actions],
  }));
  let grant = next.find(
    (item) =>
      item.resource.type === resource.type && item.resource.id === resource.id,
  );
  if (!grant && enabled) {
    grant = { resource: { type: resource.type, id: resource.id }, actions: [] };
    next.push(grant);
  }
  if (grant) {
    grant.actions = grant.actions.filter((item) => item.action !== action);
    if (enabled) {
      const scopes = resource.dataScopes?.[action];
      grant.actions.push({
        action,
        ...(scopes?.length
          ? {
              policy: {
                type: 'composite',
                scopes: Object.fromEntries(
                  scopes.map((scope) => [scope.key, scope.defaultValue ?? '']),
                ),
              },
            }
          : {}),
      });
    }
  }
  return next.filter((item) => item.actions.length);
}

export function permissionSections(
  catalog: AuthorizationOptionsResponse,
  grants: readonly PermissionGrant[],
  text: (value: LocalizedText) => string,
): readonly PermissionEditorSection[] {
  return catalog.sections
    .map((section) => ({
      id: section.name,
      title: text(section.title),
      groups: section.subsections.flatMap((subsection) =>
        subsection.resources.map((resource) => ({
          id: JSON.stringify([subsection.name, resource.type, resource.id]),
          title: text(resource.title),
          accessOnly:
            resource.type === 'page' &&
            resource.actions.length === 1 &&
            resource.actions[0]?.name === 'access',
          hint: resource.description ? text(resource.description) : undefined,
          rows: resource.actions.map((action) => {
            const granted = grants
              .find(
                (grant) =>
                  grant.resource.type === resource.type &&
                  grant.resource.id === resource.id,
              )
              ?.actions.find((entry) => entry.action === action.name);
            const row = {
              id: permissionRowId(resource, action.name),
              label: text(action.title),
              actionKey: action.name,
              enabled: Boolean(granted),
            };
            // Scope selectors belong to the action and do not inflate permission counts.
            return {
              ...row,
              scopes: granted
                ? (resource.dataScopes?.[action.name] ?? []).map((scope) => ({
                    id: JSON.stringify([
                      resource.type,
                      resource.id,
                      action.name,
                      scope.key,
                    ]),
                    label: text(
                      typeof scope.title === 'string' &&
                        scope.title === scope.collection
                        ? { key: 'settings.recordScope' }
                        : scope.title,
                    ),
                    levels: [
                      {
                        value: '',
                        label: text({ key: 'settings.noRecordScope' }),
                      },
                      ...scope.recordAccess.map((key) => ({
                        value: key,
                        label: text(
                          catalog.recordAccess.find(
                            (entry) => entry.key === key,
                          )?.title ?? key,
                        ),
                      })),
                    ],
                    level: scopeSelectionKey(
                      granted.policy?.scopes &&
                        typeof granted.policy.scopes === 'object'
                        ? Reflect.get(granted.policy.scopes, scope.key)
                        : undefined,
                    ),
                  }))
                : [],
            };
          }),
        })),
      ),
    }))
    .filter((section) => section.groups.length);
}

export function setScope(
  grants: readonly PermissionGrant[],
  rowId: string,
  value: unknown,
): readonly PermissionGrant[] {
  const [type, id, action, scope] = JSON.parse(rowId) as string[];
  return grants.map((grant) =>
    grant.resource.type !== type || grant.resource.id !== id
      ? grant
      : {
          ...grant,
          actions: grant.actions.map((entry) =>
            entry.action !== action
              ? entry
              : {
                  ...entry,
                  policy: {
                    ...entry.policy,
                    type: 'composite',
                    scopes: {
                      ...(entry.policy?.scopes as
                        Record<string, unknown> | undefined),
                      [scope]: value,
                    },
                  },
                },
          ),
        },
  );
}

/** Fold an explicit edit batch into one draft without replacing unrelated policies. */
export function setPermissions(
  grants: readonly PermissionGrant[],
  catalog: AuthorizationOptionsResponse,
  changes: readonly { id: string; enabled: boolean }[],
): readonly PermissionGrant[] {
  const resources = catalog.sections.flatMap((section) =>
    section.subsections.flatMap((sub) => sub.resources),
  );
  return changes.reduce((current, { id, enabled }) => {
    const [type, resourceId, action, scope] = JSON.parse(id) as string[];
    if (scope) return current;
    const resource = resources.find(
      (item) => item.type === type && item.id === resourceId,
    );
    if (
      !resource ||
      !action ||
      !resource.actions.some((item) => item.name === action)
    )
      return current;
    const existing =
      current
        .find(
          (grant) =>
            grant.resource.type === type && grant.resource.id === resourceId,
        )
        ?.actions.some((item) => item.action === action) ?? false;
    return existing === enabled
      ? current
      : setPermission(current, resource, action, enabled);
  }, grants);
}

export function getScopeSelection(
  grants: readonly PermissionGrant[],
  rowId: string,
): unknown {
  const [type, id, action, scope] = JSON.parse(rowId) as string[];
  const policy = grants
    .find((grant) => grant.resource.type === type && grant.resource.id === id)
    ?.actions.find((entry) => entry.action === action)?.policy;
  return policy?.scopes && typeof policy.scopes === 'object' && scope
    ? Reflect.get(policy.scopes, scope)
    : undefined;
}
function scopeSelectionKey(value: unknown): string {
  if (typeof value === 'string') return value;
  if (
    value &&
    typeof value === 'object' &&
    Reflect.get(value, 'type') === 'recordAccess' &&
    typeof Reflect.get(value, 'key') === 'string'
  )
    return String(Reflect.get(value, 'key'));
  return '';
}

/** Legacy bare custom-filter keys require configuration before saving. */
export function unconfiguredFilter(
  grants: readonly PermissionGrant[],
): string | undefined {
  for (const grant of grants)
    for (const action of grant.actions) {
      const scopes = action.policy?.scopes;
      if (!scopes || typeof scopes !== 'object') continue;
      for (const [key, value] of Object.entries(scopes)) {
        if (value === 'customFilter')
          return JSON.stringify([
            grant.resource.type,
            grant.resource.id,
            action.action,
            key,
          ]);
        if (
          !value ||
          typeof value !== 'object' ||
          Reflect.get(value, 'type') !== 'recordAccess' ||
          Reflect.get(value, 'key') !== 'customFilter'
        )
          continue;
        const params: unknown = Reflect.get(value, 'params');
        const filter: unknown =
          params && typeof params === 'object'
            ? Reflect.get(params, 'filter')
            : undefined;
        if (filter === null || !['object', 'boolean'].includes(typeof filter))
          return JSON.stringify([
            grant.resource.type,
            grant.resource.id,
            action.action,
            key,
          ]);
      }
    }
  return undefined;
}
