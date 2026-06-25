/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@nocobase/client', () => ({
  Plugin: class {
    async afterAdd() {}

    async beforeLoad() {}

    async load() {}
  },
}));

describe('PluginVscFileClient', () => {
  it('inherits the legacy client plugin lifecycle methods', async () => {
    const { default: PluginVscFileClient } = await import('../plugin');
    const plugin = new PluginVscFileClient({ packageName: '@nocobase/plugin-vsc-file' } as never, {} as never);

    expect(typeof plugin.afterAdd).toBe('function');
    expect(typeof plugin.beforeLoad).toBe('function');
    expect(typeof plugin.load).toBe('function');
  });
});
