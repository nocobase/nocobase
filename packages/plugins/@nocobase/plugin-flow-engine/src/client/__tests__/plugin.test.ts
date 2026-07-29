/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LegacyRunJSEditorRegistry } from '@nocobase/client';
import { RunJSEditorRegistry, RunJSSettingsDescriptorProviderRegistry } from '@nocobase/client-v2';

import PluginFlowEngineClient from '..';

describe('PluginFlowEngineClient', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
  });

  it('owns the legacy and client-v2 RunJS workspace integration lifecycle', async () => {
    const plugin = new PluginFlowEngineClient({}, { apiClient: { request: vi.fn() } } as never);

    await plugin.load();
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    await plugin.beforeLoad();
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);

    await plugin.load();
    plugin.dispose();
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });
});
