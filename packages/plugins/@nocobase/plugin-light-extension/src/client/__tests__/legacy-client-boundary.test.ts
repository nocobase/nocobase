/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import path from 'path';

import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  RunJSSourceResolverRegistry,
  registerBlockGridSelectSceneAddBlockProvider,
} from '@nocobase/client-v2';

import LightExtensionListPage from '../../client-v2/pages/LightExtensionListPage';
import PluginLightExtensionClient from '..';

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  return {
    ...actual,
    registerBlockGridSelectSceneAddBlockProvider: vi.fn(() => vi.fn()),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (text: string) => text,
  }),
}));

describe('plugin-light-extension legacy client boundary', () => {
  afterEach(() => {
    RunJSSourceResolverRegistry.clear();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('registers a thin settings bridge, runtime resolver, source editor, and add-block provider without importing the v1 client runtime', async () => {
    const add = vi.fn();
    const registerComponents = vi.fn();
    const apiClient = {
      request: vi.fn(),
    };
    const plugin = new PluginLightExtensionClient(
      { name: 'light-extension' },
      {
        apiClient,
        pluginSettingsManager: { add },
        flowEngine: {
          flowSettings: {
            registerComponents,
          },
        },
        i18n: {
          t: (text, options) => `${options?.ns}:${text}`,
        },
      },
    );

    expect(plugin.options.name).toBe('light-extension');

    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
    expect(add).toHaveBeenCalledWith(
      'light-extension',
      expect.objectContaining({
        icon: 'CodeOutlined',
        title: '@nocobase/plugin-light-extension:Light extensions',
        Component: expect.any(Function),
        aclSnippet: 'pm.light-extension',
      }),
    );
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(registerComponents).toHaveBeenCalledWith(
      expect.objectContaining({
        [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
        SettingsAutoForm: expect.any(Function),
      }),
    );
    expect(registerBlockGridSelectSceneAddBlockProvider).toHaveBeenCalledWith(
      'light-extension-js-blocks',
      expect.any(Function),
    );

    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeNull();
    expect(vi.mocked(registerBlockGridSelectSceneAddBlockProvider).mock.results[0].value).toHaveBeenCalledTimes(1);

    const source = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8');

    expect(source).not.toMatch(/from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/);
  });

  it('uses the v2 settings page for the legacy settings route', async () => {
    const add = vi.fn();
    const plugin = new PluginLightExtensionClient(
      { name: 'light-extension' },
      {
        pluginSettingsManager: { add },
        i18n: {
          t: (text, options) => `${options?.ns}:${text}`,
        },
      },
    );

    await plugin.load();

    const Component = add.mock.calls[0][1].Component;
    expect(Component).toBe(LightExtensionListPage);
  });
});
