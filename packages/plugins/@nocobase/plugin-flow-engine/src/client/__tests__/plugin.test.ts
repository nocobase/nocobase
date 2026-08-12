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

    await plugin.load();
    expectRuntimeOnly();

    await plugin.beforeLoad();
    expectRuntimeOnly();

    await plugin.load();
    expectRuntimeOnly();
    plugin.dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });
});

function expectRuntimeOnly(): void {
  expect(getRunJSRegistryHost()).toBeDefined();
  expect(() => getRunJSRuntimeHost()).not.toThrow();
  expect(getRunJSModelUse({ use: 'JSBlockModel' })).toBe('JSBlockModel');
  expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
  expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
  expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
}
