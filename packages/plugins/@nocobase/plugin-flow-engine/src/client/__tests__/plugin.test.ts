/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LegacyRunJSEditorRegistry } from '@nocobase/client';
import {
  clearRunJSRegistryHosts,
  clearRunJSRuntimeHosts,
  getRunJSModelUse,
  getRunJSRegistryHost,
  getRunJSRuntimeHost,
  RunJSEditorRegistry,
  RunJSSettingsDescriptorProviderRegistry,
} from '@nocobase/client-v2';

import PluginFlowEngineClient from '..';

describe('PluginFlowEngineClient', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
  });

  it('owns only the resident legacy RunJS runtime lifecycle', async () => {
    const plugin = new PluginFlowEngineClient({}, { apiClient: { request: vi.fn() } } as never);

    await plugin.beforeLoad();
    expectRuntimeOnly();
    const registryHost = getRunJSRegistryHost();
    const runtimeHost = getRunJSRuntimeHost();

    await plugin.load();
    expectRuntimeOnly();
    expect(getRunJSRegistryHost()).toBe(registryHost);
    expect(getRunJSRuntimeHost()).toBe(runtimeHost);

    await plugin.load();
    expectRuntimeOnly();
    expect(getRunJSRegistryHost()).toBe(registryHost);
    expect(getRunJSRuntimeHost()).toBe(runtimeHost);
    plugin.dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });

  it('hands the legacy runtime to the newest plugin instance without allowing an old disposer to remove it', async () => {
    const first = new PluginFlowEngineClient({}, { apiClient: { request: vi.fn() } } as never);
    const second = new PluginFlowEngineClient({}, { apiClient: { request: vi.fn() } } as never);

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

function expectRuntimeOnly(): void {
  expect(getRunJSRegistryHost()).toBeDefined();
  expect(() => getRunJSRuntimeHost()).not.toThrow();
  for (const modelUse of ['JSBlockModel', 'JSFieldModel', 'JSColumnModel', 'JSActionModel', 'JSItemModel']) {
    expect(getRunJSModelUse({ use: modelUse })).toBe(modelUse);
  }
  expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
  expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
  expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
}
