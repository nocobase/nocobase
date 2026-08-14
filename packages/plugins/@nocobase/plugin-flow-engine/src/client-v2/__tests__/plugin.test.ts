/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  clearRunJSRegistryHosts,
  clearRunJSRuntimeHosts,
  getRunJSModelUse,
  getRunJSRegistryHost,
  getRunJSRuntimeHost,
  resolveRuntimeRunJS,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
} from '@nocobase/client-v2';

import PluginFlowEngineClientV2 from '../plugin';

describe('PluginFlowEngineClientV2', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    RunJSSourceResolverRegistry.clear();
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
  });

  it('installs one resident registry/runtime host and keeps repeated lifecycle calls idempotent', async () => {
    const plugin = createPlugin();

    await plugin.beforeLoad();
    const registryHost = getRunJSRegistryHost();
    const runtimeHost = getRunJSRuntimeHost();
    expectRuntimeOnly();

    await plugin.load();
    await plugin.load();
    expect(getRunJSRegistryHost()).toBe(registryHost);
    expect(getRunJSRuntimeHost()).toBe(runtimeHost);
    expectRuntimeOnly();

    await expect(resolveRuntimeRunJS({ runJs: { code: 'return 1;' } })).resolves.toMatchObject({
      code: 'return 1;',
      version: 'v1',
      sourceMode: 'inline',
      settings: {},
    });

    plugin.dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });

  it('hands hot-reloaded hosts to the newest instance and makes the old disposer identity-safe', async () => {
    const first = createPlugin();
    const second = createPlugin();

    await first.beforeLoad();
    const firstRegistryHost = getRunJSRegistryHost();
    const firstRuntimeHost = getRunJSRuntimeHost();

    await second.beforeLoad();
    const secondRegistryHost = getRunJSRegistryHost();
    const secondRuntimeHost = getRunJSRuntimeHost();
    expect(secondRegistryHost).not.toBe(firstRegistryHost);
    expect(secondRuntimeHost).not.toBe(firstRuntimeHost);

    first.dispose();
    expect(getRunJSRegistryHost()).toBe(secondRegistryHost);
    expect(getRunJSRuntimeHost()).toBe(secondRuntimeHost);

    second.dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });
});

function createPlugin(): PluginFlowEngineClientV2 {
  return new PluginFlowEngineClientV2({}, {} as never);
}

function expectRuntimeOnly(): void {
  expect(getRunJSRegistryHost()).toBeDefined();
  expect(() => getRunJSRuntimeHost()).not.toThrow();
  for (const modelUse of ['JSBlockModel', 'JSFieldModel', 'JSColumnModel', 'JSActionModel', 'JSItemModel']) {
    expect(getRunJSModelUse({ use: modelUse })).toBe(modelUse);
  }
  expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
  expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  expect(RunJSSourceResolverRegistry.getResolvers()).toHaveLength(0);
}
