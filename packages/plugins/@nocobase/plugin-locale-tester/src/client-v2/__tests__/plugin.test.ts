/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

describe('PluginLocaleTesterClientV2', () => {
  it('registers the locale tester settings page lazily', async () => {
    const { default: PluginLocaleTesterClientV2 } = await import('../plugin');
    const app = {
      i18n: {
        t: vi.fn((key) => key),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
      },
    };
    const plugin = new PluginLocaleTesterClientV2({} as never, app as never);

    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'locale-tester',
      title: 'Locale tester',
      icon: 'TranslationOutlined',
      aclSnippet: 'pm.locale-tester',
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'locale-tester',
      key: 'index',
      title: 'Locale tester',
      componentLoader: expect.any(Function),
    });
  });
});
