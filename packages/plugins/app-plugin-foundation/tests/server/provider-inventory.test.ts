import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { collectProviderInventory } from '../../server/provider-inventory.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function fixture(dependencies: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'foundation-providers-'));
  roots.push(root);
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'test-application', dependencies }),
  );
  return root;
}

async function install(
  root: string,
  name: string,
  extra: Record<string, unknown> = {},
): Promise<void> {
  const directory = path.join(root, 'node_modules', name);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, 'package.json'),
    JSON.stringify({ name, version: '1.2.3', ...extra }),
  );
}

describe('provider discovery', () => {
  it('reads non-hoisted registered Pro metadata without a conventional name or a direct dependency', async () => {
    const root = await fixture({});
    const runtimeRoot = path.join(root, 'runtime-extension');
    await mkdir(runtimeRoot);
    await writeFile(
      path.join(runtimeRoot, 'package.json'),
      JSON.stringify({
        name: '@licensed/approval',
        version: '2.1.0',
        displayName: 'Approval Pro',
        description: 'Approval processing',
      }),
    );
    const inventory = await collectProviderInventory(
      root,
      [
        {
          name: '@licensed/approval',
          version: '2.0.0',
          rootDir: runtimeRoot,
          evidence: 'serverRegistration',
        },
      ],
      true,
    );
    expect(inventory.serverRegistrationsComplete).toBe(true);
    expect(inventory.entries).toEqual([
      expect.objectContaining({
        name: '@licensed/approval',
        displayName: 'Approval Pro',
        description: 'Approval processing',
        version: '2.0.0',
        installed: true,
        registration: 'observed',
      }),
    ]);
    expect(JSON.stringify(inventory)).not.toContain(runtimeRoot);
  });
  it('discovers Pro-shaped and arbitrary-scope extensions without inventing their origin, category or usage', async () => {
    const root = await fixture({
      '@nocobase/app-plugin-pro-audit': '1.2.3',
      '@vendor/security': '1.2.3',
      'ordinary-library': '1.2.3',
    });
    await install(root, '@nocobase/app-plugin-pro-audit', {
      license: 'Proprietary',
    });
    await install(root, '@vendor/security', {
      exports: { './client/plugin': './plugin.js' },
    });
    await install(root, 'ordinary-library', {
      exports: { './server': './server.js' },
    });
    const inventory = await collectProviderInventory(root);
    expect(inventory.complete).toBe(true);
    expect(inventory.entries).toHaveLength(2);
    for (const entry of inventory.entries)
      expect(entry).toMatchObject({
        installed: true,
        version: '1.2.3',
        origin: 'unverified',
        categories: [],
        registration: 'unknown',
        evidence: ['manifest'],
      });
    expect(inventory.entries.some((entry) => 'status' in entry)).toBe(false);
  });

  it('includes injected runtime owners without a package manifest and does not treat history as registration', async () => {
    const root = await fixture({});
    const inventory = await collectProviderInventory(root, [
      { name: '@vendor/injected-extension', evidence: 'databaseContribution' },
      { name: '@vendor/injected-extension', evidence: 'apiContribution' },
    ]);
    expect(inventory.entries).toEqual([
      {
        name: '@vendor/injected-extension',
        version: null,
        installed: false,
        kind: 'plugin',
        origin: 'unverified',
        categories: [],
        registration: 'observed',
        evidence: ['databaseContribution', 'apiContribution'],
      },
    ]);
  });

  it('maps known providers to several categories and refreshes manifests without leaking dependency URLs', async () => {
    const root = await fixture({
      '@nocobase/app-plugin-database-explorer':
        'https://user:secret@example.invalid/package.tgz',
    });
    await install(root, '@nocobase/app-plugin-database-explorer');
    let inventory = await collectProviderInventory(root);
    expect(inventory.entries[0]).toMatchObject({
      categories: ['dataModeling', 'interface'],
      origin: 'nocobase',
      registration: 'unknown',
    });
    await install(root, '@nocobase/app-plugin-database-explorer', {
      version: '2.0.0',
    });
    inventory = await collectProviderInventory(root);
    expect(inventory.entries[0]?.version).toBe('2.0.0');
    expect(JSON.stringify(inventory)).not.toContain('secret');
    expect(JSON.stringify(inventory)).not.toContain(root);
  });

  it('reports an unreadable declared plugin without turning it into installed or unused, and rejects path-like names', async () => {
    const root = await fixture({
      '@vendor/app-plugin-missing': '1.0.0',
      '../private': '1.0.0',
    });
    const inventory = await collectProviderInventory(root);
    expect(inventory.complete).toBe(false);
    expect(inventory.unreadable).toEqual(['@vendor/app-plugin-missing']);
    expect(inventory.entries).toEqual([
      expect.objectContaining({
        name: '@vendor/app-plugin-missing',
        installed: false,
        registration: 'unknown',
      }),
    ]);
  });
});
