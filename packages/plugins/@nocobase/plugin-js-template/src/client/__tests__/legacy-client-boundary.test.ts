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
import { LegacyRunJSEditorRegistry } from '@nocobase/client';
import {
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  runJSStudioToolbarRegistry,
} from '@nocobase/runjs/workspace/client-v2';

import {
  JS_ACTION_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ACTION_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JS_BLOCK_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_BLOCK_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JS_FIELD_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_FIELD_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  JS_ITEM_JS_TEMPLATE_FULL_SOURCE_FIELD,
  JS_ITEM_JS_TEMPLATE_SETTINGS_STEP_FIELD,
  clearRunJSRegistryHosts,
  clearRunJSRuntimeHosts,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
} from '@nocobase/client-v2';
import { installRunJSWorkspaceRuntimeLegacyClient } from '@nocobase/runjs/workspace/client';

import {
  JS_TEMPLATE_EDITOR_PROVIDER_KEY,
  JS_TEMPLATE_TOOLBAR_CONTRIBUTION_KEY,
} from '../../client-v2/jsTemplateRunJSIntegrationContract';
import { JS_TEMPLATE_SETTINGS_KEY } from '../../constants';
import PluginJsTemplateClient from '..';
import JsTemplateSourceProjectsPage from '../../client-v2/pages/JsTemplateSourceProjectsPage';

interface LegacySettingsRouteOptions {
  icon?: string;
  title?: string;
  aclSnippet?: string;
  Component?: React.ElementType;
  sort?: number;
}

type AddLegacySettingsRoute = (key: string, options: LegacySettingsRouteOptions) => void;

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
    LegacyRunJSEditorRegistry.clear();
    clearBlockGridSelectSceneAddBlockProviders();
    clearActionGroupMenuItemProviders();
    clearFieldMenuItemProviders();
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('registers a thin settings bridge, runtime resolver, and source editor without a direct v1 import', async () => {
    const add = vi.fn<AddLegacySettingsRoute>();
    const remove = vi.fn<(name: string) => void>();
    const components: Record<string, React.ElementType> = {};
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
        pluginSettingsManager: { add, remove },
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

    const disposeRuntime = installRunJSWorkspaceRuntimeLegacyClient();
    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
    const settingsByKey = new Map(add.mock.calls);
    expect(settingsByKey.get(JS_TEMPLATE_SETTINGS_KEY)).toEqual(
      expect.objectContaining({
        icon: 'CodeOutlined',
        title: '@nocobase/plugin-js-template:JS Templates',
        Component: JsTemplateSourceProjectsPage,
        aclSnippet: 'pm.js-template',
      }),
    );
    expect(add).toHaveBeenCalledTimes(1);
    expect(RunJSSourceResolverRegistry.getResolver('js-template')).toBeTruthy();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain(
      JS_TEMPLATE_EDITOR_PROVIDER_KEY,
    );
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(2);
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(registerToolbar).toHaveBeenCalledWith(
      expect.objectContaining({ key: JS_TEMPLATE_TOOLBAR_CONTRIBUTION_KEY }),
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
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith(JS_TEMPLATE_SETTINGS_KEY);
    expect(RunJSSourceResolverRegistry.getResolver('js-template')).toBeNull();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(unregisterToolbar).toHaveBeenCalledTimes(1);

    const source = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8');

    expect(source).not.toMatch(/from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/);
    disposeRuntime();
  });
});
