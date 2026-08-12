/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LegacyRunJSEditorRegistry } from '@nocobase/client';
import { clearRunJSRegistryHosts, clearRunJSRuntimeHosts } from '@nocobase/client-v2';
import { RunJSEditorRegistry, RunJSSettingsDescriptorProviderRegistry } from '../../client-v2';

import { installRunJSWorkspaceLegacyClient } from '../plugin';

describe('RunJS workspace legacy client boundary', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
  });

  it('keeps the compatibility installer identity-safe across overlapping lifecycles', () => {
    const app = { apiClient: { request: vi.fn() } };
    const disposeFirst = installRunJSWorkspaceLegacyClient(app);
    const disposeSecond = installRunJSWorkspaceLegacyClient(app);

    disposeFirst();
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    disposeSecond();
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });
});
