/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { findFirstPageRoute, NocoBaseDesktopRouteType } from '..';
import { NocoBaseDesktopRoute } from '../convertRoutesToSchema';

describe('findFirstPageRoute', () => {
  // 基本测试：空路由数组
  it('should return undefined for empty routes array', () => {
    const result = findFirstPageRoute([]);
    expect(result).toBeUndefined();
  });

  // 基本测试：undefined 路由数组
  it('should return undefined for undefined routes', () => {
    const result = findFirstPageRoute(undefined);
    expect(result).toBeUndefined();
  });

  // 测试：只有一个页面路由
  it('should find the first page route when there is only one page', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        schemaUid: 'page1',
        type: NocoBaseDesktopRouteType.page,
        title: 'Page 1',
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[0]);
  });

  // 测试：多个页面路由
  it('should find the first page route when there are multiple pages', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        schemaUid: 'page1',
        type: NocoBaseDesktopRouteType.page,
        title: 'Page 1',
      },
      {
        id: 2,
        schemaUid: 'page2',
        type: NocoBaseDesktopRouteType.page,
        title: 'Page 2',
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[0]);
  });

  // 测试：不同类型的路由混合
  it('should find the first page route among mixed route types', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        schemaUid: 'link1',
        type: NocoBaseDesktopRouteType.link,
        title: 'Link 1',
      },
      {
        id: 2,
        schemaUid: 'page1',
        type: NocoBaseDesktopRouteType.page,
        title: 'Page 1',
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[1]);
  });

  // 测试：隐藏的菜单项
  it('should ignore hidden menu items', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        schemaUid: 'page1',
        type: NocoBaseDesktopRouteType.page,
        title: 'Page 1',
        hideInMenu: true,
      },
      {
        id: 2,
        schemaUid: 'page2',
        type: NocoBaseDesktopRouteType.page,
        title: 'Page 2',
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[1]);
  });

  // 测试：嵌套路由
  it('should find page route in nested group', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.group,
        title: 'Group 1',
        children: [
          {
            id: 11,
            schemaUid: 'page1',
            type: NocoBaseDesktopRouteType.page,
            title: 'Page 1',
          },
        ],
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[0].children[0]);
  });

  // 测试：多层嵌套路由
  it('should find page route in deeply nested groups', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.group,
        title: 'Group 1',
        children: [
          {
            id: 11,
            type: NocoBaseDesktopRouteType.group,
            title: 'Group 1-1',
            children: [
              {
                id: 111,
                schemaUid: 'page1',
                type: NocoBaseDesktopRouteType.page,
                title: 'Page 1',
              },
            ],
          },
        ],
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[0].children[0].children[0]);
  });

  // 测试：复杂路由结构
  it('should find the first visible page in a complex route structure', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.group,
        title: 'Group 1',
        hideInMenu: true,
        children: [
          {
            id: 11,
            schemaUid: 'page1',
            type: NocoBaseDesktopRouteType.page,
            title: 'Page 1',
          },
        ],
      },
      {
        id: 2,
        type: NocoBaseDesktopRouteType.group,
        title: 'Group 2',
        children: [
          {
            id: 21,
            schemaUid: 'page2',
            type: NocoBaseDesktopRouteType.page,
            title: 'Page 2',
          },
        ],
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[1].children[0]);
  });

  // 测试：空组
  it('should skip empty groups and find page in next group', () => {
    const routes: NocoBaseDesktopRoute[] = [
      {
        id: 1,
        type: NocoBaseDesktopRouteType.group,
        title: 'Empty Group',
        children: [],
      },
      {
        id: 2,
        schemaUid: 'page1',
        type: NocoBaseDesktopRouteType.page,
        title: 'Page 1',
      },
    ];

    const result = findFirstPageRoute(routes);
    expect(result).toEqual(routes[1]);
  });
});
