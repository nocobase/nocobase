/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateSettingsPluginImports } from '../client-settings/generatePluginImports';

const temporaryDirectories: string[] = [];

function createTemporaryDirectory() {
  const directory = mkdtempSync(path.join(tmpdir(), 'nocobase-settings-plugin-imports-'));
  temporaryDirectories.push(directory);
  return directory;
}

function createV2Plugin(pluginRoot: string) {
  const pluginDirectory = path.join(pluginRoot, '@example', 'plugin-demo');
  mkdirSync(pluginDirectory, { recursive: true });
  writeFileSync(
    path.join(pluginDirectory, 'package.json'),
    JSON.stringify({ name: '@example/plugin-demo', version: '1.0.0' }),
  );
  writeFileSync(path.join(pluginDirectory, 'client-v2.js'), 'module.exports = {};');
  mkdirSync(path.join(pluginDirectory, 'src', 'client-v2'), { recursive: true });
  writeFileSync(path.join(pluginDirectory, 'src', 'client-v2', 'index.ts'), 'export default class DemoPlugin {}');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('Settings plugin imports', () => {
  it('generates the existing V2 plugin lane into a Settings-owned directory', () => {
    const root = createTemporaryDirectory();
    const pluginRoot = path.join(root, 'plugins');
    const settingsOutput = path.join(root, 'client-settings', 'src', '.plugins');
    const clientV2Output = path.join(root, 'client-v2', 'src', '.plugins');
    createV2Plugin(pluginRoot);
    mkdirSync(clientV2Output, { recursive: true });
    writeFileSync(path.join(clientV2Output, 'index.ts'), 'export const clientV2DevManifest = true;');

    const localPluginsOnly = process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY;
    process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY = 'true';
    try {
      generateSettingsPluginImports(settingsOutput, [pluginRoot]);
    } finally {
      if (localPluginsOnly === undefined) {
        delete process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY;
      } else {
        process.env.NOCOBASE_DEV_LOCAL_PLUGINS_ONLY = localPluginsOnly;
      }
    }

    expect(JSON.parse(readFileSync(path.join(settingsOutput, 'packageMap.json'), 'utf8'))).toEqual({
      '@example/plugin-demo': 'example_plugin_demo.ts',
    });
    expect(readFileSync(path.join(clientV2Output, 'index.ts'), 'utf8')).toBe(
      'export const clientV2DevManifest = true;',
    );
    expect(existsSync(path.join(settingsOutput, 'packages', 'example_plugin_demo.ts'))).toBe(true);
  });

  it('keeps a production Settings manifest isolated from the Client V2 development manifest', () => {
    const root = createTemporaryDirectory();
    const settingsOutput = path.join(root, 'client-settings', 'src', '.plugins');
    const clientV2Output = path.join(root, 'client-v2', 'src', '.plugins');
    mkdirSync(clientV2Output, { recursive: true });
    writeFileSync(path.join(clientV2Output, 'index.ts'), 'export const clientV2DevManifest = true;');

    const nodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      generateSettingsPluginImports(settingsOutput, []);
    } finally {
      if (nodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = nodeEnv;
      }
    }

    expect(readFileSync(path.join(settingsOutput, 'index.ts'), 'utf8')).toContain('return Promise.resolve(null)');
    expect(readFileSync(path.join(clientV2Output, 'index.ts'), 'utf8')).toBe(
      'export const clientV2DevManifest = true;',
    );
  });

  it('wires the Settings config and entry to the Settings-owned generated directory', () => {
    const configSource = readFileSync(path.resolve(__dirname, '../client-settings/rsbuild.config.ts'), 'utf8');
    const entrySource = readFileSync(path.resolve(__dirname, '../client-settings/src/main.tsx'), 'utf8');

    expect(configSource).not.toContain('generateV2Plugins');
    expect(configSource).toContain("generateSettingsPluginImports(path.resolve(__dirname, 'src/.plugins'))");
    expect(entrySource).toContain("from './.plugins'");
  });
});
