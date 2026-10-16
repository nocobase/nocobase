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
          rows: resource.actions.flatMap((action) => {
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
              hint: resource.description
                ? text(resource.description)
                : undefined,
              enabled: Boolean(granted),
            };
            // Each composite scope is independent; editing one never replaces the other scope values.
            return [
              row,
              ...(granted
                ? (resource.dataScopes?.[action.name] ?? []).map((scope) => ({
                    id: JSON.stringify([
                      resource.type,
                      resource.id,
                      action.name,
                      scope.key,
                    ]),
                    label: text(scope.title),
                    toggleable: false,
                    enabled: true,
                    levels: [
                      { value: '', label: '—' },
                      ...scope.recordAccess.map((key) => ({
                        value: key,
                        label: text(
                          catalog.recordAccess.find(
                            (entry) => entry.key === key,
                          )?.title ?? key,
                        ),
                      })),
                    ],
                    level:
                      typeof (
                        granted.policy?.scopes as
                          Record<string, unknown> | undefined
                      )?.[scope.key] === 'string'
                        ? String(
                            (granted.policy?.scopes as Record<string, unknown>)[
                              scope.key
                            ],
                          )
                        : '',
                  }))
                : []),
            ];
          }),
        })),
      ),
    }))
    .filter((section) => section.groups.length);
}

export function setScope(
  grants: readonly PermissionGrant[],
  rowId: string,
  value: string,
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
