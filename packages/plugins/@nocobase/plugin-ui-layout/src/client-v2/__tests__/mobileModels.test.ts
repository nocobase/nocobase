/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseLayoutModel, ChildPageModel, RootPageModel } from '@nocobase/client-v2';
import { NocoBaseDesktopRouteType, type NocoBaseDesktopRoute } from '@nocobase/client-v2/flow-compat';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMobileAddBlockMenuItems,
  createFakeMobileDesktopRoutes,
  createMobileHomeAddMenuItems,
  createMobileHomeMenuItems,
  createMobileHomeTabItemsFromDesktopRoutes,
  createMobileHomeTabItems,
  FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT,
  FLOW_SETTINGS_PREFERENCE_STORAGE_KEY,
  MobileLayoutModel,
  normalizeAccessibleDesktopRoutesToMobileRoutes,
  readMobileFlowSettingsPreference,
  writeMobileFlowSettingsPreference,
} from '../models/MobileLayoutModel';
import { MobileChildPageModel, MobileRootPageModel } from '../models/MobilePageModels';

describe('plugin-ui-layout mobile models', () => {
  beforeEach(() => {
    window.localStorage.removeItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY);
  });

  it('should extend the standard layout and page models', () => {
    expect(MobileLayoutModel.prototype).toBeInstanceOf(BaseLayoutModel);
    expect(MobileRootPageModel.prototype).toBeInstanceOf(RootPageModel);
    expect(MobileChildPageModel.prototype).toBeInstanceOf(ChildPageModel);
  });

  it('should provide temporary mobile home menu data', () => {
    const t = (key: string) => `t:${key}`;

    expect(createMobileHomeMenuItems(t).map((item) => item.key)).toEqual([
      'workbench',
      'tasks',
      'customers',
      'reports',
    ]);
    expect(createMobileHomeTabItems(t).map((item) => item.key)).toEqual(['home', 'notifications', 'settings']);
    expect(createMobileHomeTabItems(t).find((item) => item.key === 'home')?.active).toBe(true);
  });

  it('should derive mobile tab bar items from fake desktop routes', () => {
    const t = (key: string) => `t:${key}`;
    const fakeRoutes = createFakeMobileDesktopRoutes(t);

    expect(fakeRoutes.map((route) => route.key)).toEqual(['home', 'notifications', 'settings']);
    expect(createMobileHomeTabItems(t).map((item) => [item.key, item.label])).toEqual([
      ['home', 't:Home'],
      ['notifications', 't:Notifications'],
      ['settings', 't:Settings'],
    ]);
  });

  it('should derive mobile tab bar items from accessible desktop routes', () => {
    const t = (key: string) => `route:${key}`;
    const accessibleRoutes: NocoBaseDesktopRoute[] = [
      {
        id: 3,
        type: NocoBaseDesktopRouteType.group,
        title: 'Settings',
        sort: 30,
        children: [
          {
            id: 31,
            type: NocoBaseDesktopRouteType.flowPage,
            title: 'Profile',
            sort: 10,
          },
          {
            id: 32,
            type: NocoBaseDesktopRouteType.link,
            title: 'Hidden child',
            hidden: true,
            sort: 20,
          },
        ],
      },
      {
        id: 1,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Home',
        icon: 'HomeOutlined',
        schemaUid: 'home-page',
        sort: 10,
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.flowPage,
        title: 'Hidden',
        hideInMenu: true,
        sort: 20,
      },
    ];

    const mobileRoutes = normalizeAccessibleDesktopRoutesToMobileRoutes(accessibleRoutes, t);

    expect(createMobileHomeTabItemsFromDesktopRoutes(mobileRoutes).map((item) => [item.key, item.label])).toEqual([
      ['home-page', 'route:Home'],
      ['id-3', 'route:Settings'],
    ]);
    expect(
      createMobileHomeTabItemsFromDesktopRoutes(mobileRoutes.find((route) => route.key === 'id-3')?.children || []).map(
        (item) => item.key,
      ),
    ).toEqual(['id-31']);
  });

  it('should provide mobile tab add menu items', () => {
    const t = (key: string) => `t:${key}`;

    expect(createMobileHomeAddMenuItems(t).map((item) => [item.key, item.label])).toEqual([
      ['page', 't:Page'],
      ['link', 't:Link'],
    ]);
  });

  it('should provide mobile add block menu groups', () => {
    const t = (key: string) => `t:${key}`;
    const groups = createMobileAddBlockMenuItems(t);

    expect(groups.map((group) => [group.key, group.label])).toEqual([
      ['dataBlocks', 't:Data blocks'],
      ['filterBlocks', 't:Filter blocks'],
      ['otherBlocks', 't:Other blocks'],
    ]);
    expect(groups[0].children.map((item) => [item.key, item.label])).toEqual([
      ['data-table', 't:Table'],
      ['data-form', 't:Form'],
      ['data-details', 't:Details'],
      ['data-grid-card', 't:Grid Card'],
    ]);
  });

  it('should suppress default page tab add buttons in mobile headers', () => {
    const flowEngine = { getModel: () => null };

    expect(new MobileRootPageModel({ flowEngine } as never).tabBarExtraContent.right).toBeNull();
    expect(new MobileChildPageModel({ flowEngine } as never).tabBarExtraContent.right).toBeNull();
  });

  it('should persist mobile UI editor preference to localStorage', () => {
    const listener = vi.fn();
    window.addEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, listener);

    expect(readMobileFlowSettingsPreference()).toBe(false);

    writeMobileFlowSettingsPreference(true);
    expect(window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY)).toBe('1');
    expect(readMobileFlowSettingsPreference()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);

    writeMobileFlowSettingsPreference(false);
    expect(window.localStorage.getItem(FLOW_SETTINGS_PREFERENCE_STORAGE_KEY)).toBe('0');
    expect(readMobileFlowSettingsPreference()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(FLOW_SETTINGS_PREFERENCE_CHANGE_EVENT, listener);
  });
});
