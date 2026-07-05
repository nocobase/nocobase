/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'fs';
import path from 'path';

import PluginLightExtensionClient from '..';

describe('plugin-light-extension legacy client boundary', () => {
  it('registers only a thin settings bridge without importing the v1 client runtime', async () => {
    const add = vi.fn();
    const plugin = new PluginLightExtensionClient(
      { name: 'light-extension' },
      {
        pluginSettingsManager: { add },
        i18n: {
          t: (text, options) => `${options?.ns}:${text}`,
        },
      },
    );

    expect(plugin.options.name).toBe('light-extension');

    await expect(plugin.afterAdd()).resolves.toBeUndefined();
    await expect(plugin.beforeLoad()).resolves.toBeUndefined();
    await expect(plugin.load()).resolves.toBeUndefined();
    expect(add).toHaveBeenCalledWith(
      'light-extension',
      expect.objectContaining({
        icon: 'CodeOutlined',
        title: '@nocobase/plugin-light-extension:Light extensions',
        Component: expect.any(Function),
        aclSnippet: 'pm.light-extension',
      }),
    );

    const source = fs.readFileSync(path.resolve(__dirname, '../index.ts'), 'utf8');

    expect(source).not.toMatch(/from\s+['"]@nocobase\/client['"]|require\(['"]@nocobase\/client['"]\)/);
  });
});
