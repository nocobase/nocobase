/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
  createMockClient,
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
  JSPageSourceModeField,
  PluginFlowEngine,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
} from '@nocobase/client-v2';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

describe('plugin-light-extension client-v2 locale entries', () => {
  it('keeps English and Chinese keys aligned', () => {
    expect(Object.keys(enUS).sort()).toEqual(Object.keys(zhCN).sort());
  });
});

describe('PluginLightExtensionClientV2', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    RunJSSourceResolverRegistry.clear();
    clearBlockGridSelectSceneAddBlockProviders();
    clearActionGroupMenuItemProviders();
    clearFieldMenuItemProviders();
    vi.restoreAllMocks();
  });

  it('registers, disposes, and re-enables without duplicate global contributions', async () => {
    const app = createMockClient({
      plugins: [
        [PluginFlowEngine, { name: 'flow-engine' }],
        [PluginLightExtensionClientV2, { name: 'light-extension', packageName: NAMESPACE }],
      ],
    });

    await app.load();
    const plugin = app.pm.get(PluginLightExtensionClientV2) as PluginLightExtensionClientV2;

    expect(app.pluginSettingsManager.get(LIGHT_EXTENSION_SETTINGS_KEY, false)).toMatchObject({
      key: LIGHT_EXTENSION_SETTINGS_KEY,
      title: 'Light extensions',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(app.pluginSettingsManager.get(`${LIGHT_EXTENSION_SETTINGS_KEY}.index`, false)).toMatchObject({
      menuKey: LIGHT_EXTENSION_SETTINGS_KEY,
      pageKey: 'index',
      componentLoader: expect.any(Function),
    });
    expect(app.flowEngine.flowSettings.components).toMatchObject({
      [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSActionLightExtensionSourceField,
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: expect.any(Function),
      [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSFieldLightExtensionSourceField,
      [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSItemLightExtensionSourceField,
      [JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSPageLightExtensionSourceField,
    });
    expectLightExtensionRegistrations(1);

    plugin.dispose();

    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSPageSourceModeField,
    );
    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_SETTINGS_STEP_FIELD]).toBeUndefined();
    expectLightExtensionRegistrations(0);

    await plugin.load();
    expectLightExtensionRegistrations(1);
    expect(app.flowEngine.flowSettings.components[JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]).toBe(
      JSPageLightExtensionSourceField,
    );

    await plugin.load();
    expectLightExtensionRegistrations(1);

    plugin.dispose();
    expectLightExtensionRegistrations(0);
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
    runJSStudioToolbarRegistry
      .list({
        locator: { kind: 'flowModel.step' },
        workspace: {
          permissions: { canWrite: true },
          source: { metadata: { modelUse: 'JSBlockModel' } },
        },
        readOnly: false,
      } as unknown as RunJSStudioToolbarContext)
      .filter((contribution) => contribution.key === '@nocobase/plugin-light-extension/move-source'),
  ).toHaveLength(count);
}
