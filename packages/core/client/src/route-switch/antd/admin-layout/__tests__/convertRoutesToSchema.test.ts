/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { convertRoutesToSchema, RouteType } from '../convertRoutesToSchema';

describe('convertRoutesToSchema', () => {
  it('should convert empty routes array to basic menu schema', () => {
    const result = convertRoutesToSchema([]);
    expect(result).toMatchObject({
      type: 'void',
      'x-component': 'Menu',
      'x-designer': 'Menu.Designer',
      'x-initializer': 'MenuItemInitializers',
      properties: {},
    });
  });

  it('should convert single page route to menu schema', () => {
    const routes = [
      {
        id: 1,
        title: 'Test Page',
        type: RouteType.page,
        icon: 'HomeOutlined',
        schemaUid: 'test-uid',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    ];

    const result = convertRoutesToSchema(routes);
    expect(result.properties).toMatchObject({
      [Object.keys(result.properties)[0]]: {
        type: 'void',
        title: 'Test Page',
        'x-component': 'Menu.Item',
        'x-component-props': {
          icon: 'HomeOutlined',
        },
        'x-uid': 'test-uid',
      },
    });
  });

  it('should convert nested group route to menu schema', () => {
    const routes = [
      {
        id: 1,
        title: 'Group',
        type: RouteType.group,
        icon: 'GroupOutlined',
        schemaUid: 'group-uid',
        children: [
          {
            id: 2,
            title: 'Child Page',
            type: RouteType.page,
            icon: 'FileOutlined',
            schemaUid: 'child-uid',
            createdAt: '2023-01-01',
            updatedAt: '2023-01-01',
          },
        ],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    ];

    const result = convertRoutesToSchema(routes);
    const groupSchema = result.properties[Object.keys(result.properties)[0]];

    expect(groupSchema).toMatchObject({
      type: 'void',
      title: 'Group',
      'x-component': 'Menu.SubMenu',
      'x-component-props': {
        icon: 'GroupOutlined',
      },
      'x-uid': 'group-uid',
    });

    const childSchema = groupSchema.properties[Object.keys(groupSchema.properties)[0]];
    expect(childSchema).toMatchObject({
      type: 'void',
      title: 'Child Page',
      'x-component': 'Menu.Item',
      'x-component-props': {
        icon: 'FileOutlined',
      },
      'x-uid': 'child-uid',
    });
  });

  it('should skip tabs type routes', () => {
    const routes = [
      {
        id: 1,
        title: 'Tabs',
        type: RouteType.tabs,
        schemaUid: 'tabs-uid',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    ];

    const result = convertRoutesToSchema(routes);
    expect(Object.keys(result.properties)).toHaveLength(0);
  });

  it('should convert link type route to menu URL schema', () => {
    const routes = [
      {
        id: 1,
        title: 'External Link',
        type: RouteType.link,
        icon: 'LinkOutlined',
        schemaUid: 'link-uid',
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    ];

    const result = convertRoutesToSchema(routes);
    expect(result.properties[Object.keys(result.properties)[0]]).toMatchObject({
      type: 'void',
      title: 'External Link',
      'x-component': 'Menu.URL',
      'x-component-props': {
        icon: 'LinkOutlined',
      },
      'x-uid': 'link-uid',
    });
  });
});
