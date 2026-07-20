/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

const { legacyProviders, legacyRunJSEditorRegistry } = vi.hoisted(() => {
  const providers: unknown[] = [];
  return {
    legacyProviders: providers,
    legacyRunJSEditorRegistry: {
      registerProvider(provider: unknown) {
        providers.push(provider);
        return () => {
          const index = providers.indexOf(provider);
          if (index >= 0) providers.splice(index, 1);
        };
      },
      getProviders: () => [...providers],
      clear: () => providers.splice(0),
    },
  };
});

vi.mock('@nocobase/client', () => ({
  LegacyRunJSEditorRegistry: legacyRunJSEditorRegistry,
  Plugin: class {
    async afterAdd() {}

    async beforeLoad() {}

    async load() {}
  },
  useAPIClient: () => ({
    request: vi.fn(),
  }),
}));

describe('installLegacyRunJSStudioClient', () => {
  afterEach(async () => {
    const { RunJSEditorRegistry } = await import('@nocobase/client-v2');
    const { LegacyRunJSEditorRegistry } = await import('../runjs-studio/contract');
    RunJSEditorRegistry.clear();
    LegacyRunJSEditorRegistry.clear();
  });

  it('registers and disposes both Studio providers', async () => {
    const [
      { installLegacyRunJSStudioClient },
      { RunJSEditorRegistry },
      { LegacyRunJSEditorRegistry },
      { legacyRunJSStudioProvider },
      { runJSStudioProvider },
    ] = await Promise.all([
      import('../plugin'),
      import('@nocobase/client-v2'),
      import('../runjs-studio/contract'),
      import('../runjs-studio/LegacyRunJSStudioProvider'),
      import('../../../client-v2/vsc-file/runjs-studio'),
    ]);
    const dispose = installLegacyRunJSStudioClient();

    expect(RunJSEditorRegistry.getProviders()).toContainEqual(runJSStudioProvider);
    expect(LegacyRunJSEditorRegistry.getProviders()).toContain(legacyRunJSStudioProvider);
    expect(legacyProviders).toContain(legacyRunJSStudioProvider);

    dispose();

    expect(RunJSEditorRegistry.getProviders()).not.toContainEqual(runJSStudioProvider);
    expect(LegacyRunJSEditorRegistry.getProviders()).not.toContain(legacyRunJSStudioProvider);
    expect(legacyProviders).not.toContain(legacyRunJSStudioProvider);
  });
});
