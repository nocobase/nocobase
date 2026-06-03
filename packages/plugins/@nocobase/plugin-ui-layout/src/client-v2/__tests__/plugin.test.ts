/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';
import { UI_LAYOUT_TYPE_DESKTOP } from '../../constants';

describe('PluginUiLayoutClientV2', () => {
  it('should register settings page and enabled layouts from the API', async () => {
    const { default: PluginUiLayoutClientV2 } = await import('../plugin');
    const app = {
      i18n: {
        t: vi.fn((key: string) => key),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
      },
      apiClient: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                uid: 'workspace-layout-model',
                layoutType: UI_LAYOUT_TYPE_DESKTOP,
                routeName: 'workspace',
                routePath: '/workspace',
                authCheck: true,
                enabled: true,
              },
            ],
          },
        }),
      },
      layoutManager: {
        hasLayout: vi.fn(() => false),
        registerLayout: vi.fn(),
      },
    };
    const plugin = new PluginUiLayoutClientV2({} as Record<string, never>, app as unknown as Application);

    await plugin.load();

    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: 'ui-layout',
      title: 'UI layout',
      icon: 'LayoutOutlined',
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: 'ui-layout',
      key: 'index',
      title: 'UI layout',
      componentLoader: expect.any(Function),
    });
    expect(app.apiClient.request).toHaveBeenCalledWith({
      url: 'uiLayouts:list',
      method: 'get',
      params: {
        paginate: false,
        sort: ['id'],
      },
      skipNotify: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledWith({
      routeName: 'workspace',
      routePath: '/workspace',
      uid: 'workspace-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      authCheck: true,
    });
  });
});
