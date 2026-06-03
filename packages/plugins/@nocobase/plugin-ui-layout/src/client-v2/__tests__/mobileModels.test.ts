/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseLayoutModel, ChildPageModel, RootPageModel } from '@nocobase/client-v2';
import { describe, expect, it } from 'vitest';
import {
  createFakeMobileDesktopRoutes,
  createMobileHomeAddMenuItems,
  createMobileHomeMenuItems,
  createMobileHomeTabItems,
  MobileLayoutModel,
} from '../models/MobileLayoutModel';
import { MobileChildPageModel, MobileRootPageModel } from '../models/MobilePageModels';

describe('plugin-ui-layout mobile models', () => {
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

  it('should provide mobile tab add menu items', () => {
    const t = (key: string) => `t:${key}`;

    expect(createMobileHomeAddMenuItems(t).map((item) => [item.key, item.label])).toEqual([
      ['page', 't:Page'],
      ['link', 't:Link'],
    ]);
  });

  it('should suppress default page tab add buttons in mobile headers', () => {
    const flowEngine = { getModel: () => null };

    expect(new MobileRootPageModel({ flowEngine } as never).tabBarExtraContent.right).toBeNull();
    expect(new MobileChildPageModel({ flowEngine } as never).tabBarExtraContent.right).toBeNull();
  });
});
