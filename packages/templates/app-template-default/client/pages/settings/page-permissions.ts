import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import type { LocalizedText } from '@nocobase/app-plugin-authorization/client';
import { permissionRowId, type CatalogResource } from './permissions-model.js';
import type {
  PermissionEditorNavigationNode,
  PermissionEditorSection,
  PermissionEditorGroup,
} from '#components/permission-editor';
import {
  buildRouteNavigation,
  type RouteNavigationItem,
} from '../../routing/route-navigation.js';

/** Application route names are stable within their owner; labels never change stored grants. */
export type PagePermissionTitles = Readonly<Record<string, string>>;

export function pagePermissionTitle(
  route: AppClientRegisteredRoute,
  titles: PagePermissionTitles,
): LocalizedText | undefined {
  const key =
    (route.source === 'application' && Object.hasOwn(titles, route.name)
      ? titles[route.name]
      : undefined) ??
    route.navigation?.title ??
    route.breadcrumb?.title;
  return key?.trim() ? { key, ns: route.packageName } : undefined;
}

/** Preserve every existing resource id/action; never use a technical route id as its label. */
export function pagePermissionResources(
  routes: readonly AppClientRegisteredRoute[],
  titles: PagePermissionTitles,
  unnamed: (path: string) => string,
): CatalogResource[] {
  const resources = new Map<string, CatalogResource>();
  const visit = (items: readonly AppClientRegisteredRoute[]): void => {
    for (const route of items) {
      if (
        route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page'
      ) {
        const id = route.authz.resource.id;
        // Resolved child routes may inherit the parent's authorization resource.
        // They share one grant, so showing independent checkboxes is misleading.
        if (!resources.has(id))
          resources.set(id, {
            type: 'page',
            id,
            title: pagePermissionTitle(route, titles) ?? unnamed(route.path),
            actions: [{ name: 'access', title: { key: 'settings.access' } }],
          });
      }
      visit(route.children ?? []);
    }
  };
  visit(routes);
  return [...resources.values()];
}

/** Resource ownership follows the application's real settings branch, not translated labels or URL guesses. */
function configurationResources(
  routes: readonly AppClientRegisteredRoute[],
): ReadonlySet<string> {
  const resources = new Set<string>();
  const visit = (
    items: readonly AppClientRegisteredRoute[],
    inSettings = false,
  ): void => {
    for (const route of items) {
      const settings =
        inSettings ||
        (route.source === 'application' &&
          ['settings', 'systemManagement'].includes(route.name));
      if (
        settings &&
        route.componentLoader &&
        typeof route.authz === 'object'
      ) {
        resources.add(
          JSON.stringify([route.authz.resource.type, route.authz.resource.id]),
        );
      }
      visit(route.children ?? [], settings);
    }
  };
  visit(routes);
  return resources;
}

/** The business page tree excludes system settings, whose original grants are configured in their own category. */
export function pagePermissionNavigation(
  routes: readonly AppClientRegisteredRoute[],
  titles: PagePermissionTitles,
  unnamed: (path: string) => string,
  text: (value: LocalizedText) => string,
): readonly PermissionEditorNavigationNode[] {
  const configuration = configurationResources(routes);
  const pages = pagePermissionResources(routes, titles, unnamed).filter(
    ({ type, id }) => !configuration.has(JSON.stringify([type, id])),
  );
  const resources = new Map(pages.map((page) => [page.id, page]));
  const seen = new Set<string>();
  const visit = (
    items: readonly RouteNavigationItem[],
  ): PermissionEditorNavigationNode[] =>
    items.flatMap(({ route, children }) => {
      const resource =
        route.componentLoader &&
        typeof route.authz === 'object' &&
        route.authz.resource.type === 'page'
          ? resources.get(route.authz.resource.id)
          : undefined;
      const rowId =
        resource && !seen.has(resource.id)
          ? permissionRowId(resource, 'access')
          : undefined;
      if (rowId && resource) seen.add(resource.id);
      const descendants = visit(children);
      if (!rowId && !descendants.length) return [];
      return [
        {
          id: `menu:${route.packageName}:${route.id}:${route.path}`,
          label: text(
            rowId && resource
              ? resource.title
              : route.navigation?.title
                ? { key: route.navigation.title, ns: route.packageName }
                : unnamed(route.path),
          ),
          rowId,
          children: descendants,
        },
      ];
    });
  // Author the catalog from the complete menu, not the signed-in editor's filtered navigation.
  const navigation = visit(buildRouteNavigation(routes, new Set()));
  const outside = pages
    .filter((page) => !seen.has(page.id))
    .map((page) => ({
      id: `page:${page.id}`,
      label: text(page.title),
      rowId: permissionRowId(page, 'access'),
    }));
  return [
    ...navigation,
    ...(outside.length
      ? [
          {
            id: 'pages:outside-navigation',
            label: text({ key: 'settings.pagesOutsideNavigation' }),
            children: outside,
          },
        ]
      : []),
  ];
}

/** Reclassify existing controls only: system settings never create a second page-access permission. */
export function permissionNavigationSections(
  sections: readonly PermissionEditorSection[],
  routes: readonly AppClientRegisteredRoute[],
  titles: PagePermissionTitles,
  unnamed: (path: string) => string,
  text: (value: LocalizedText) => string,
): readonly PermissionEditorSection[] {
  const configuration = configurationResources(routes);
  const moved: PermissionEditorGroup[] = [];
  const result = sections
    .map((section) => {
      if (section.id === 'configuration') return section;
      const groups = section.groups.flatMap((group) => {
        const belongs = (row: (typeof group.rows)[number]): boolean => {
          const [type, id] = JSON.parse(row.id) as string[];
          return configuration.has(JSON.stringify([type, id]));
        };
        const settingsRows = group.rows.filter(belongs);
        if (settingsRows.length) moved.push({ ...group, rows: settingsRows });
        const rows = group.rows.filter((row) => !belongs(row));
        return rows.length ? [{ ...group, rows }] : [];
      });
      return {
        ...section,
        groups,
        ...(section.id === 'pages'
          ? {
              navigation: pagePermissionNavigation(
                routes,
                titles,
                unnamed,
                text,
              ),
            }
          : {}),
      };
    })
    .filter((section) => section.groups.length);
  if (!moved.length) return result;
  const target = result.find((section) => section.id === 'configuration');
  return target
    ? result.map((section) =>
        section === target
          ? { ...section, groups: [...section.groups, ...moved] }
          : section,
      )
    : [
        ...result,
        {
          id: 'configuration',
          title: text({ key: 'settings.configurationPermissions' }),
          description: text({ key: 'settings.configurationPermissionsHint' }),
          groups: moved,
        },
      ];
}
