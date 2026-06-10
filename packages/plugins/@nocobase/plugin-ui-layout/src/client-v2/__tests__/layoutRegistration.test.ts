/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_ADMIN_UI_LAYOUT, UI_LAYOUT_TYPE_DESKTOP, UI_LAYOUT_TYPE_MOBILE } from '../../constants';
import {
  fetchUiLayouts,
  getUiLayoutModelClass,
  registerUiLayoutRecords,
  registerUiLayoutsFromApi,
  toUiLayoutRegisterOptions,
  type UiLayoutRuntimeRecord,
} from '../layoutRegistration';

const desktopLayout: UiLayoutRuntimeRecord = {
  uid: 'workspace-layout-model',
  layoutType: UI_LAYOUT_TYPE_DESKTOP,
  routeName: 'workspace',
  routePath: '/workspace',
  authCheck: true,
  enabled: true,
};

function createLayoutManager(options: { registeredRouteNames?: string[] } = {}) {
  const registeredRouteNames = new Set(options.registeredRouteNames || []);
  return {
    hasLayout: vi.fn((routeName: string) => registeredRouteNames.has(routeName)),
    registerLayout: vi.fn(),
  };
}

describe('plugin-ui-layout layout registration', () => {
  it('should use code-defined model classes by layout type', () => {
    expect(getUiLayoutModelClass(UI_LAYOUT_TYPE_DESKTOP)).toBe('AdminLayoutModel');
    expect(getUiLayoutModelClass(UI_LAYOUT_TYPE_MOBILE)).toBe('MobileLayoutModel');
    expect(getUiLayoutModelClass('unknown')).toBeUndefined();
  });

  it('should build registerLayout options for an enabled non-default layout', () => {
    expect(toUiLayoutRegisterOptions(desktopLayout)).toEqual({
      routeName: 'workspace',
      routePath: '/workspace',
      uid: 'workspace-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      authCheck: true,
    });
  });

  it('should skip the default admin layout, disabled layouts and unknown layout types', () => {
    expect(
      toUiLayoutRegisterOptions({
        ...desktopLayout,
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
    ).toBeNull();
    expect(toUiLayoutRegisterOptions({ ...desktopLayout, enabled: false })).toBeNull();
    expect(toUiLayoutRegisterOptions({ ...desktopLayout, layoutType: 'custom' })).toBeNull();
  });

  it('should fetch enabled uiLayouts for runtime registration', async () => {
    const request = vi.fn().mockResolvedValue({
      data: {
        data: [desktopLayout],
      },
    });

    await expect(fetchUiLayouts({ request })).resolves.toEqual([desktopLayout]);
    expect(request).toHaveBeenCalledWith({
      url: 'uiLayouts:listEnabled',
      method: 'get',
      skipNotify: true,
    });
  });

  it('should register enabled non-default layouts returned by the API', async () => {
    const mobileLayout: UiLayoutRuntimeRecord = {
      uid: 'mobile-layout-model',
      layoutType: UI_LAYOUT_TYPE_MOBILE,
      routeName: 'mobile',
      routePath: '/mobile',
      authCheck: false,
      enabled: true,
    };
    const app = {
      apiClient: {
        request: vi.fn().mockResolvedValue({
          data: {
            data: [
              {
                ...desktopLayout,
                uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
                routeName: DEFAULT_ADMIN_UI_LAYOUT.routeName,
                routePath: DEFAULT_ADMIN_UI_LAYOUT.routePath,
              },
              { ...desktopLayout, uid: 'disabled-layout-model', routeName: 'disabled', enabled: false },
              desktopLayout,
              mobileLayout,
            ],
          },
        }),
      },
      layoutManager: createLayoutManager(),
    };

    await registerUiLayoutsFromApi(app);

    expect(app.layoutManager.registerLayout).toHaveBeenCalledTimes(2);
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(1, {
      routeName: 'workspace',
      routePath: '/workspace',
      uid: 'workspace-layout-model',
      layoutModelClass: 'AdminLayoutModel',
      authCheck: true,
    });
    expect(app.layoutManager.registerLayout).toHaveBeenNthCalledWith(2, {
      routeName: 'mobile',
      routePath: '/mobile',
      uid: 'mobile-layout-model',
      layoutModelClass: 'MobileLayoutModel',
      rootPageModelClass: 'MobileRootPageModel',
      childPageModelClass: 'MobileChildPageModel',
      authCheck: false,
    });
  });

  it('should not register a routeName that is already registered', () => {
    const layoutManager = createLayoutManager({ registeredRouteNames: ['workspace'] });

    registerUiLayoutRecords(layoutManager, [desktopLayout]);

    expect(layoutManager.hasLayout).toHaveBeenCalledWith('workspace');
    expect(layoutManager.registerLayout).not.toHaveBeenCalled();
  });

  it('should continue registering later layouts when one layout fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const layoutManager = createLayoutManager();
    layoutManager.registerLayout.mockImplementationOnce(() => {
      throw new Error('register failed');
    });
    const mobileLayout: UiLayoutRuntimeRecord = {
      uid: 'mobile-layout-model',
      layoutType: UI_LAYOUT_TYPE_MOBILE,
      routeName: 'mobile',
      routePath: '/mobile',
      authCheck: false,
      enabled: true,
    };

    registerUiLayoutRecords(layoutManager, [desktopLayout, mobileLayout]);

    expect(layoutManager.registerLayout).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(
      "[NocoBase] plugin-ui-layout failed to register UI layout 'workspace'.",
      expect.any(Error),
    );
    warn.mockRestore();
  });

  it('should ignore list request failures during plugin load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = {
      apiClient: {
        request: vi.fn().mockRejectedValue(new Error('request failed')),
      },
      layoutManager: createLayoutManager(),
    };

    await expect(registerUiLayoutsFromApi(app)).resolves.toBeUndefined();
    expect(app.layoutManager.registerLayout).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('[NocoBase] plugin-ui-layout failed to load UI layouts.', expect.any(Error));
    warn.mockRestore();
  });
});
