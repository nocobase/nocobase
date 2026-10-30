import {
  compareNavigationOrder,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';

import type {
  FoundationBusinessModule,
  FoundationModuleLink,
  FoundationModuleSources,
  FoundationProviderInventory,
  FoundationApiEvidence,
} from '../shared/foundation.js';

const SELF = '@nocobase/app-plugin-foundation';

function normalizedStaticPath(path: string): string | undefined {
  if (!path.startsWith('/') || /[:*?#[\]{}]/.test(path)) return undefined;
  return path.replace(/\/{2,}/g, '/').replace(/\/+$/, '') || '/';
}

function mergeTopLevelGroups(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  const merged: AppClientRegisteredRoute[] = [];
  const groups = new Map<string, number>();
  for (const route of [...routes].sort(compareNavigationOrder)) {
    const path =
      route.componentLoader === undefined && route.navigation
        ? normalizedStaticPath(route.path)
        : undefined;
    const key = path
      ? JSON.stringify([
          route.packageName,
          path,
          route.navigation?.title,
          route.breadcrumb?.title,
        ])
      : undefined;
    const previousIndex = key === undefined ? undefined : groups.get(key);
    if (previousIndex === undefined) {
      if (key !== undefined) groups.set(key, merged.length);
      merged.push(route);
      continue;
    }
    const previous = merged[previousIndex];
    merged[previousIndex] = {
      ...previous,
      children: [...(previous.children ?? []), ...(route.children ?? [])],
    };
  }
  return merged;
}

/** Navigation supplies module identity and titles; child pages belong to their nearest top-level menu module. */
export function businessModules(
  routes: readonly AppClientRegisteredRoute[],
  inventory: FoundationProviderInventory | undefined,
  sources: FoundationModuleSources | undefined,
  capabilities: readonly string[],
): readonly FoundationBusinessModule[] {
  const available = new Set(capabilities);
  const modules: FoundationBusinessModule[] = [];
  const descendants = (
    route: AppClientRegisteredRoute,
  ): AppClientRegisteredRoute[] =>
    route.packageName === SELF || route.auth === 'guest'
      ? []
      : [route, ...(route.children ?? []).flatMap(descendants)];
  const visit = (nodes: readonly AppClientRegisteredRoute[]): void => {
    for (const node of [...nodes].sort(compareNavigationOrder)) {
      if (node.packageName === SELF || node.auth === 'guest') continue;
      if (!node.navigation) {
        visit(node.children ?? []);
        continue;
      }
      const pages = descendants(node).filter((route) => {
        return route.componentLoader !== undefined;
      });
      if (!pages.length) continue;
      const links = new Map<
        string,
        {
          evidence: Set<FoundationModuleLink['evidence'][number]>;
          providers: Set<string>;
          apiEvidence: FoundationApiEvidence[];
        }
      >();
      const add = (
        key: string,
        evidence: FoundationModuleLink['evidence'][number],
        provider?: string,
      ): void => {
        if (!available.has(key)) return;
        const link = links.get(key) ?? {
          evidence: new Set(),
          providers: new Set(),
          apiEvidence: [],
        };
        link.evidence.add(evidence);
        if (provider) link.providers.add(provider);
        links.set(key, link);
      };
      const provider = (
        name: string,
        evidence: 'provider' | 'source' | 'apiSource',
      ): void => {
        const entry = inventory?.entries.find((item) => item.name === name);
        if (!entry || name === SELF) return;
        // A broad SDK/provider can implement several unrelated capabilities. A package reference cannot
        // establish which of them this page uses; retain only more specific route/source evidence.
        if (entry.categories.length > 1) return;
        const keys = entry.categories.length
          ? entry.categories
          : [`extension:${name}`];
        for (const key of keys) add(key, evidence, name);
      };
      let complete = true;
      const collections = new Set<string>();
      for (const page of pages) {
        add('interface', 'page');
        if (page.auth === 'required')
          add('usersAndOrganizations', 'authentication');
        if (page.authz && page.authz !== 'skip')
          add('permissions', 'authorization');
        if (page.source === 'plugin') provider(page.packageName, 'provider');
        const source = sources?.routes.find(
          (item) =>
            item.packageName === page.packageName &&
            item.routeName === page.name,
        );
        complete &&= source?.complete ?? false;
        for (const name of source?.providers ?? []) provider(name, 'source');
        for (const name of source?.apiProviders ?? [])
          provider(name, 'apiSource');
        for (const link of links.values())
          for (const evidence of source?.apiEvidence ?? []) {
            const names = evidence.providers.filter((name) =>
              link.providers.has(name),
            );
            if (!names.length) continue;
            const item = { ...evidence, providers: names };
            if (
              !link.apiEvidence.some(
                (entry) => JSON.stringify(entry) === JSON.stringify(item),
              )
            )
              link.apiEvidence.push(item);
          }
        for (const name of source?.collections ?? []) collections.add(name);
      }
      modules.push({
        id: node.id,
        title: { key: node.navigation.title, ns: node.packageName },
        pageCount: new Set(pages.map((page) => page.id)).size,
        complete,
        links: [...links].map(([capability, link]) => ({
          capability,
          evidence: [...link.evidence],
          providers: [...link.providers].sort(),
          ...(link.apiEvidence.length ? { apiEvidence: link.apiEvidence } : {}),
          ...(capability === 'dataModeling' && collections.size
            ? { collections: [...collections].sort() }
            : {}),
        })),
      });
    }
  };
  visit(mergeTopLevelGroups(routes));
  return modules;
}
