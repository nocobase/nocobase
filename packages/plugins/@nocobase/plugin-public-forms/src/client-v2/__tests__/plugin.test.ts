/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  PUBLIC_FORM_LAYOUT_MODEL,
  PUBLIC_FORM_LAYOUT_UID,
  PUBLIC_FORM_PAGE_MODEL,
  PUBLIC_FORM_ROUTE_NAME,
  PUBLIC_FORM_SUBMIT_ACTION_MODEL,
  PUBLIC_FORMS_NAMESPACE,
  PUBLIC_FORMS_SETTINGS_CONFIGURE_ROUTE_PATH,
  PUBLIC_FORMS_SETTINGS_LAYOUT_MODEL,
  PUBLIC_FORMS_SETTINGS_LAYOUT_UID,
  PUBLIC_FORMS_SETTINGS_ROUTE_NAME,
} from '../constants';

describe('PluginPublicFormsClientV2', () => {
  it('registers settings parent route, nested layout and public route', async () => {
    const { default: PluginPublicFormsClientV2 } = await import('../plugin');
    const app = {
      i18n: {
        t: vi.fn((key) => key),
      },
      flowEngine: {
        registerModels: vi.fn(),
        registerModelLoaders: vi.fn(),
      },
      pluginSettingsManager: {
        addMenuItem: vi.fn(),
        addPageTabItem: vi.fn(),
      },
      layoutManager: {
        registerLayout: vi.fn(),
      },
      router: {
        add: vi.fn(),
      },
    };
    const plugin = new PluginPublicFormsClientV2({} as any, app as any);

    await plugin.load();

    expect(app.flowEngine.registerModels).not.toHaveBeenCalled();
    expect(app.flowEngine.registerModelLoaders).toHaveBeenCalledWith({
      [PUBLIC_FORMS_SETTINGS_LAYOUT_MODEL]: {
        loader: expect.any(Function),
      },
      [PUBLIC_FORM_LAYOUT_MODEL]: {
        loader: expect.any(Function),
      },
      [PUBLIC_FORM_PAGE_MODEL]: {
        loader: expect.any(Function),
      },
      [PUBLIC_FORM_SUBMIT_ACTION_MODEL]: {
        loader: expect.any(Function),
      },
    });
    expect(app.pluginSettingsManager.addMenuItem).toHaveBeenCalledWith({
      key: PUBLIC_FORMS_NAMESPACE,
      title: 'Public forms',
      icon: 'TableOutlined',
      aclSnippet: 'pm.public-forms',
    });
    expect(app.pluginSettingsManager.addPageTabItem).toHaveBeenCalledWith({
      menuKey: PUBLIC_FORMS_NAMESPACE,
      key: 'index',
      title: 'Public forms',
      componentLoader: expect.any(Function),
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledWith({
      routeName: PUBLIC_FORMS_SETTINGS_ROUTE_NAME,
      routePath: PUBLIC_FORMS_SETTINGS_CONFIGURE_ROUTE_PATH,
      uid: PUBLIC_FORMS_SETTINGS_LAYOUT_UID,
      layoutModelClass: PUBLIC_FORMS_SETTINGS_LAYOUT_MODEL,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenCalledWith({
      routeName: PUBLIC_FORM_ROUTE_NAME,
      routePath: '/public-forms',
      uid: PUBLIC_FORM_LAYOUT_UID,
      layoutModelClass: PUBLIC_FORM_LAYOUT_MODEL,
      rootPageModelClass: PUBLIC_FORM_PAGE_MODEL,
      authCheck: false,
    });
    expect(app.router.add).not.toHaveBeenCalled();
  });
});
