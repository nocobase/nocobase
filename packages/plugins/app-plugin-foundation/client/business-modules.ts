import {
  compareNavigationOrder,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';

import type {
  FoundationBusinessModule,
  FoundationModuleLink,
  FoundationModuleSources,
  FoundationProviderInventory,
} from '../shared/foundation.js';

const SELF = '@nocobase/app-plugin-foundation';

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
      const pages = descendants(node).filter((route) => route.componentLoader);
      if (!pages.length) continue;
      const links = new Map<
        string,
        {
          evidence: Set<FoundationModuleLink['evidence'][number]>;
          providers: Set<string>;
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
        for (const name of source?.collections ?? []) collections.add(name);
      }
      modules.push({
        id: node.id,
        title: { key: node.navigation.title, ns: node.packageName },
        pageCount: pages.length,
        complete,
        links: [...links].map(([capability, link]) => ({
          capability,
          evidence: [...link.evidence],
          providers: [...link.providers].sort(),
          ...(capability === 'dataModeling' && collections.size
            ? { collections: [...collections].sort() }
            : {}),
        })),
      });
    }
  };
  visit(routes);
  return modules;
}
