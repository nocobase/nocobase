import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '@nocobase/app-plugin-authorization/client';
import type {
  PermissionAction,
  PermissionMenu,
  PermissionModule,
  PermissionRisk,
  PermissionScopeOption,
  PermissionScopeSlot,
} from '#components/permission-editor';
import {
  buildRouteNavigation,
  buildSettingsCatalog,
  type RouteNavigationItem,
} from '../../routing/route-navigation.js';
import { SETTINGS_GROUP, SETTINGS_HOME } from '#lib/navigation-transform';
import {
  configurationResources,
  pagePermissionTitle,
  type PagePermissionTitles,
} from './page-permissions.js';
import {
  permissionRowId,
  type CatalogResource,
  type PermissionBinding,
  type PermissionWorkspace,
  NO_SCOPE,
} from './permissions-model.js';

export interface PermissionWorkspaceSelection {
  /** Business resources this application implements, each placed on the menu whose page performs them. */
  readonly business: readonly {
    readonly type: string;
    readonly id: string;
    readonly actions: readonly string[];
    /** Route name of the menu page. Defaults to the menu whose page resource id equals `id`. */
    readonly menu?: string;
    /** The action that reads the records and owns the data scope. Defaults to `view`, else `read`. */
    readonly view?: string;
    readonly actionDescriptions?: Readonly<Record<string, LocalizedText>>;
    /** Risky actions are tagged and never turned on automatically. */
    readonly risks?: Readonly<Record<string, PermissionRisk>>;
    /** Actions that must be on first, by action name of the same resource. Defaults to the view action. */
    readonly requires?: Readonly<Record<string, readonly string[]>>;
    /** Display order of record access keys, widest first; the catalog order otherwise. It implies no nesting. */
    readonly scopeOrder?: readonly string[];
    /**
     * Record access keys provably inside another, by the outer key. All records holds every key and every key holds
     * no records; other pairs are unrelated unless listed here, so Edit is never offered a scope View may not cover.
     */
    readonly scopeSubsets?: Readonly<Record<string, readonly string[]>>;
    readonly scopeTitles?: Readonly<Record<string, LocalizedText>>;
    readonly actionScopeTitles?: Readonly<
      Record<string, Readonly<Record<string, LocalizedText>>>
    >;
    /** UI-only omission; registered and stored scope values remain unchanged. */
    readonly hiddenActionScopes?: Readonly<Record<string, readonly string[]>>;
  }[];
  readonly filterFieldTitles?: Readonly<
    Record<string, Readonly<Record<string, LocalizedText>>>
  >;
}

// Record access from the widest to the narrowest, as the example plugins define them.
const SALES_SCOPES = [
  'allRecords',
  'customFilter',
  'example.sales.region',
  'example.sales.public',
  'example.sales.own',
  'recordsIOwn',
  'example.sales.prepared',
];
const CRM_SCOPES = [
  'allRecords',
  'customFilter',
  'recordsIOwn',
  'example.crm.own',
];

/** Add only business operations this application exposes; system settings come from the real settings pages. */
export const permissionWorkspaceSelection: PermissionWorkspaceSelection = {
  business: [
    // The authorization example's Sales pages: each composite resource has a page of the same id.
    {
      type: 'composite',
      id: 'example.sales.projects',
      actions: ['view', 'edit'],
      scopeOrder: SALES_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.sales.quotes',
      actions: ['view', 'edit', 'submit'],
      scopeOrder: SALES_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.sales.orders',
      actions: ['view', 'manageRelations', 'deliver'],
      scopeOrder: SALES_SCOPES,
    },
    // Customers and contacts: three resources behind one page.
    {
      type: 'composite',
      id: 'example.crm.customers',
      actions: ['view', 'edit', 'assign'],
      menu: 'customer-contacts',
      scopeOrder: CRM_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.crm.contacts',
      actions: ['view', 'edit'],
      menu: 'customer-contacts',
      scopeOrder: CRM_SCOPES,
    },
    {
      type: 'composite',
      id: 'example.crm.salesReps',
      actions: ['view'],
      menu: 'customer-contacts',
      scopeOrder: CRM_SCOPES,
    },
  ],
};

