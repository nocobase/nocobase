/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import fs from 'fs';
import path from 'path';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import { defineSettings } from '../../sdk/client';
import PluginLightExtensionClientV2 from '../plugin';

describe('plugin-light-extension client-v2 boundary', () => {
  it('registers a v2 settings entry for light extensions', async () => {
    const app = createMockClient({
      plugins: [
        [
          PluginLightExtensionClientV2,
          {
            name: 'light-extension',
            packageName: NAMESPACE,
          },
        ],
      ],
    });

    await app.load();

    expect(app.pluginSettingsManager.get(LIGHT_EXTENSION_SETTINGS_KEY, false)).toMatchObject({
      key: LIGHT_EXTENSION_SETTINGS_KEY,
      title: 'Light extensions',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.index`, false)).toMatchObject({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      pageKey: 'index',
      componentLoader: expect.any(Function),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.source`, false)).toMatchObject({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      pageKey: 'source',
      componentLoader: expect.any(Function),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.entries`, false)).toMatchObject({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      pageKey: 'entries',
      componentLoader: expect.any(Function),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
  });

  it('keeps client-v2 code out of the legacy client runtime', () => {
    const files = collectSourceFilesFromDirectories([
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '../../client-shared'),
    ]);
    const violations = files.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const importsLegacyClient = /from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/.test(source);
      return importsLegacyClient ? [path.relative(process.cwd(), file)] : [];
    });

    expect(violations).toEqual([]);
  });

  it('exposes only the minimal SDK helper at runtime', () => {
    const settings = { title: 'Sales KPI' };

    expect(defineSettings(settings)).toBe(settings);

    const sdkSource = fs.readFileSync(path.resolve(__dirname, '../../sdk/client.ts'), 'utf8');
    expect(sdkSource).not.toMatch(
      /defineClientExtension|defineServerExtension|registerBlock|registerAction|registerResource/,
    );
    expect(sdkSource).not.toMatch(/JSBlockContext|RunJSContext|getVar|getValue|setValue/);
  });

  it('keeps the package root separate from local SDK shims', () => {
    const rootSource = fs.readFileSync(path.resolve(__dirname, '../../index.ts'), 'utf8');

    expect(rootSource).not.toContain('./sdk/client');
  });

  it('keeps the Phase 1 pages scoped out of publication/runtime features', () => {
    const pageSource = [
      path.resolve(__dirname, '../pages/LightExtensionHomePage.tsx'),
      path.resolve(__dirname, '../pages/LightExtensionListPage.tsx'),
      path.resolve(__dirname, '../pages/LightExtensionWorkspacePage.tsx'),
      path.resolve(__dirname, '../pages/LightExtensionEntriesPage.tsx'),
      path.resolve(__dirname, '../../client-shared/LightExtensionHomePage.tsx'),
    ]
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    expect(pageSource).not.toMatch(
      /\bpublication\b|runtime code|versionPolicy|follow-active|\bCLI(?:\s*\/\s*Sync)?\b|\bSync API\b/i,
    );
  });
});

function collectSourceFilesFromDirectories(directories: string[]): string[] {
  return directories.flatMap((directory) => collectSourceFiles(directory));
}

function collectSourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectSourceFiles(entryPath);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}
