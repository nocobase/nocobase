/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  createMockClient,
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  PluginFlowEngine,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
} from '@nocobase/client-v2';
import {
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
} from '@nocobase/client-v2';
import { afterEach, vi } from 'vitest';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import {
  JSActionLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';
import PluginLightExtensionClientV2 from '../plugin';

describe('PluginLightExtensionClientV2', () => {
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

  it('registers light extension settings pages', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    expect(app.flowEngine.flowSettings.components).toMatchObject({
      [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_BLOCK_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
      [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
      [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
    });
    expect(app.flowEngine.flowSettings.components.SettingsAutoForm).toBeUndefined();
    expect(warn.mock.calls.flat().join('\n')).not.toContain('JSBlockLightExtensionSourceField');
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders().map((provider) => provider.key)).toContain(
      '@nocobase/plugin-light-extension/inline-settings-descriptor',
    );
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain('light-extension-runjs-value');
  });

  it('replaces core source-field fallbacks without duplicate-registration warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createMockClient({
      plugins: [
        [
          PluginFlowEngine,
          {
            name: 'flow-engine',
          },
        ],
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

    expect(app.flowEngine.flowSettings.components[JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSActionLightExtensionSourceField,
    );
    expect(app.flowEngine.flowSettings.components[JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSFieldLightExtensionSourceField,
    );
    expect(app.flowEngine.flowSettings.components[JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSItemLightExtensionSourceField,
    );
    expect(warn.mock.calls.flat().join('\n')).not.toContain('LightExtensionFullSourceField');
  });

  it('cleans previous global registrations before loading a new instance', async () => {
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
    const firstResolver = RunJSSourceResolverRegistry.getResolver('light-extension');

    const nextApp = createMockClient({
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

    await nextApp.load();

    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).not.toBe(firstResolver);
  });
});