/** Titles of the collections registered with `authz.database.collections.add`, by collection name. */
export function collectionTitles(
  source: Pick<AuthorizationOptionsResponse, 'sections'>,
): ReadonlyMap<string, LocalizedText> {
  const titles = new Map<string, LocalizedText>();
  for (const section of source.sections)
    for (const sub of section.subsections)
      for (const resource of sub.resources)
        if (resource.type === 'database.collection' && !titles.has(resource.id))
          titles.set(resource.id, resource.title);
  return titles;
}

/**
 * Share application-owned data captions across role and default-scope editors. A scope the server titles only with
 * its key or collection name uses the collection's registered title, so no raw table name is shown.
 */
export function permissionScopeTitle(
  resource: { readonly type: string; readonly id: string },
  scope: {
    readonly key?: string;
    readonly collection: string;
    readonly title: LocalizedText;
  },
  selection: PermissionWorkspaceSelection = permissionWorkspaceSelection,
  action?: string,
  registered?: ReadonlyMap<string, LocalizedText>,
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
    (typeof scope.title === 'string' &&
    (scope.title === scope.key || scope.title === scope.collection)
      ? registered?.get(scope.collection)
      : undefined) ??
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

/** User management is not in the server catalog; its actions are fixed by the Users pages. */
const USER_ACTIONS: readonly { name: string; title: string }[] = [
  { name: 'read', title: 'settings.readUsers' },
  { name: 'create', title: 'settings.createUsers' },
  { name: 'update', title: 'settings.updateUsers' },
  { name: 'disable', title: 'settings.disable' },
  { name: 'enable', title: 'settings.enable' },
  { name: 'revoke-sessions', title: 'settings.revokeSessions' },
  { name: 'assign-role', title: 'settings.assignRole' },
];

/**
 * Actions that let a holder change what others, or they themselves, may do. The server does not limit a holder to
 * the permissions they already have, so these are tagged and explained rather than presented as safe.
 */
const ESCALATION: Readonly<
  Record<string, Readonly<Record<string, PermissionRisk>>>
> = {
  'settings:authorization.permission-sets': {
    create: 'high',
    update: 'high',
    delete: 'high',
    assign: 'high',
  },
  'user:*': {
    'assign-role': 'high',
    'revoke-sessions': 'sensitive',
    disable: 'sensitive',
  },
};

/** Actions that reveal what others may do or hold: tagged so Enable all leaves them for a deliberate choice. */
const SENSITIVE: Readonly<
  Record<string, Readonly<Record<string, PermissionRisk>>>
> = {
  'settings:authorization.inspector': { inspect: 'sensitive' },
};

const BASIC_ACTIONS = new Set([
  'view',
  'read',
  'create',
  'edit',
  'update',
  'delete',
  'destroy',
  'export',
  'import',
  'access',
]);

export interface PermissionWorkspaceText {
  readonly text: (value: LocalizedText) => string;
  readonly t: (key: string, options?: Record<string, unknown>) => string;
}

const resourceKey = (resource: { type: string; id: string }): string =>
  `${resource.type}:${resource.id}`;

function routeResources(
  route: AppClientRegisteredRoute,
  skipNavigation: boolean,
): { type: string; id: string; action: string }[] {
  const found = new Map<string, { type: string; id: string; action: string }>();
  const visit = (item: AppClientRegisteredRoute, root: boolean): void => {
    if (!root && skipNavigation && item.navigation && item.componentLoader)
      return;
    if (item.componentLoader && typeof item.authz === 'object') {
      const key = resourceKey(item.authz.resource);
      if (!found.has(key))
        found.set(key, { ...item.authz.resource, action: item.authz.action });
    }
    for (const child of item.children ?? []) visit(child, false);
  };
  visit(route, true);
  return [...found.values()];
}

function navigationTitle(
  route: AppClientRegisteredRoute,
  titles: PagePermissionTitles,
): LocalizedText | undefined {
  return route.navigation?.title
    ? { key: route.navigation.title, ns: route.packageName }
    : pagePermissionTitle(route, titles);
}

/**
 * The role editor's menus, from the application's complete menu (not the signed-in editor's filtered one) and the
 * server catalog. A menu's actions are the business resources placed on it, else access to its pages; system settings
 * pages become the Administration modules, with the real actions the server registers for their resources.
 * Installing a plugin exposes nothing by itself: a settings resource appears only with a page that uses it.
 */
export function permissionWorkspace(
  source: AuthorizationOptionsResponse,
  routes: readonly AppClientRegisteredRoute[],
  titles: PagePermissionTitles,
  words: PermissionWorkspaceText,
  selection: PermissionWorkspaceSelection = permissionWorkspaceSelection,
): PermissionWorkspace {
  const { text, t } = words;
  const catalog = new Map<string, CatalogResource>();
  for (const section of source.sections)
    for (const sub of section.subsections)
      for (const resource of sub.resources)
        if (!catalog.has(resourceKey(resource)))
          catalog.set(resourceKey(resource), resource);
  const registeredTitles = collectionTitles(source);
  const bindings = new Map<string, PermissionBinding>();
  const menuPages = new Map<string, readonly string[]>();
  const placed = new Set<string>();
  const seenPages = new Set<string>();
  const configuration = configurationResources(routes);
  const routeNames = (route: AppClientRegisteredRoute): Set<string> => {
    const names = new Set<string>();
    const visit = (item: AppClientRegisteredRoute): void => {
      names.add(item.name);
      item.children?.forEach(visit);
    };
    visit(route);
    return names;
  };

  const recordAccessTitle = (key: string): string =>
    text(source.recordAccess.find((entry) => entry.key === key)?.title ?? key);

  const scopeOptions = (
    keys: readonly string[],
    order: readonly string[] | undefined,
    follower: boolean,
  ): PermissionScopeOption[] => {
    const rank = (key: string): number => {
      if (order?.includes(key)) return order.indexOf(key);
      // Undeclared, All records is the widest; a custom filter is only known to be narrower than it, so it follows
      // a declared order and otherwise comes right after All records.
      if (key === 'allRecords') return -2;
      if (key === 'customFilter') return order ? order.length : -1;
      return (order?.length ?? 0) + 1 + keys.indexOf(key);
    };
    return [
      ...[...keys]
        .filter((key) => !(follower && key === 'customFilter'))
        .sort((a, b) => rank(a) - rank(b))
        .map((key) => ({ value: key, label: recordAccessTitle(key) })),
      { value: NO_SCOPE, label: t('settings.noRecordScope') },
    ];
  };

  /** For each record access key, the keys provably inside it, so followers are offered only real subsets. */
  const narrowerScopes = (
    keys: readonly string[],
    subsets: Readonly<Record<string, readonly string[]>> | undefined,
  ): Record<string, readonly string[]> => {
    const all = [...keys, NO_SCOPE];
    return Object.fromEntries(
      all.map((key) => [
        key,
        all.filter(
          (inner) =>
            inner !== key &&
            (key === 'allRecords' ||
              inner === NO_SCOPE ||
              (subsets?.[key]?.includes(inner) ?? false)),
        ),
      ]),
    );
  };

  /**
   * Actions of business resources placed on one menu; the first resource's view action is the menu's View. Every
   * resource's other actions follow its own view action's scope on the same collection.
   */
  const businessActions = (
    menuId: string,
    entries: readonly (typeof selection.business)[number][],
  ): PermissionAction[] => {
    const resources = entries.flatMap((entry) => {
      const resource = catalog.get(resourceKey(entry));
      return resource ? [{ entry, resource }] : [];
    });
    const actions: PermissionAction[] = [];
    resources.forEach(({ entry, resource }, index) => {
      placed.add(resourceKey(resource));
      const primary = index === 0;
      const selected = resource.actions.filter((action) =>
        entry.actions.includes(action.name),
      );
      const viewName =
        entry.view ??
        selected.find((action) => action.name === 'view')?.name ??
        selected.find((action) => action.name === 'read')?.name;
      const viewId = viewName ? permissionRowId(resource, viewName) : undefined;
      const viewCollection = viewName
        ? resource.dataScopes?.[viewName]?.[0]?.collection
        : undefined;
      // View first, keeping the catalog order of the rest.
      const ordered = [
        ...selected.filter((action) => action.name === viewName),
        ...selected.filter((action) => action.name !== viewName),
      ];
      for (const action of ordered) {
        const id = permissionRowId(resource, action.name);
        const isView = action.name === viewName;
        const scopes = (resource.dataScopes?.[action.name] ?? []).filter(
          (scope) =>
            permissionScopeVisible(resource, action.name, scope.key, selection),
        );
        const slots: PermissionScopeSlot[] = scopes.map((scope) => {
          const follows =
            !isView &&
            viewId !== undefined &&
            scope.collection === viewCollection;
          const defaultValue = scope.defaultValue
            ? scope.defaultValue
            : NO_SCOPE;
          return {
            id: scope.key,
            ...(scopes.length > 1
              ? {
                  label: text(
                    permissionScopeTitle(
                      resource,
                      scope,
                      selection,
                      action.name,
                      registeredTitles,
                    ),
                  ),
                }
              : {}),
            options: scopeOptions(
              scope.recordAccess,
              entry.scopeOrder,
              follows,
            ),
            ...(follows
              ? { followsView: primary ? true : viewId }
              : { defaultValue }),
            ...(isView
              ? {
                  narrower: narrowerScopes(
                    scope.recordAccess,
                    entry.scopeSubsets,
                  ),
                }
              : {}),
          };
        });
        const requires = entry.requires?.[action.name]?.map((name) =>
          permissionRowId(resource, name),
        );
        const title = text(action.title);
        actions.push({
          id,
          label:
            resources.length > 1
              ? t('settings.permissionActionFor', {
                  action: title,
                  resource: text(resource.title),
                })
              : title,
          ...((entry.actionDescriptions?.[action.name] ?? action.description)
            ? {
                description: text(
                  (entry.actionDescriptions?.[action.name] ??
                    action.description)!,
                ),
              }
            : {}),
          ...(isView && primary ? { view: true } : {}),
          ...(!BASIC_ACTIONS.has(action.name) ? { business: true } : {}),
          ...(slots.length ? { scopes: slots } : {}),
          ...(requires
            ? { requires }
            : !primary && !isView && viewId
              ? { requires: [viewId] }
              : {}),
          ...(entry.risks?.[action.name]
            ? { risk: entry.risks[action.name] }
            : {}),
        });
        bindings.set(id, {
          menu: menuId,
          resource: { type: resource.type, id: resource.id },
          action: action.name,
          view: isView,
          viewId: isView ? undefined : viewId,
          scopes: (resource.dataScopes?.[action.name] ?? []).map((scope) => ({
            key: scope.key,
            collection: scope.collection,
            fields: scope.fields,
            visible: permissionScopeVisible(
              resource,
              action.name,
              scope.key,
              selection,
            ),
            follows:
              !isView &&
              viewId !== undefined &&
              scope.collection === viewCollection,
            defaultValue: scope.defaultValue ?? '',
          })),
        });
      }
    });
    return actions;
  };

  const pageAction = (
    menuId: string,
    page: string,
    label: string,
    view: boolean,
  ): PermissionAction => {
    const id = permissionRowId({ type: 'page', id: page }, 'access');
    seenPages.add(page);
    bindings.set(id, {
      menu: menuId,
      resource: { type: 'page', id: page },
      action: 'access',
      view,
      scopes: [],
    });
    return { id, label, ...(view ? { view: true } : {}) };
  };

  const pageTitles = new Map<string, LocalizedText>();
  const collectTitles = (items: readonly AppClientRegisteredRoute[]): void => {
    for (const route of items) {
      if (
        route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page'
      ) {
        const title = pagePermissionTitle(route, titles);
        if (title && !pageTitles.has(route.authz.resource.id))
          pageTitles.set(route.authz.resource.id, title);
      }
      collectTitles(route.children ?? []);
    }
  };
  collectTitles(routes);

  const menuFor = (
    route: AppClientRegisteredRoute,
    group: string | undefined,
  ): PermissionMenu | undefined => {
    const id = `menu:${route.packageName}:${route.name}`;
    const label = text(
      navigationTitle(route, titles) ??
        t('settings.unnamedPage', { path: route.path }),
    );
    if (route.authz === 'skip')
      return {
        id,
        label,
        ...(group ? { group } : {}),
        public: true,
        actions: [],
      };
    if (typeof route.authz !== 'object') return undefined;
    const names = routeNames(route);
    const resources = routeResources(route, true);
    const pages = resources
      .filter((resource) => resource.type === 'page')
      .map((resource) => resource.id)
      .filter((page) => !seenPages.has(page));
    const entries = selection.business.filter(
      (entry) =>
        !placed.has(resourceKey(entry)) &&
        (entry.menu ? names.has(entry.menu) : pages.includes(entry.id)),
    );
    const business = businessActions(id, entries);
    if (business.length) {
      pages.forEach((page) => seenPages.add(page));
      menuPages.set(id, pages);
      return { id, label, ...(group ? { group } : {}), actions: business };
    }
    const actions = pages.map((page, index) =>
      pageAction(
        id,
        page,
        index === 0
          ? t('settings.openPage')
          : t('settings.openNamedPage', {
              name: text(pageTitles.get(page) ?? page),
            }),
        index === 0,
      ),
    );
    return actions.length
      ? { id, label, ...(group ? { group } : {}), actions }
      : undefined;
  };

  // Business menus: top-level groups become modules; top-level pages share the main menu module.
  const modules: PermissionModule[] = [];
  let main: { id: string; label: string; menus: PermissionMenu[] } | undefined;
  const flatten = (
    items: readonly RouteNavigationItem[],
    group: string | undefined,
  ): PermissionMenu[] =>
    items.flatMap((item) => {
      const menus: PermissionMenu[] = [];
      if (item.route.componentLoader) {
        const menu = menuFor(item.route, group);
        if (menu) menus.push(menu);
      }
      const childGroup = item.route.componentLoader
        ? group
        : text(navigationTitle(item.route, titles) ?? item.route.name);
      return [...menus, ...flatten(item.children, childGroup)];
    });
  const businessNavigation = buildRouteNavigation(routes, new Set()).filter(
    (item) =>
      ![SETTINGS_GROUP, SETTINGS_HOME].includes(item.route.name) &&
      !(
        typeof item.route.authz === 'object' &&
        configuration.has(
          JSON.stringify([
            item.route.authz.resource.type,
            item.route.authz.resource.id,
          ]),
        )
      ),
  );
  for (const item of businessNavigation) {
    if (item.route.componentLoader) {
      const menu = menuFor(item.route, undefined);
      if (!menu) continue;
      if (!main) {
        main = {
          id: 'module:main',
          label: t('settings.permissionMainMenu'),
          menus: [],
        };
        modules.push(main);
      }
      main.menus.push(menu);
      main.menus.push(...flatten(item.children, undefined));
      continue;
    }
    const menus = flatten(item.children, undefined);
    if (menus.length)
      modules.push({
        id: `module:${item.route.packageName}:${item.route.name}`,
        label: text(navigationTitle(item.route, titles) ?? item.route.name),
        menus,
      });
  }

  // Administration: one menu per settings module, grouped by the settings home's categories.
  const administration: PermissionMenu[] = [];
  for (const category of buildSettingsCatalog(routes, new Set())) {
    const group = text(
      navigationTitle(category.route, titles) ?? category.route.name,
    );
    for (const module of category.modules) {
      const id = `admin:${module.route.packageName}:${module.route.name}`;
      const names = routeNames(module.route);
      const resources = routeResources(module.route, false);
      const actions: PermissionAction[] = [];
      const notices: string[] = [];
      resources.forEach((resource, index) => {
        if (resource.type === 'page') {
          if (!seenPages.has(resource.id))
            actions.push(
              pageAction(
                id,
                resource.id,
                index === 0
                  ? t('settings.openPage')
                  : t('settings.openNamedPage', {
                      name: text(pageTitles.get(resource.id) ?? resource.id),
                    }),
                index === 0,
              ),
            );
          return;
        }
        const key = resourceKey(resource);
        const catalogResource = catalog.get(key);
        const available: readonly {
          name: string;
          title: LocalizedText;
          description?: LocalizedText;
        }[] =
          resource.type === 'user'
            ? USER_ACTIONS.map((action) => ({
                name: action.name,
                title: { key: action.title },
              }))
            : (catalogResource?.actions ?? []);
        if (!available.length || placed.has(key)) return;
        placed.add(key);
        const viewName = available.some(
          (action) => action.name === resource.action,
        )
          ? resource.action
          : available[0]?.name;
        if (!viewName) return;
        const viewId = permissionRowId(resource, viewName);
        const several =
          resources.filter((item) => item.type !== 'page').length > 1;
        const title: LocalizedText = catalogResource?.title ?? {
          key: 'settings.userPermissions',
        };
        const risks = { ...SENSITIVE[key], ...ESCALATION[key] };
        if (ESCALATION[key])
          notices.push(
            t(
              `settings.escalation.${resource.type === 'user' ? 'users' : 'roles'}`,
            ),
          );
        for (const action of [
          ...available.filter((item) => item.name === viewName),
          ...available.filter((item) => item.name !== viewName),
        ]) {
          const actionId = permissionRowId(resource, action.name);
          const isView = action.name === viewName;
          const first = actions.length === 0;
          actions.push({
            id: actionId,
            label: several
              ? t('settings.permissionActionFor', {
                  action: text(action.title),
                  resource: text(title),
                })
              : text(action.title),
            ...(action.description
              ? { description: text(action.description) }
              : {}),
            ...(isView && first ? { view: true } : {}),
            ...(!isView ? { requires: [viewId] } : {}),
            ...(risks[action.name] ? { risk: risks[action.name] } : {}),
          });
          bindings.set(actionId, {
            menu: id,
            resource: { type: resource.type, id: resource.id },
            action: action.name,
            view: isView && first,
            scopes: [],
          });
        }
      });
      const entries = selection.business.filter(
        (entry) =>
          !placed.has(resourceKey(entry)) &&
          entry.menu &&
          names.has(entry.menu),
      );
      actions.push(...businessActions(id, entries));
      if (!actions.length) continue;
      administration.push({
        id,
        label: text(navigationTitle(module.route, titles) ?? module.route.name),
        group,
        actions,
        ...(notices.length ? { notice: notices.join(' ') } : {}),
      });
    }
  }

  // Pages no menu reaches, such as overlays with a grant of their own.
  const outside: PermissionMenu[] = [];
  const visitOutside = (items: readonly AppClientRegisteredRoute[]): void => {
    for (const route of items) {
      if (
        route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page' &&
        !seenPages.has(route.authz.resource.id) &&
        !configuration.has(JSON.stringify(['page', route.authz.resource.id]))
      ) {
        const page = route.authz.resource.id;
        const id = `page:${page}`;
        outside.push({
          id,
          label: text(
            pageTitles.get(page) ??
              t('settings.unnamedPage', { path: route.path }),
          ),
          description: route.path,
          actions: [pageAction(id, page, t('settings.openPage'), true)],
        });
      }
      visitOutside(route.children ?? []);
    }
  };
  visitOutside(routes);
  if (outside.length)
    modules.push({
      id: 'module:outside-navigation',
      label: t('settings.pagesOutsideNavigation'),
      menus: outside,
    });

  // Selected business resources no menu claims stay configurable instead of disappearing.
  const unplaced = selection.business.filter(
    (entry) =>
      !placed.has(resourceKey(entry)) && catalog.has(resourceKey(entry)),
  );
  if (unplaced.length)
    modules.push({
      id: 'module:business',
      label: t('settings.businessOperations'),
      menus: unplaced.flatMap((entry) => {
        const id = `business:${resourceKey(entry)}`;
        const actions = businessActions(id, [entry]);
        return actions.length
          ? [
              {
                id,
                label: text(catalog.get(resourceKey(entry))!.title),
                actions,
              },
            ]
          : [];
      }),
    });

  if (administration.length)
    modules.push({
      id: 'module:administration',
      label: t('settings.title'),
      administration: true,
      menus: administration,
    });
  return { modules, bindings, menuPages };
}
