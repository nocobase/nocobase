/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/client', () => ({
  Plugin: class {
    async afterAdd() {}

    async beforeLoad() {}

    async load() {}
  },
  useAPIClient: () => ({
    request: vi.fn(),
  }),
}));

describe('PluginVscFileClient', () => {
  afterEach(async () => {
    const { RunJSEditorRegistry } = await import('@nocobase/client-v2');
    const { LegacyRunJSEditorRegistry } = await import('../runjs-studio');
    RunJSEditorRegistry.clear();
    LegacyRunJSEditorRegistry.clear();
  });

  it('inherits the legacy client plugin lifecycle methods', async () => {
    const { default: PluginVscFileClient } = await import('../plugin');
    const plugin = new PluginVscFileClient({ packageName: '@nocobase/plugin-vsc-file' } as never, {} as never);

    expect(typeof plugin.afterAdd).toBe('function');
    expect(typeof plugin.beforeLoad).toBe('function');
    expect(typeof plugin.load).toBe('function');
  });

  it('registers the legacy RunJS Studio provider', async () => {
    const [
      { default: PluginVscFileClient },
      { RunJSEditorRegistry },
      { LegacyRunJSEditorRegistry, legacyRunJSStudioProvider },
      { runJSStudioProvider },
    ] = await Promise.all([
      import('../plugin'),
      import('@nocobase/client-v2'),
      import('../runjs-studio'),
      import('../../client-v2/runjs-studio'),
    ]);
    const plugin = new PluginVscFileClient({ packageName: '@nocobase/plugin-vsc-file' } as never, {} as never);

    await plugin.load();

    expect(RunJSEditorRegistry.getProviders()).toContain(runJSStudioProvider);
    expect(LegacyRunJSEditorRegistry.getProviders()).toContain(legacyRunJSStudioProvider);
  });
});
