/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient } from '@nocobase/client-v2';
import { defineSettings } from '@nocobase/light-extension-sdk/client';
import fs from 'fs';
import path from 'path';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
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
      showTabs: false,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.index`, false)).toMatchObject({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      pageKey: 'index',
      componentLoader: expect.any(Function),
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.source`, false)).toBeNull();
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.entries`, false)).toBeNull();
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.references`, false)).toBeNull();
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

    const sdkSource = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../core/light-extension-sdk/src/client/index.ts'),
      'utf8',
    );
    expect(sdkSource).not.toMatch(
      /defineClientExtension|defineServerExtension|registerBlock|registerAction|registerResource/,
    );
    expect(sdkSource).toMatch(/JSBlockContext|RunJSContext/);
    expect(sdkSource).not.toMatch(/getVar|getValue|setValue/);
  });

  it('uses the standalone SDK package instead of plugin-local SDK shims', () => {
    const pluginRoot = path.resolve(__dirname, '../../..');
    const sdkRoot = path.resolve(pluginRoot, '../../../core/light-extension-sdk');
    const rootSource = fs.readFileSync(path.resolve(__dirname, '../../index.ts'), 'utf8');
    const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, { import?: string; types?: string } | string>;
      dependencies: Record<string, string>;
    };
    const sdkPackageJson = JSON.parse(fs.readFileSync(path.join(sdkRoot, 'package.json'), 'utf8')) as {
      exports: Record<string, { import?: string; types?: string } | string>;
    };

    expect(rootSource).not.toContain('./sdk/client');
    expect(packageJson.exports['./client']).toMatchObject({
      types: './client.d.ts',
      import: './client.js',
    });
    expect(packageJson.exports['./client-v2']).toMatchObject({
      types: './client-v2.d.ts',
      import: './client-v2.js',
    });
    expect(packageJson.exports['./sdk/client']).toBeUndefined();
    expect(packageJson.exports['./sdk/shared']).toBeUndefined();
    expect(packageJson.dependencies['@nocobase/light-extension-sdk']).toBeDefined();
    expect(sdkPackageJson.exports['./client']).toBeDefined();
    expect(sdkPackageJson.exports['./shared']).toBeDefined();
    expect(sdkPackageJson.exports['./typegen']).toBeDefined();
    expect(collectSourceFiles(path.join(pluginRoot, 'src/sdk'))).toEqual([]);
    expect(fs.existsSync(path.join(pluginRoot, 'client.js'))).toBe(true);
    expect(fs.existsSync(path.join(pluginRoot, 'client-v2.js'))).toBe(true);
    expect(fs.existsSync(path.join(pluginRoot, 'server.js'))).toBe(true);
  });

  it('keeps authoring-only pages out of the legacy client while sharing runtime model-menu bridges', () => {
    const pluginSource = fs.readFileSync(path.resolve(__dirname, '../plugin.tsx'), 'utf8');

    expect(pluginSource).toContain('createLightExtensionRunJSResolver');
    expect(pluginSource).toContain('registerLightExtensionModelMenus');
    expect(pluginSource).not.toContain('EntryReferencesPanel');

    const legacySource = fs.readFileSync(path.resolve(__dirname, '../../client/index.ts'), 'utf8');
    expect(legacySource).toContain('createLightExtensionRunJSResolver');
    expect(legacySource).toContain('RunJSSourceResolverRegistry');
    expect(legacySource).toContain('registerLightExtensionModelMenus');
    expect(legacySource).toContain('JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD');
    expect(legacySource).not.toContain('EntryReferencesPanel');
  });
});

function collectSourceFilesFromDirectories(directories: string[]): string[] {
  return directories.flatMap((directory) => collectSourceFiles(directory));
}

function collectSourceFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : collectSourceFiles(entryPath);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  });
}
