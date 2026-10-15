// @vitest-environment node

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import clientPlugins from '../../client/plugins.js';
import { reactProviders } from '../../client/react-providers.js';

const appRoot = fileURLToPath(new URL('../..', import.meta.url));

interface AppPackageJson {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

const appPackage = JSON.parse(
  readFileSync(path.join(appRoot, 'package.json'), 'utf8'),
) as AppPackageJson;

const registeredClientPackages = clientPlugins.plugins.map(
  (plugin) => plugin.packageName,
);

describe('client plugin registry consistency', () => {
  it('mounts the owner cache inside authentication in the valid provider layer', () => {
    const resolved = resolveAppClientContributions([
      ...clientPlugins.plugins.map((plugin) => ({
        ...plugin,
        source: 'plugin' as const,
      })),
      {
        packageName: '@nocobase/studio',
        source: 'application',
        reactProviders,
      },
    ]);
    const ids = resolved.reactProviders.map((provider) => provider.id);
    const auth = ids.indexOf(
      '@nocobase/app-plugin-authentication:authentication',
    );
    const cache = ids.indexOf(
      '@nocobase/app-plugin-agent-sessions:owner-cache',
    );
    expect(auth).toBeGreaterThanOrEqual(0);
    expect(cache).toBeGreaterThan(auth);
  });
  it('declares every client plugin as a dependency', () => {
    const undeclared = registeredClientPackages.filter(
      (packageName) =>
        appPackage.devDependencies?.[packageName] === undefined &&
        appPackage.dependencies?.[packageName] === undefined,
    );

    expect(undeclared).toEqual([]);
  });

  it('does not register the API key plugin’s page', () => {
    // Studio routes its own API key pages (Account settings › API keys, Settings › API keys): the plugin's predates scopes.
    expect(
      clientPlugins.plugins.find(
        (entry) => entry.packageName === '@nocobase/app-plugin-api-keys',
      ),
    ).toBeUndefined();
  });

  it('registers no package twice', () => {
    expect(new Set(registeredClientPackages).size).toBe(
      registeredClientPackages.length,
    );
  });
});
