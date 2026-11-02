import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import type { CatalogResource } from './permissions-model.js';

export interface PermissionWorkspaceSelection {
  readonly business: readonly {
    readonly type: string;
    readonly id: string;
    readonly actions: readonly string[];
    readonly actionDescriptions?: Readonly<Record<string, LocalizedText>>;
    readonly scopeTitles?: Readonly<Record<string, LocalizedText>>;
    readonly actionScopeTitles?: Readonly<
      Record<string, Readonly<Record<string, LocalizedText>>>
    >;
    /** UI-only omission; registered and stored scope values remain unchanged. */
    readonly hiddenActionScopes?: Readonly<Record<string, readonly string[]>>;
    readonly configurationActions?: readonly {
      readonly name: string;
      readonly routes: readonly string[];
    }[];
    readonly configurationTitle?: LocalizedText;
  }[];
  readonly settings: readonly {
    readonly id: string;
    readonly actions: readonly string[];
  }[];
  readonly filterFieldTitles?: Readonly<
    Record<string, Readonly<Record<string, LocalizedText>>>
  >;
}

/** Add only business operations and configuration controls this application exposes. */
export const permissionWorkspaceSelection: PermissionWorkspaceSelection = {
  business: [],
  settings: [
    {
      id: 'authorization.permission-sets',
      actions: ['read', 'create', 'update'],
    },
    {
      id: 'authorization.default-access',
      actions: ['read', 'create', 'update', 'delete'],
    },
  ],
};

/** Share application-owned data captions across role and default-scope editors. */
export function permissionScopeTitle(
  resource: { readonly type: string; readonly id: string },
  scope: { readonly collection: string; readonly title: LocalizedText },
  selection: PermissionWorkspaceSelection = permissionWorkspaceSelection,
  action?: string,
): LocalizedText {
  const selected = selection.business.find((entry) =>
    resource.type === 'database.collection'
      ? entry.scopeTitles?.[scope.collection] !== undefined
      : entry.type === resource.type && entry.id === resource.id,
  );
  return (
    (action
      ? selected?.actionScopeTitles?.[action]?.[scope.collection]
      : undefined) ??
    selected?.scopeTitles?.[scope.collection] ??
    scope.title
  );
}

export function permissionScopeVisible(
  resource: { readonly type: string; readonly id: string },
  action: string,
  scopeKey: string,
  selection: PermissionWorkspaceSelection = permissionWorkspaceSelection,
): boolean {
  return !selection.business
    .find((entry) => entry.type === resource.type && entry.id === resource.id)
    ?.hiddenActionScopes?.[action]?.includes(scopeKey);
}

export function permissionFilterFieldLabel(
  collection: string,
  field: string,
  text: (key: string, fallback?: string) => string,
  selection: PermissionWorkspaceSelection = permissionWorkspaceSelection,
): string {
  const title = selection.filterFieldTitles?.[collection]?.[field];
  return title
    ? typeof title === 'string'
      ? title
      : text(title.key, title.defaultValue ?? field)
    : field;
}

function hasConfigurationPage(
  routes: readonly AppClientRegisteredRoute[],
  resourceId: string,
): boolean {
  return routes.some(
    (route) =>
      (route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'settings' &&
        route.authz.resource.id === resourceId) ||
      hasConfigurationPage(route.children ?? [], resourceId),
  );
}

function hasUserManagement(
  routes: readonly AppClientRegisteredRoute[],
): boolean {
  return routes.some(
    (route) =>
      (route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'user') ||
      hasUserManagement(route.children ?? []),
  );
}

/** A configuration action needs an actual application-owned page, not just an installed capability. */
function hasApplicationPage(
  routes: readonly AppClientRegisteredRoute[],
  names: readonly string[],
): boolean {
  return routes.some(
    (route) =>
      (route.source === 'application' &&
        route.componentLoader &&
        names.includes(route.name)) ||
      hasApplicationPage(route.children ?? [], names),
  );
}

/**
 * Application-owned presentation, not a copy of the complete capability catalog.
 * Select actual business actions in permissionWorkspaceSelection as features are built.
 * Settings additionally require a real configuration page and registered action.
 * Installing a plugin never opts all its management capabilities into this form.
 */
