import type { ClientApplication } from '@nocobase/app-client';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';

import type {
  FoundationProviderEntry,
  FoundationProviderInventory,
} from '../shared/foundation.js';

/** Browser-observed contributions stay in the view; they never replace the server's usage evidence. */
export function clientProviderNames(app: ClientApplication): readonly string[] {
  const names = new Set<string>();
  for (const plugin of app.runtime.registeredPlugins ?? [])
    names.add(plugin.packageName);
  const routes = (nodes: readonly AppClientRegisteredRoute[]): void => {
    for (const node of nodes) {
      if (node.source === 'plugin') names.add(node.packageName);
      routes(node.children ?? []);
    }
  };
  routes(app.runtime.routes);
  for (const provider of app.runtime.reactProviders)
    if (provider.source === 'plugin') names.add(provider.packageName);
  for (const { context } of app.runtime.serviceProviders)
    if (context.source === 'plugin') names.add(context.packageName);
  return [...names].sort();
}

export function withClientProviders(
  inventory: FoundationProviderInventory,
  names: readonly string[],
): FoundationProviderInventory {
  const observed = new Set(names);
  const entries: FoundationProviderEntry[] = inventory.entries.map((entry) => {
    if (!observed.delete(entry.name)) return entry;
    return {
      ...entry,
      registration: 'observed',
      evidence: [...entry.evidence, 'clientContribution'],
    };
  });
  for (const name of observed)
    entries.push({
      name,
      version: null,
      installed: false,
      kind: 'plugin',
      origin: 'unverified',
      categories: [],
      registration: 'observed',
      evidence: ['clientContribution'],
    });
  return {
    ...inventory,
    entries: entries.sort((a, b) => a.name.localeCompare(b.name)),
  };
}
