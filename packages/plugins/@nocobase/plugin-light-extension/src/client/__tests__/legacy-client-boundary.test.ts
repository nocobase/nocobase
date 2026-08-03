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
import type React from 'react';
import { runJSStudioToolbarRegistry } from '@nocobase/runjs-workspace/client-v2';

import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
} from '@nocobase/client-v2';

import { JSPageLightExtensionSourceField } from '../../client-v2/components/JSBlockLightExtensionSourceField';
import { SettingsSingleField } from '../../client-v2/components/SettingsAutoForm';
import pluginEnUS from '../../locale/en-US.json';
import pluginZhCN from '../../locale/zh-CN.json';
import PluginJsTemplateClient, {
  JS_TEMPLATE_LEGACY_SETTINGS_KEY,
  JS_TEMPLATE_SETTINGS_KEY,
  JS_TEMPLATE_V2_UI_CONTRACT,
  JsTemplateListPage,
  LightExtensionListPage,
  PluginJsTemplateClient as NamedPluginJsTemplateClient,
  PluginLightExtensionClient,
} from '..';

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (text: string) => text,
  }),
}));

describe('plugin-light-extension legacy client boundary', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    RunJSSourceResolverRegistry.clear();
    clearBlockGridSelectSceneAddBlockProviders();
    clearActionGroupMenuItemProviders();
    clearFieldMenuItemProviders();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('registers a thin settings bridge, runtime resolver, and source editor without a direct v1 import', async () => {
    const add = vi.fn();
    const PreviousJSPageSourceField = () => null;
    const components: Record<string, React.ElementType> = {
      [JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: PreviousJSPageSourceField,
    };
    const registerComponents = vi.fn((nextComponents: Record<string, React.ElementType>) => {
      Object.assign(components, nextComponents);
    });
    const unregisterToolbar = vi.fn();
    const registerToolbar = vi.spyOn(runJSStudioToolbarRegistry, 'register').mockReturnValue(unregisterToolbar);
    const apiClient = {
      request: vi.fn(),
    };
    const plugin = new PluginJsTemplateClient(
      { name: 'light-extension' },
      {
        apiClient,
        pluginSettingsManager: { add },
        flowEngine: {
          flowSettings: {
            components,
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
    expect(add).toHaveBeenNthCalledWith(
      1,
      JS_TEMPLATE_SETTINGS_KEY,
      expect.objectContaining({
        icon: 'CodeOutlined',
        title: '@nocobase/plugin-light-extension:JS Templates',
        Component: expect.any(Function),
        aclSnippet: 'pm.light-extension',
      }),
    );
    expect(add).toHaveBeenNthCalledWith(
      2,
      JS_TEMPLATE_LEGACY_SETTINGS_KEY,
      expect.objectContaining({
        icon: 'CodeOutlined',
        title: '@nocobase/plugin-light-extension:JS Templates',
        Component: expect.any(Function),
        aclSnippet: 'pm.light-extension',
        hidden: true,
      }),
    );
    expect(add.mock.calls[0][1].Component).toBe(add.mock.calls[1][1].Component);
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain('light-extension-runjs-value');
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(registerToolbar).toHaveBeenCalledWith(
      expect.objectContaining({ key: '@nocobase/plugin-light-extension/move-source' }),
    );
    expect(registerComponents).toHaveBeenCalledWith(
      expect.objectContaining({
        [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
      }),
      { warnOnOverwrite: false },
    );
    const registeredComponents = registerComponents.mock.calls[0][0];
    expect(registeredComponents.RunJSLightExtensionSourceField).toBeUndefined();
    expect(registeredComponents[JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(JSPageLightExtensionSourceField);
    expect(registeredComponents[JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]).toBe(SettingsSingleField);
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeNull();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(unregisterToolbar).toHaveBeenCalledTimes(1);
    expect(components[JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(PreviousJSPageSourceField);
    expect(components[JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]).toBeUndefined();

    const source = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8');

    expect(source).not.toMatch(/from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/);
    expect(source).not.toMatch(/sourceMode\s*[:=]\s*['"]js-template['"]|type\s*:\s*['"]js-template-entry['"]/u);
  });

  it('exposes canonical aliases and uses one v2 page for canonical and legacy settings routes', async () => {
    const add = vi.fn();
    const plugin = new PluginJsTemplateClient(
      { name: 'light-extension' },
      {
        pluginSettingsManager: { add },
        i18n: {
          t: (text, options) => `${options?.ns}:${text}`,
        },
      },
    );

    await plugin.load();

    expect(PluginJsTemplateClient).toBe(NamedPluginJsTemplateClient);
    expect(PluginLightExtensionClient).toBe(PluginJsTemplateClient);
    expect(JsTemplateListPage).toBe(LightExtensionListPage);
    expect(add.mock.calls.map(([key]) => key)).toEqual([JS_TEMPLATE_SETTINGS_KEY, JS_TEMPLATE_LEGACY_SETTINGS_KEY]);
    expect(add.mock.calls[0][1].Component).toBe(JsTemplateListPage);
    expect(add.mock.calls[1][1].Component).toBe(JsTemplateListPage);
    expect(add.mock.calls[1][1].hidden).toBe(true);
    expect(pluginEnUS[JS_TEMPLATE_V2_UI_CONTRACT.productNameKey]).toBe('JS Templates');
    expect(pluginZhCN[JS_TEMPLATE_V2_UI_CONTRACT.productNameKey]).toBe(JS_TEMPLATE_V2_UI_CONTRACT.productNameZhCN);
  });
});
