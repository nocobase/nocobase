import { groupFoundationNavigation } from '@nocobase/app-plugin-foundation/client';
import { Workflow } from 'lucide-react';
import type { RouteNavigationItem } from '../routing/route-navigation.js';

/** Examples share one shallow workflow menu; route ownership, URLs and guards stay with their plugins. */
export function groupWorkflowNavigation(
  items: RouteNavigationItem[],
): RouteNavigationItem[] {
  const owners = new Set([
    '@nocobase/app-plugin-lifecycle-example',
    '@nocobase/app-plugin-office-flows-example',
  ]);
  const isWorkflow = (item: RouteNavigationItem) =>
    owners.has(item.route.packageName);
  const roots = items.filter(isWorkflow);
  if (!roots.length) return items;
  const flatten = (
    nodes: readonly RouteNavigationItem[],
  ): RouteNavigationItem[] =>
    nodes.flatMap((item) => [
      ...(item.route.componentLoader
        ? [{ route: item.route, children: [] }]
        : []),
      ...flatten(item.children),
    ]);
  const pages = flatten(roots);
  const management = new Set([
    'workflows',
    'lifecycleExampleParameters',
    'officeFlowsConfiguration',
  ]);
  const prototype = roots[0].route;
  const applicationPackage =
    pages.find((item) => item.route.name === 'workflows')?.route.packageName ??
    items.find((item) => item.route.source === 'application')?.route
      .packageName ??
    prototype.packageName;
  const group = (
    id: string,
    title: string,
    children: RouteNavigationItem[],
    section = false,
  ): RouteNavigationItem => ({
    section,
    route: {
      ...prototype,
      name: id,
      id,
      path: '/',
      packageName: applicationPackage,
      source: 'application',
      componentLoader: undefined,
      children: undefined,
      navigation: { title, icon: section ? undefined : Workflow },
    },
    children,
  });
  const business = pages.filter((item) => !management.has(item.route.name));
  const combined = group(
    'workflowNavigation',
    'workflows.businessGroup',
    business,
  );
  const first = items.findIndex(isWorkflow);
  return items.flatMap((item, index) =>
    index === first
      ? business.length
        ? [combined]
        : []
      : isWorkflow(item)
        ? []
        : [item],
  );
}

export function transformNavigation(
  items: RouteNavigationItem[],
): RouteNavigationItem[] {
  return groupFoundationNavigation(
    collapsePermissionNavigation(groupWorkflowNavigation(items)),
    'systemManagement',
  );
}

/** One sidebar entry opens the first readable tab; original routes and guards remain unchanged. */
export function collapsePermissionNavigation(
  items: RouteNavigationItem[],
): RouteNavigationItem[] {
  return items.map((item) => {
    if (item.route.name !== 'permissionManagement')
      return {
        ...item,
        children: collapsePermissionNavigation([...item.children]),
      };
    const first = item.children[0];
    if (!first) return item;
    return {
      route: {
        ...first.route,
        name: item.route.name,
        navigation: item.route.navigation,
      },
      children: [],
      activeRouteKeys: item.children.map(
        (child) =>
          `${child.route.packageName}:${child.route.path}:${child.route.id}`,
      ),
    };
  });
}
