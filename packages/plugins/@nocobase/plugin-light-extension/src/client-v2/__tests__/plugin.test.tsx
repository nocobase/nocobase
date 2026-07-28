/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import enUS from '../../locale/en-US.json';
import zhCN from '../../locale/zh-CN.json';
import {
  JSActionLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../components/JSBlockLightExtensionSourceField';
import PluginLightExtensionClientV2 from '../plugin';
import { type RunJSStudioToolbarContext, runJSStudioToolbarRegistry } from '../vsc-file/public-api';
import {
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
  createMockClient,
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
  JSPageSourceModeField,
  PluginFlowEngine,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
} from '@nocobase/client-v2';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Consolidated from locale.test.ts.
const REQUIRED_VSC_LOCALE_KEYS = [
  'Sync code',
  'GitHub source',
  'GitHub credential',
  'Select a Secret variable',
  'Test connection',
  'Pull from Git',
  'Push to Git',
  'Disconnect',
  'In sync',
  'Local changes',
  'Remote changes',
  'Diverged',
  'Initial sync needs a clear source',
  'The configured credential is unavailable',
  'GitHub authentication failed',
  'The sync provider is unavailable',
  'You do not have permission to perform this sync operation',
  'Actions',
  'Cancel',
  'Copy code',
  'Create',
  'Failed to load history',
  'Failed to restore version',
  'File already exists',
  'Folder already exists',
  'Folder is not empty',
  'Import',
  'Import workspace',
  'Invalid file path',
  'Retry',
  'Save',
  'Restored from',
] as const;

describe('plugin-light-extension client-v2 locale entries', () => {
  it('keeps English and Chinese keys aligned and retains required VSC entries', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(zhCN).sort());
    expect(Object.keys(enUS)).toEqual(expect.arrayContaining([...REQUIRED_VSC_LOCALE_KEYS]));
    expect(Object.keys(zhCN)).toEqual(expect.arrayContaining([...REQUIRED_VSC_LOCALE_KEYS]));
  });

  it('keeps the Light Extension wording for conflicting VSC locale entries', () => {
    expect(zhCN['Folder is not empty']).toBe('文件夹不为空');
    expect(zhCN['Invalid file path']).toBe('无效文件路径');
    expect(zhCN['Restored from']).toBe('已从版本恢复');
  });
});

// Consolidated from plugin.test.tsx.
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
      [JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]: expect.any(Function),
    });
    expect(app.flowEngine.flowSettings.components.SettingsAutoForm).toBeUndefined();
    expect(app.flowEngine.flowSettings.components.RunJSLightExtensionSourceField).toBeUndefined();
    expect(warn.mock.calls.flat().join('\n')).not.toContain('JSBlockLightExtensionSourceField');
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders().map((provider) => provider.key)).toContain(
      '@nocobase/plugin-light-extension/inline-settings-descriptor',
    );
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain('light-extension-runjs-value');
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain(
      '@nocobase/plugin-vsc-file/runjs-studio',
    );
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
    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSPageLightExtensionSourceField,
    );
    expect(warn.mock.calls.flat().join('\n')).not.toContain('LightExtensionFullSourceField');
  });

  it('restores core JS Page components and global registries on dispose', async () => {
    const app = createMockClient({
      plugins: [
        [PluginFlowEngine, { name: 'flow-engine' }],
        [PluginLightExtensionClientV2, { name: 'light-extension', packageName: NAMESPACE }],
      ],
    });

    await app.load();
    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSPageLightExtensionSourceField,
    );
    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]).toBeTypeOf('function');

    (app.pm.get(PluginLightExtensionClientV2) as PluginLightExtensionClientV2).dispose();

    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSPageSourceModeField,
    );
    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]).toBeUndefined();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeNull();
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(getToolbarContributionKeys()).not.toContain('@nocobase/plugin-light-extension/move-source');
  });

  it('registers once after enable, cleans up on disable, and registers once again after re-enable', async () => {
    const app = createMockClient({
      plugins: [
        [PluginFlowEngine, { name: 'flow-engine' }],
        [PluginLightExtensionClientV2, { name: 'light-extension', packageName: NAMESPACE }],
      ],
    });
    await app.load();
    const plugin = app.pm.get(PluginLightExtensionClientV2) as PluginLightExtensionClientV2;
    expectLightExtensionRegistrations(1);

    plugin.dispose();
    expectLightExtensionRegistrations(0);

    await plugin.load();
    expectLightExtensionRegistrations(1);

    plugin.dispose();
    expectLightExtensionRegistrations(0);

    await plugin.load();
    expectLightExtensionRegistrations(1);

    plugin.dispose();
    expectLightExtensionRegistrations(0);
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
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(2);
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeTruthy();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).not.toBe(firstResolver);
    expect(
      RunJSEditorRegistry.getProviders().filter(
        (provider) => provider.key === '@nocobase/plugin-vsc-file/runjs-studio',
      ),
    ).toHaveLength(1);
  });
});

function expectLightExtensionRegistrations(count: number) {
  expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(count);
  expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(count);
  expect(
    RunJSEditorRegistry.getProviders().filter((provider) => provider.key === 'light-extension-runjs-value'),
  ).toHaveLength(count);
  expect(
    RunJSEditorRegistry.getProviders().filter((provider) => provider.key === '@nocobase/plugin-vsc-file/runjs-studio'),
  ).toHaveLength(count);
  expect(
    getToolbarContributionKeys().filter((key) => key === '@nocobase/plugin-light-extension/move-source'),
  ).toHaveLength(count);
}

function getToolbarContributionKeys(): string[] {
  return runJSStudioToolbarRegistry
    .list({
      locator: { kind: 'flowModel.step' },
      workspace: {
        permissions: { canWrite: true },
        source: { metadata: { modelUse: 'JSBlockModel' } },
      },
      readOnly: false,
    } as unknown as RunJSStudioToolbarContext)
    .map((contribution) => contribution.key);
}