export function permissionWorkspaceCatalog(
  source: AuthorizationOptionsResponse,
  routes: readonly AppClientRegisteredRoute[],
  pages: readonly CatalogResource[],
  selection: PermissionWorkspaceSelection = permissionWorkspaceSelection,
): AuthorizationOptionsResponse {
  const configurationBusiness: CatalogResource[] = [];
  const visibleSections: readonly string[] = ['pages', 'business'];
  const settings = source.sections
    .flatMap((section) => section.subsections.flatMap((sub) => sub.resources))
    .flatMap((resource) => {
      const selected = selection.settings.find(
        (entry) => entry.id === resource.id,
      );
      if (
        resource.type !== 'settings' ||
        !selected ||
        !hasConfigurationPage(routes, resource.id)
      )
        return [];
      const actions = resource.actions.filter((action) =>
        selected.actions.includes(action.name),
      );
      return actions.length ? [{ ...resource, actions }] : [];
    });
  return {
    ...source,
    sections: [
      ...(hasUserManagement(routes)
        ? [
            {
              name: 'users',
              title: { key: 'settings.userPermissions' },
              order: 0,
              subsections: [
                ...[
                  {
                    name: 'users.information',
                    title: 'userInformation',
                    actions: ['read', 'create', 'update'],
                  },
                  {
                    name: 'users.security',
                    title: 'accountSecurity',
                    actions: ['disable', 'enable', 'revoke-sessions'],
                  },
                  {
                    name: 'users.roles',
                    title: 'roleAssignment',
                    actions: ['assign-role'],
                  },
                ].map((group) => ({
                  name: group.name,
                  title: { key: `settings.${group.title}` },
                  resources: [
                    {
                      type: 'user',
                      id: '*',
                      title: { key: `settings.${group.title}` },
                      actions: [
                        { name: 'read', title: { key: 'settings.readUsers' } },
                        {
                          name: 'create',
                          title: { key: 'settings.createUsers' },
                        },
                        {
                          name: 'update',
                          title: { key: 'settings.updateUsers' },
                        },
                        { name: 'disable', title: { key: 'settings.disable' } },
                        { name: 'enable', title: { key: 'settings.enable' } },
                        {
                          name: 'assign-role',
                          title: { key: 'settings.assignRole' },
                        },
                        {
                          name: 'revoke-sessions',
                          title: { key: 'settings.revokeSessions' },
                        },
                      ].filter((action) => group.actions.includes(action.name)),
                    },
                  ],
                })),
              ],
            },
          ]
        : []),
      ...source.sections
        .filter((section) => visibleSections.includes(section.name))
        .map((section) => ({
          ...section,
          subsections: section.subsections.map((sub) => ({
            ...sub,
            resources:
              sub.recordType?.type === 'page'
                ? [...sub.resources, ...pages]
                : sub.resources.flatMap((resource) => {
                    const selected = selection.business.find(
                      (entry) =>
                        entry.type === resource.type &&
                        entry.id === resource.id,
                    );
                    if (!selected) return [];
                    const actions = resource.actions.filter((action) =>
                      selected.actions.includes(action.name),
                    );
                    if (!actions.length) return [];
                    const projected = {
                      ...resource,
                      actions: actions.map((action) => ({
                        ...action,
                        ...(selected.actionDescriptions?.[action.name]
                          ? {
                              description:
                                selected.actionDescriptions[action.name],
                            }
                          : {}),
                      })),
                      ...(resource.dataScopes
                        ? {
                            dataScopes: Object.fromEntries(
                              Object.entries(resource.dataScopes).map(
                                ([action, scopes]) => [
                                  action,
                                  scopes.map((scope) => ({
                                    ...scope,
                                    title: permissionScopeTitle(
                                      resource,
                                      scope,
                                      selection,
                                      action,
                                    ),
                                  })),
                                ],
                              ),
                            ),
                          }
                        : {}),
                    };
                    const isConfiguration = (name: string) =>
                      selected.configurationActions?.some(
                        (entry) => entry.name === name,
                      );
                    const configurationActions = projected.actions.filter(
                      (action) => {
                        const entry = selected.configurationActions?.find(
                          (entry) => entry.name === action.name,
                        );
                        return (
                          entry && hasApplicationPage(routes, entry.routes)
                        );
                      },
                    );
                    if (configurationActions.length)
                      configurationBusiness.push({
                        ...projected,
                        title: selected.configurationTitle ?? projected.title,
                        actions: configurationActions,
                      });
                    const businessActions = projected.actions.filter(
                      (action) => !isConfiguration(action.name),
                    );
                    return businessActions.length
                      ? [{ ...projected, actions: businessActions }]
                      : [];
                  }),
          })),
        })),
      ...(settings.length || configurationBusiness.length
        ? [
            {
              name: 'configuration',
              title: { key: 'settings.configurationPermissions' },
              order: 200,
              subsections: [
                {
                  name: 'configuration',
                  title: { key: 'settings.configurationPermissions' },
                  resources: [...settings, ...configurationBusiness],
                },
              ],
            },
          ]
        : []),
    ].filter((section) =>
      section.subsections.some((sub) => sub.resources.length > 0),
    ),
  };
}
