/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import PluginTextCopyV2 from '../plugin';

const pluginMocks = vi.hoisted(() => ({
  registerTextCopyDisplayField: vi.fn(),
}));

vi.mock('@nocobase/client-v2', () => ({
  Plugin: class Plugin {},
}));

vi.mock('../textCopyDisplayField', () => ({
  registerTextCopyDisplayField: pluginMocks.registerTextCopyDisplayField,
}));

describe('PluginTextCopyV2', () => {
  it('registers the text-copy display field extension on load', async () => {
    const plugin = new PluginTextCopyV2();

    await plugin.load();

    expect(pluginMocks.registerTextCopyDisplayField).toHaveBeenCalledTimes(1);
  });
});
