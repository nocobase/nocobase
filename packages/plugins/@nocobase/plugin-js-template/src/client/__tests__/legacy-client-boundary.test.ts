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
  JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_BLOCK_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_FIELD_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ITEM_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_PAGE_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
} from '@nocobase/client-v2';

import { JSPageJsTemplateSourceField } from '../../client-v2/components/JSBlockJsTemplateSourceField';
import { SettingsSingleField } from '../../client-v2/components/SettingsAutoForm';
import pluginEnUS from '../../locale/en-US.json';
import pluginZhCN from '../../locale/zh-CN.json';
import PluginJsTemplateClient, {
  JS_TEMPLATE_SETTINGS_KEY,
  JS_TEMPLATE_V2_UI_CONTRACT,
  JsTemplateCatalogPage,
  JsTemplateProjectsPage,
  PluginJsTemplateClient as NamedPluginJsTemplateClient,
} from '..';

vi.mock('react-i18next', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-i18next')>()),
  useTranslation: () => ({
    t: (text: string) => text,
  }),
}));

describe('plugin-js-template legacy client boundary', () => {
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
      [JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]: PreviousJSPageSourceField,
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
      { name: 'js-template' },
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

    expect(plugin.options.name).toBe('js-template');

    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
    expect(add).toHaveBeenNthCalledWith(
      1,
      JS_TEMPLATE_SETTINGS_KEY,
      expect.objectContaining({
        icon: 'CodeOutlined',
        title: '@nocobase/plugin-js-template:JS Templates',
        aclSnippet: 'pm.js-template',
      }),
    );
    expect(add).toHaveBeenNthCalledWith(
      2,
      `${JS_TEMPLATE_SETTINGS_KEY}.templates`,
      expect.objectContaining({
        title: '@nocobase/plugin-js-template:Templates',
        Component: JsTemplateCatalogPage,
        aclSnippet: 'pm.js-template',
        sort: 1,
      }),
    );
    expect(add).toHaveBeenNthCalledWith(
      3,
      `${JS_TEMPLATE_SETTINGS_KEY}.source-projects`,
      expect.objectContaining({
        title: '@nocobase/plugin-js-template:Source Projects',
        Component: JsTemplateProjectsPage,
        aclSnippet: 'pm.js-template',
        sort: 2,
      }),
    );
    expect(add).toHaveBeenCalledTimes(3);
    expect(RunJSSourceResolverRegistry.getResolver('js-template')).toBeTruthy();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain('js-template-runjs-value');
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(registerToolbar).toHaveBeenCalledWith(
      expect.objectContaining({ key: '@nocobase/plugin-js-template/save-as-js-template' }),
    );
    expect(registerComponents).toHaveBeenCalledWith(
      expect.objectContaining({
        [JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_BLOCK_JS_TEMPLATE_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_FIELD_JS_TEMPLATE_SETTINGS_STEP_FIELD]: expect.any(Function),
        [JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD]: expect.any(Function),
        [JS_ITEM_JS_TEMPLATE_SETTINGS_STEP_FIELD]: expect.any(Function),
      }),
      { warnOnOverwrite: false },
    );
    const registeredComponents = registerComponents.mock.calls[0][0];
    expect(registeredComponents.RunJSJsTemplateSourceField).toBeUndefined();
    expect(registeredComponents[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(JSPageJsTemplateSourceField);
    expect(registeredComponents[JS_PAGE_JS_TEMPLATE_SETTINGS_STEP_FIELD]).toBe(SettingsSingleField);
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    expect(RunJSSourceResolverRegistry.getResolver('js-template')).toBeNull();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(unregisterToolbar).toHaveBeenCalledTimes(1);
    expect(components[JS_PAGE_JS_TEMPLATE_FULL_SOURCE_FIELD]).toBe(PreviousJSPageSourceField);
    expect(components[JS_PAGE_JS_TEMPLATE_SETTINGS_STEP_FIELD]).toBeUndefined();

    const source = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8');

    expect(source).not.toMatch(/from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/);
  });

  it('exposes the canonical client entrypoint with entry and Source Project settings routes', async () => {
    const add = vi.fn();
    const plugin = new PluginJsTemplateClient(
      { name: 'js-template' },
      {
        pluginSettingsManager: { add },
        i18n: {
          t: (text, options) => `${options?.ns}:${text}`,
        },
      },
    );

    await plugin.load();

    expect(PluginJsTemplateClient).toBe(NamedPluginJsTemplateClient);
    expect(add.mock.calls.map(([key]) => key)).toEqual([
      JS_TEMPLATE_SETTINGS_KEY,
      `${JS_TEMPLATE_SETTINGS_KEY}.templates`,
      `${JS_TEMPLATE_SETTINGS_KEY}.source-projects`,
    ]);
    expect(add.mock.calls[0][1].Component).toBeUndefined();
    expect(add.mock.calls[1][1].Component).toBe(JsTemplateCatalogPage);
    expect(add.mock.calls[2][1].Component).toBe(JsTemplateProjectsPage);
    expect(
      add.mock.calls
        .slice(1)
        .sort((left, right) => left[1].sort - right[1].sort)
        .map(([key]) => key),
    ).toEqual([`${JS_TEMPLATE_SETTINGS_KEY}.templates`, `${JS_TEMPLATE_SETTINGS_KEY}.source-projects`]);
    expect(pluginEnUS[JS_TEMPLATE_V2_UI_CONTRACT.productNameKey]).toBe('JS Templates');
    expect(pluginZhCN[JS_TEMPLATE_V2_UI_CONTRACT.productNameKey]).toBe(JS_TEMPLATE_V2_UI_CONTRACT.productNameZhCN);
  });
});
