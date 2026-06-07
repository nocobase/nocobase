/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import { getLayoutLabel } from '../permissions/LayoutAwareDesktopRoutesPermissionsTab';
import {
  createDesktopRouteLayoutPermissionFilter,
  getLayoutScopedPermissionChanges,
  registerLayoutAwareDesktopRoutesPermissionsTab,
} from '../permissions/layoutAwareDesktopRoutesPermissions';

describe('plugin-ui-layout route permissions', () => {
  it('should use the persisted ui layout title as the layout selector label', () => {
    const t = vi.fn((key: string) => `t:${key}`);

    expect(
      getLayoutLabel(
        {
          uid: 'admin-layout-model',
          title: 'Admin portal',
          layoutType: 'desktop',
          routeName: 'admin',
        },
        t,
      ),
    ).toBe('t:Admin portal');
    expect(
      getLayoutLabel(
        {
          uid: 'mobile-layout-model',
          layoutType: 'mobile',
          routeName: 'mobile',
        },
        t,
      ),
    ).toBe('t:Mobile layout');
  });

  it('should create an AdminLayout route permission filter with unassigned routes', () => {
    expect(createDesktopRouteLayoutPermissionFilter(DEFAULT_ADMIN_UI_LAYOUT.uid)).toEqual({
      hidden: { $ne: true },
      $or: [{ 'uiLayouts.uid': DEFAULT_ADMIN_UI_LAYOUT.uid }, { 'uiLayouts.id.$notExists': true }],
    });
  });

  it('should create a layout-scoped route permission filter for non-admin layouts', () => {
    expect(createDesktopRouteLayoutPermissionFilter('mobile-layout-model')).toEqual({
      hidden: { $ne: true },
      'uiLayouts.uid': 'mobile-layout-model',
    });
  });

  it('should compute add/remove changes without touching another layout route permission', () => {
    expect(
      getLayoutScopedPermissionChanges({
        currentLayoutRouteIds: [2, 3],
        nextSelectedIds: [2],
        selectedIds: [2, 3],
      }),
    ).toEqual({
      add: [],
      remove: [3],
    });

    expect(
      getLayoutScopedPermissionChanges({
        currentLayoutRouteIds: [2, 3],
        nextSelectedIds: [2, 3],
        selectedIds: [2],
      }),
    ).toEqual({
      add: [3],
      remove: [],
    });
  });

  it('should override the default ACL desktop routes permission tab from plugin-ui-layout', async () => {
    const addPermissionsTab = vi.fn();
    const app = {
      pm: {
        get: vi.fn(() => ({
          settingsUI: {
            addPermissionsTab,
          },
        })),
      },
    };

    registerLayoutAwareDesktopRoutesPermissionsTab(app as never, (key) => key);

    expect(app.pm.get).toHaveBeenCalledWith('acl');
    expect(addPermissionsTab).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'menu',
        label: 'Desktop routes',
        sort: 20,
      }),
    );

    const tab = addPermissionsTab.mock.calls[0][0];
    await expect(tab.componentLoader()).resolves.toHaveProperty('default');
  });

  it('should skip permission tab registration when ACL plugin manager is unavailable', () => {
    expect(() => registerLayoutAwareDesktopRoutesPermissionsTab({} as never, (key) => key)).not.toThrow();
  });
});
