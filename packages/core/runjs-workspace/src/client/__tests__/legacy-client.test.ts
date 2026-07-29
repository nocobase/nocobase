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

import { installRunJSWorkspaceLegacyClient } from '../plugin';

describe('RunJS workspace legacy client', () => {
  afterEach(() => {
    LegacyRunJSEditorRegistry.clear();
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
  });

  it('installs both admin-shell providers and keeps non-step editors untouched', () => {
    const dispose = installRunJSWorkspaceLegacyClient({ request: vi.fn() });

    expect(LegacyRunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/legacy-runjs-studio',
    ]);
    expect(
      LegacyRunJSEditorRegistry.getProvider({
        locator: { kind: 'workflow.javascript', nodeId: 'node-1' },
        value: { code: 'return 1;', version: 'v1' },
      }),
    ).toBeNull();
    expect(
      LegacyRunJSEditorRegistry.getProvider({
        locator: {
          kind: 'flowModel.step',
          modelUid: 'model-1',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        value: { code: 'return 1;', version: 'v2' },
      })?.key,
    ).toBe('@nocobase/runjs-workspace/legacy-runjs-studio');
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);

    dispose();
    expect(LegacyRunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);
  });
});
