/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, LegacyRunJSEditorRegistry } from '@nocobase/client';
import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  PluginFlowEngine,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  clearActionGroupMenuItemProviders,
  clearBlockGridSelectSceneAddBlockProviders,
  clearFieldMenuItemProviders,
} from '@nocobase/client-v2';
import PluginVscFileClient from '../vsc-file/plugin';
import { runJSStudioProvider } from '../../client-v2/vsc-file/public-api';

import { LIGHT_EXTENSION_ACL_SNIPPET, LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import {
  JSActionLightExtensionSourceField,
  JSBlockLightExtensionSourceField,
  JSFieldLightExtensionSourceField,
  JSItemLightExtensionSourceField,
  JSPageLightExtensionSourceField,
} from '../../client-v2/components/JSBlockLightExtensionSourceField';
import PluginLightExtensionClient from '..';

function createLegacyApplication() {
  return new Application({
    plugins: [[PluginFlowEngine, { name: 'flow-engine' }]],
    router: { type: 'memory', initialEntries: ['/admin'] },
  });
}

async function loadLegacyPlugins(app: Application) {
  const vscFile = new PluginVscFileClient({ name: 'vsc-file', packageName: '@nocobase/plugin-vsc-file' }, app);
  const lightExtension = new PluginLightExtensionClient({ name: 'light-extension', packageName: NAMESPACE }, app);

  await vscFile.afterAdd();
  await lightExtension.afterAdd();
  await vscFile.beforeLoad();
  await lightExtension.beforeLoad();
  await vscFile.load();
  await lightExtension.load();

  return lightExtension;
}

describe('legacy Light Extension runtime integration', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    RunJSSourceResolverRegistry.clear();
    clearBlockGridSelectSceneAddBlockProviders();
    clearActionGroupMenuItemProviders();
    clearFieldMenuItemProviders();
    vi.restoreAllMocks();
  });

  it('loads both legacy plugins into the v1 Application and replaces stale global registrations on reload', async () => {
    const firstApp = createLegacyApplication();
    await firstApp.load();
    await loadLegacyPlugins(firstApp);

    expect(firstApp.pluginSettingsManager.get(LIGHT_EXTENSION_SETTINGS_KEY, false)).toMatchObject({
      title: 'Light extensions',
      aclSnippet: LIGHT_EXTENSION_ACL_SNIPPET,
    });
    expect(firstApp.flowEngine.flowSettings.components).toMatchObject({
      [JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSActionLightExtensionSourceField,
      [JS_BLOCK_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSBlockLightExtensionSourceField,
      [JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSFieldLightExtensionSourceField,
      [JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSItemLightExtensionSourceField,
      [JS_PAGE_LIGHT_EXTENSION_FULL_SOURCE_FIELD]: JSPageLightExtensionSourceField,
    });
    expect(RunJSEditorRegistry.getProviders()).toContain(runJSStudioProvider);
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toContain('light-extension-runjs-value');
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/plugin-vsc-file/legacy-runjs-studio',
    ]);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    const firstResolver = RunJSSourceResolverRegistry.getResolver('light-extension');
    const secondApp = createLegacyApplication();
    await secondApp.load();
    const secondLightExtension = new PluginLightExtensionClient(
      { name: 'light-extension', packageName: NAMESPACE },
      secondApp,
    );

    await secondLightExtension.beforeLoad();
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).toBeNull();

    await loadLegacyPlugins(secondApp);
    expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(1);
    expect(RunJSSourceResolverRegistry.getResolver('light-extension')).not.toBe(firstResolver);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
    expect(
      RunJSEditorRegistry.getProviders().filter((provider) => provider.key === 'light-extension-runjs-value'),
    ).toHaveLength(1);
    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/plugin-vsc-file/legacy-runjs-studio',
    ]);
  });
});
