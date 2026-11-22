import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type {
  AuthorizationOptionsResponse,
  LocalizedText,
} from '../authorization-client.js';
import type {
  PermissionAction,
  PermissionMenuNode,
  PermissionMenuUses,
  PermissionObject,
  PermissionRisk,
  PermissionScopeOption,
  PermissionScopeSlot,
  PermissionSettingsPage,
} from '#components/permission-editor';
import type {
  PermissionNavigationItem,
  PermissionPageCatalog,
} from './page-catalog.js';
import type { PermissionWorkspaceSelection } from './workspace-selection.js';
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

/** Titles of the collections registered with `authz.database.collections.add`, by collection name. */
export function collectionTitles(
  source: Pick<AuthorizationOptionsResponse, 'sections' | 'collections'>,
): ReadonlyMap<string, LocalizedText> {
  const titles = new Map<string, LocalizedText>();
  for (const collection of source.collections ?? [])
    if (collection.title !== undefined)
      titles.set(collection.name, collection.title);
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
  selection?: PermissionWorkspaceSelection,
  action?: string,
  registered?: ReadonlyMap<string, LocalizedText>,
): LocalizedText {
  const selected = selection?.business.find((entry) =>
    resource.type === 'database.collection'
      ? entry.scopeTitles?.[scope.collection] !== undefined
      : entry.type === resource.type && entry.id === resource.id,
  );
  const actionTitles = action
    ? selected?.actionScopeTitles?.[action]
    : undefined;
  return (
    (scope.key === undefined ? undefined : actionTitles?.[scope.key]) ??
    actionTitles?.[scope.collection] ??
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
  selection?: PermissionWorkspaceSelection,
): boolean {
  return !selection?.business
    .find((entry) => entry.type === resource.type && entry.id === resource.id)
    ?.hiddenActionScopes?.[action]?.includes(scopeKey);
}

export function permissionFilterFieldLabel(
  collection: string,
  field: string,
  text: (key: string, fallback?: string) => string,
  selection?: PermissionWorkspaceSelection,
): string {
  const title = selection?.filterFieldTitles?.[collection]?.[field];
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
 * the permissions they already have, so they are never turned on automatically and the object explains why.
 */
/**
 * The Roles and permissions page's own settings, named as its tabs name them rather than by the resource titles their
 * packages register for the API, such as "Permission Sets".
 */
const SETTINGS_TITLES: Readonly<Record<string, string>> = {
  'settings:authorization.permission-sets': 'settings.roles',
  'settings:authorization.default-access': 'settings.defaultAccess.title',
  'settings:authorization.sharing-rules': 'settings.sharingRules.title',
  'settings:authorization.restriction-rules': 'settings.restrictionRules.title',
};

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

/** A business object's id in the editor: its stored resource. */
export const permissionObjectId = (resource: {
  type: string;
  id: string;
}): string => `${resource.type}:${resource.id}`;

const resourceKey = permissionObjectId;

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

/** The menu's route and the descendants it reaches without opening another menu entry. */
function menuRoutes(
  route: AppClientRegisteredRoute,
): AppClientRegisteredRoute[] {
  return [
    route,
    ...(route.children ?? [])
      .filter((child) => !child.navigation || !child.componentLoader)
      .flatMap(menuRoutes),
  ];
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
 * Menus lists the complete application navigation and stores page access. Business objects lists the selected
 * resources and their catalog actions once for every menu that uses them. System settings lists the settings pages
 * and the resources and actions those pages actually use.
 */
export function permissionWorkspace(
  source: AuthorizationOptionsResponse,
  pageCatalog: PermissionPageCatalog,
  titles: PagePermissionTitles,
  words: PermissionWorkspaceText,
  selection: PermissionWorkspaceSelection,
): PermissionWorkspace {
  const { text, t } = words;
  const catalog = new Map<string, CatalogResource>();
  const subsectionTitles = new Map<string, LocalizedText>();
  for (const section of source.sections)
    for (const sub of section.subsections)
      for (const resource of sub.resources)
        if (!catalog.has(resourceKey(resource))) {
          catalog.set(resourceKey(resource), resource);
          subsectionTitles.set(resourceKey(resource), sub.title);
        }
  const registeredTitles = collectionTitles(source);
  const bindings = new Map<string, PermissionBinding>();
  const menuPages = new Map<string, readonly string[]>();
  const seenPages = new Set<string>();
  const { routes } = pageCatalog;
  const configuration = configurationResources(pageCatalog);

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

  const viewNameOf = (
    entry: PermissionWorkspaceSelection['business'][number],
    resource: CatalogResource,
  ): string | undefined => {
    const selected = resource.actions.filter((action) =>
      entry.actions.includes(action.name),
    );
    return (
      entry.view ??
      selected.find((action) => action.name === 'view')?.name ??
      selected.find((action) => action.name === 'read')?.name
    );
  };

  /** Each business object's View by the collection it reads, so a scope on that collection anywhere follows it. */
  const viewsByCollection = new Map<string, string>();
  for (const entry of selection.business) {
    const resource = catalog.get(resourceKey(entry));
    const viewName = resource ? viewNameOf(entry, resource) : undefined;
    const collection = viewName
      ? resource?.dataScopes?.[viewName]?.[0]?.collection
      : undefined;
    if (
      resource &&
      viewName &&
      collection &&
      !viewsByCollection.has(collection)
    )
      viewsByCollection.set(collection, permissionRowId(resource, viewName));
  }

  /**
   * One business object: View first. Every other scope on View's collection follows View, and a scope on another
   * object's records follows that object's View, so each object's data scope is set in one place.
   */
  const businessObject = (
    entry: PermissionWorkspaceSelection['business'][number],
    resource: CatalogResource,
  ): PermissionObject | undefined => {
    const selected = resource.actions.filter((action) =>
      entry.actions.includes(action.name),
    );
    if (!selected.length) return undefined;
    const viewName = viewNameOf(entry, resource);
    const viewId = viewName ? permissionRowId(resource, viewName) : undefined;
    const viewCollection = viewName
      ? resource.dataScopes?.[viewName]?.[0]?.collection
      : undefined;
    const ordered = [
      ...selected.filter((action) => action.name === viewName),
      ...selected.filter((action) => action.name !== viewName),
    ];
    const actions: PermissionAction[] = [];
    for (const action of ordered) {
      const id = permissionRowId(resource, action.name);
      const isView = action.name === viewName;
      const declared = resource.dataScopes?.[action.name] ?? [];
      const scopes = declared.filter((scope) =>
        permissionScopeVisible(resource, action.name, scope.key, selection),
      );
      // The View this scope follows: this object's, or the one of the object whose records it reads.
      const follows = (collection: string): string | undefined => {
        if (collection === viewCollection) return isView ? undefined : viewId;
        const other = viewsByCollection.get(collection);
        return other && other !== id ? other : undefined;
      };
      const slots: PermissionScopeSlot[] = scopes.map((scope) => {
        const leader = follows(scope.collection);
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
            leader !== undefined,
          ),
          ...(leader !== undefined && leader === viewId
            ? { followsView: true }
            : {
                // Another object's View is followed only while it is on; otherwise this default applies.
                ...(leader ? { followsView: leader } : {}),
                defaultValue: scope.defaultValue
                  ? scope.defaultValue
                  : NO_SCOPE,
              }),
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
      const description =
        entry.actionDescriptions?.[action.name] ?? action.description;
      actions.push({
        id,
        label: text(action.title),
        ...(description ? { description: text(description) } : {}),
        ...(isView ? { view: true } : {}),
        ...(!BASIC_ACTIONS.has(action.name) ? { business: true } : {}),
        ...(slots.length ? { scopes: slots } : {}),
        ...(entry.requires?.[action.name]
          ? {
              requires: entry.requires[action.name].map((name) =>
                permissionRowId(resource, name),
              ),
            }
          : {}),
        ...(entry.risks?.[action.name]
          ? { risk: entry.risks[action.name] }
          : {}),
      });
      bindings.set(id, {
        resource: { type: resource.type, id: resource.id },
        action: action.name,
        view: isView,
        scopes: declared.map((scope) => ({
          key: scope.key,
          collection: scope.collection,
          fields: scope.fields,
          visible: permissionScopeVisible(
            resource,
            action.name,
            scope.key,
            selection,
          ),
          follows: follows(scope.collection),
          defaultValue: scope.defaultValue ?? '',
        })),
      });
    }
    const key = resourceKey(resource);
    const group = entry.group ?? subsectionTitles.get(key);
    return {
      id: key,
      label: text(resource.title),
      ...(group ? { group: text(group) } : {}),
      actions,
    };
  };

  const objects: PermissionObject[] = [];
  const objectIds = new Set<string>();
  for (const entry of selection.business) {
    const resource = catalog.get(resourceKey(entry));
    if (!resource || objectIds.has(resourceKey(entry))) continue;
    const object = businessObject(entry, resource);
    if (!object) continue;
    objects.push(object);
    objectIds.add(object.id);
  }

  /**
   * A settings resource as an object of its own, with the real actions the server registers for it. Settings objects
   * are set only in the System settings tab, never among the business objects.
   */
  const settingsObjects: PermissionObject[] = [];
  const settingsObject = (resource: {
    type: string;
    id: string;
    action?: string;
  }): PermissionObject | undefined => {
    const key = resourceKey(resource);
    const existing = settingsObjects.find((object) => object.id === key);
    if (existing) return existing;
    const catalogResource = catalog.get(key);
    const available: CatalogResource['actions'] =
      resource.type === 'user'
        ? USER_ACTIONS.map((action) => ({
            name: action.name,
            title: { key: action.title },
          }))
        : (catalogResource?.actions ?? []);
    if (!available.length) return undefined;
    const viewName =
      resource.action &&
      (available.some((action) => action.name === resource.action)
        ? resource.action
        : available[0]?.name);
    const risks = ESCALATION[key] ?? {};
    const actions: PermissionAction[] = [];
    for (const action of [
      ...available.filter((item) => item.name === viewName),
      ...available.filter((item) => item.name !== viewName),
    ]) {
      const id = permissionRowId(resource, action.name);
      const isView = action.name === viewName;
      const risk = risks[action.name] ?? action.risk;
      actions.push({
        id,
        label: text(action.title),
        ...(action.description
          ? { description: text(action.description) }
          : {}),
        ...(isView ? { view: true } : {}),
        ...(risk ? { risk } : {}),
      });
      bindings.set(id, {
        resource: { type: resource.type, id: resource.id },
        action: action.name,
        view: isView,
        scopes: [],
      });
    }
    const object: PermissionObject = {
      id: key,
      label: SETTINGS_TITLES[key]
        ? t(SETTINGS_TITLES[key])
        : text(catalogResource?.title ?? { key: 'settings.userPermissions' }),
      actions,
      ...(ESCALATION[key]
        ? {
            notice: t(
              `settings.escalation.${resource.type === 'user' ? 'users' : 'roles'}`,
            ),
          }
        : {}),
    };
    settingsObjects.push(object);
    return object;
  };

  /** A settings page guarded by a page grant: one action that opens it, stored as that page's access. */
  const pageObject = (page: string, label: string): PermissionObject => {
    const id = permissionRowId({ type: 'page', id: page }, 'access');
    bindings.set(id, {
      resource: { type: 'page', id: page },
      action: 'access',
      view: true,
      scopes: [],
    });
    return {
      id: `page:${page}`,
      label,
      actions: [{ id, label: t('settings.openPage'), view: true }],
    };
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

  /** Listed objects whose composite declares `usedOn` with this page id. */
  const usedOnPage = (page: string): string[] =>
    selection.business.flatMap((entry) => {
      const key = resourceKey(entry);
      return objectIds.has(key) && catalog.get(key)?.usedOn?.includes(page)
        ? [key]
        : [];
    });

  const businessIds = (ids: readonly string[] | undefined): string[] =>
    (ids ?? []).flatMap((id) => {
      const entry = selection.business.find((item) => item.id === id);
      const key = entry ? resourceKey(entry) : undefined;
      return key && objectIds.has(key) ? [key] : [];
    });

  /** Use each page's explicit mapping, or infer its primary object once per page grant. */
  const usesOf = (
    routes: readonly AppClientRegisteredRoute[],
    pages: readonly string[],
  ): PermissionMenuUses | undefined => {
    const primary = new Set<string>();
    const related = new Set<string>();
    const remainingPages = new Set(pages);
    for (const route of routes) {
      const page =
        route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page'
          ? route.authz.resource.id
          : undefined;
      // A descendant can inherit the same grant. It must not reintroduce an inferred object for that grant.
      const infer = page !== undefined && remainingPages.delete(page);
      const declared =
        selection.pages && Object.hasOwn(selection.pages, route.name)
          ? selection.pages[route.name]
          : undefined;
      businessIds(
        declared ? declared.primary : infer ? [page] : undefined,
      ).forEach((id) => primary.add(id));
      // Objects the server declares as used on this page, unless the application maps the page itself.
      if (!declared && infer) usedOnPage(page).forEach((id) => primary.add(id));
      businessIds(declared?.related).forEach((id) => related.add(id));
    }
    for (const id of primary) related.delete(id);
    if (!primary.size && !related.size) return undefined;
    return {
      ...(primary.size ? { primary: [...primary] } : {}),
      ...(related.size ? { related: [...related] } : {}),
    };
  };

  const menuFor = (
    route: AppClientRegisteredRoute,
  ): PermissionMenuNode | undefined => {
    const id = `menu:${route.packageName}:${route.name}`;
    const label = text(
      navigationTitle(route, titles) ??
        t('settings.unnamedPage', { path: route.path }),
    );
    if (route.authz === 'skip') return { id, label, public: true };
    if (typeof route.authz !== 'object') return undefined;
    const resources = routeResources(route, true);
    const pages = resources
      .filter((resource) => resource.type === 'page')
      .map((resource) => resource.id)
      .filter((page) => !seenPages.has(page));
    const uses = usesOf(menuRoutes(route), pages);
    if (pages.length) {
      pages.forEach((page) => seenPages.add(page));
      menuPages.set(id, pages);
      return { id, label, ...(uses ? { uses } : {}) };
    }
    // A page guarded by a business action opens with that object's View.
    const guard = resources[0];
    const object = guard
      ? objects.find((item) => item.id === resourceKey(guard))
      : undefined;
    const view = object?.actions.find((action) => action.view);
    return view
      ? { id, label, opensWith: view.id, ...(uses ? { uses } : {}) }
      : undefined;
  };

  // Preserve the sidebar hierarchy for business pages.
  const menus: PermissionMenuNode[] = [];
  const branch = (
    items: readonly PermissionNavigationItem[],
  ): PermissionMenuNode[] =>
    items.flatMap((item) => {
      const nodes: PermissionMenuNode[] = [];
      if (item.route.componentLoader) {
        const menu = menuFor(item.route);
        if (menu) nodes.push(menu);
        nodes.push(...branch(item.children));
        return nodes;
      }
      const children = branch(item.children);
      return children.length
        ? [
            {
              id: `group:${item.route.packageName}:${item.route.name}`,
              label: text(
                navigationTitle(item.route, titles) ?? item.route.name,
              ),
              children,
            },
          ]
        : [];
    });
  const businessNavigation = pageCatalog.navigation.filter(
    (item) =>
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
  // Top-level pages and groups are listed as the sidebar shows them, without a group around the top-level pages.
  for (const item of businessNavigation) menus.push(...branch([item]));

  // System settings: one page per settings module, grouped by the settings home's categories, in their own tab. A
  // settings page has no menu checkbox: it shows in the sidebar while the action that opens it is on.
  const settings: PermissionSettingsPage[] = [];
  for (const category of pageCatalog.settings) {
    const group = text(
      navigationTitle(category.route, titles) ?? category.route.name,
    );
    for (const module of category.modules) {
      const label = text(
        navigationTitle(module.route, titles) ?? module.route.name,
      );
      const resources = routeResources(module.route, false);
      const pages = resources
        .filter((resource) => resource.type === 'page')
        .map((resource) => resource.id)
        .filter((page) => !seenPages.has(page));
      pages.forEach((page) => seenPages.add(page));
      const pageObjects = pages.map((page, index) =>
        pageObject(
          page,
          index === 0 ? label : text(pageTitles.get(page) ?? page),
        ),
      );
      const used = resources
        .filter((resource) => resource.type !== 'page')
        .flatMap((resource) => {
          const object = settingsObject(resource);
          return object ? [object] : [];
        });
      const related = (module.route.navigation?.relatedSettings ?? []).flatMap(
        (id) => {
          const object = settingsObject({ type: 'settings', id });
          return object ? [object] : [];
        },
      );
      const pageObjectsUsed = [...pageObjects, ...used, ...related].filter(
        (object, index, all) =>
          all.findIndex((item) => item.id === object.id) === index,
      );
      if (!pageObjectsUsed.length) continue;
      settings.push({
        id: `admin:${module.route.packageName}:${module.route.name}`,
        label,
        group,
        objects: pageObjectsUsed,
      });
    }
  }

  // Pages no menu reaches, such as overlays with a grant of their own.
  const outside: PermissionMenuNode[] = [];
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
        seenPages.add(page);
        menuPages.set(id, [page]);
        const uses = usesOf([route], [page]);
        outside.push({
          id,
          label: text(
            pageTitles.get(page) ??
              t('settings.unnamedPage', { path: route.path }),
          ),
          description: route.path,
          ...(uses ? { uses } : {}),
        });
      }
      visitOutside(route.children ?? []);
    }
  };
  visitOutside(routes);
  if (outside.length)
    menus.push({
      id: 'group:outside-navigation',
      label: t('settings.pagesOutsideNavigation'),
      children: outside,
    });

  // Where each object is used, by the pages that list it, and which pages turn its actions on.
  const leaves = (nodes: readonly PermissionMenuNode[]): PermissionMenuNode[] =>
    nodes.flatMap((node) => (node.children ? leaves(node.children) : [node]));
  const pageMenus = leaves(menus);
  const placed = objects.map((object): PermissionObject => {
    const usedOn = pageMenus
      .filter(
        (menu) =>
          menu.uses?.primary?.includes(object.id) ||
          menu.uses?.related?.includes(object.id),
      )
      .map((menu) => menu.label);
    return {
      ...object,
      usedOn,
      // An object no page uses serves integrations, automations and scheduled tasks.
      ...(usedOn.length
        ? {}
        : { group: t('settings.permissionEditor.otherOperations') }),
    };
  });
  // Objects used on pages come first, in their groups; the rest are listed last under Other operations.
  const ordered = [
    ...placed.filter((object) => object.usedOn?.length),
    ...placed.filter((object) => !object.usedOn?.length),
  ];
  const menuDefaults: Record<string, string[]> = {};
  for (const [menu, pages] of menuPages)
    for (const [id, binding] of bindings) {
      const action = catalog
        .get(resourceKey(binding.resource))
        ?.actions.find((item) => item.name === binding.action);
      if (
        action?.defaultFor?.some((page) => pages.includes(page)) &&
        ordered.some((object) => object.actions.some((item) => item.id === id))
      )
        (menuDefaults[menu] ??= []).push(id);
    }
  return {
    menus,
    objects: ordered,
    settings,
    bindings,
    menuPages,
    menuDefaults,
  };
}
