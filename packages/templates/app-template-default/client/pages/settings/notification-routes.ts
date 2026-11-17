import { Bell, FileText, Settings } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
  type AppClientRouteDefinition,
} from '@nocobase/app-client/plugins';

/** Enable once notification business scenarios are used. Reuse this module for logs and other real views. */
export const notificationTemplateRoute = {
  name: 'notificationTemplates',
  path: '/settings/notifications/templates',
  auth: 'required' as const,
  authz: {
    resource: { type: 'page', id: 'notification.templates' },
    action: 'access',
  },
  navigation: { title: 'settings.notificationTemplates', icon: FileText },
  breadcrumb: { title: 'settings.notificationTemplates' },
  componentLoader: () => import('./notification-templates.js'),
  children: [
    // The template list renders the selected template in its own drawer, so this route only gives each template an
    // address. The list page reads the parameter and renders no outlet.
    {
      name: 'notificationTemplate',
      path: ':templateId',
      componentLoader: () => import('./notification-templates.js'),
    },
  ],
};

/** Add the template view once to the existing module, preserving logs, paths and grants. */
export function includeNotificationTemplateRoutes(
  contributions: readonly AppClientRouteContribution[],
  invitationConfigured: boolean,
): readonly AppClientRouteContribution[] {
  const roots = contributions.flatMap((contribution) => contribution.routes);
  const nodes = new Map<
    string,
    { route: AppClientRouteDefinition; parent?: string }
  >();
  const collect = (
    items: readonly AppClientRouteDefinition[],
    parent?: string,
  ): void => {
    for (const route of items) {
      nodes.set(route.name, { route, parent: route.parent ?? parent });
      collect(route.children ?? [], route.name);
    }
  };
  collect(roots);
  const pathOf = (name: string): string => {
    const node = nodes.get(name);
    if (!node) return '';
    const base = node.parent ? pathOf(node.parent) : '';
    return `${base}/${node.route.path ?? ''}`
      .replace(/\/{2,}/g, '/')
      .replace(/\/$/, '');
  };
  const templateUnder = (base: string) => ({
    ...notificationTemplateRoute,
    path:
      base && notificationTemplateRoute.path.startsWith(`${base}/`)
        ? notificationTemplateRoute.path.slice(base.length)
        : notificationTemplateRoute.path,
  });
  if (nodes.has('notificationTemplates')) return contributions;
  if (nodes.has('notificationManagement')) {
    const add = (
      items: readonly AppClientRouteDefinition[],
    ): readonly AppClientRouteDefinition[] =>
      items.map((route) => ({
        ...route,
        ...(route.name === 'notificationManagement'
          ? {
              children: [
                ...(route.children ?? []),
                templateUnder(pathOf('notificationManagement')),
              ],
            }
          : route.children
            ? { children: add(route.children) }
            : {}),
      }));
    return contributions.map((contribution) =>
      defineAppRoutes(add(contribution.routes)),
    );
  }
  if (!invitationConfigured) return contributions;
  const parent = nodes.has('settingsSystem') ? 'settingsSystem' : 'settings';
  const module = {
    name: 'notificationManagement',
    navigation: {
      title: 'settings.notificationManagement',
      description: 'settings.notificationManagementDescription',
      icon: Bell,
    },
    breadcrumb: { title: 'settings.notificationManagement' },
    children: [templateUnder(pathOf(parent))],
  };
  if (nodes.has(parent))
    return [
      ...contributions.slice(0, 1),
      defineAppRoutes([{ ...module, parent }]),
      ...contributions.slice(1),
    ];
  // A configured built-in invitation is business use even before other settings pages are enabled.
  return [
    ...contributions,
    defineAppRoutes([
      {
        name: 'settings',
        navigation: { title: 'settings.title', icon: Settings, order: 100 },
        breadcrumb: { title: 'settings.title' },
        children: [module],
      },
    ]),
  ];
}
