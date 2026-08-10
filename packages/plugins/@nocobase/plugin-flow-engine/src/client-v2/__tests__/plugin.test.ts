/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RunJSEditorRegistry, RunJSSettingsDescriptorProviderRegistry } from '@nocobase/runjs/workspace/client-v2';

import PluginFlowEngineClientV2 from '..';

describe('PluginFlowEngineClientV2', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
  });

  it('owns the modern RunJS workspace integration lifecycle', async () => {
    const plugin = createPlugin();

    await plugin.load();
    expectRegistrationKeys();

    await plugin.beforeLoad();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);

    await plugin.load();
    plugin.dispose();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });
});

function createPlugin(): PluginFlowEngineClientV2 {
  return new PluginFlowEngineClientV2({}, { apiClient: { request: vi.fn() } } as never);
}

function expectRegistrationKeys(): void {
  expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
    '@nocobase/runjs/workspace/runjs-studio',
  ]);
  expect(RunJSSettingsDescriptorProviderRegistry.getProviders().map((provider) => provider.key)).toEqual([
    '@nocobase/runjs/workspace/inline-settings-descriptor',
  ]);
}
