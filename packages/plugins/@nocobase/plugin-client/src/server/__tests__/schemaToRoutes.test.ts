/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { schemaToRoutes } from '../migrations/2024122912211-transform-menu-schema-to-routes';

describe('schemaToRoutes', () => {
  it('should return empty array for empty schema', async () => {
    const schema = { properties: {} };
    const uiSchemas = {};
    const result = await schemaToRoutes(schema, uiSchemas);
    expect(result).toEqual([]);
  });

  it('should convert Menu.SubMenu to group route', async () => {
    const schema = {
      properties: {
        key1: {
          'x-component': 'Menu.SubMenu',
          title: 'Group 1',
          'x-component-props': { icon: 'GroupIcon' },
          'x-uid': 'group-1',
          properties: {},
        },
      },
    };
    const uiSchemas = {};
    const result = await schemaToRoutes(schema, uiSchemas);
    expect(result).toEqual([
      {
        type: 'group',
        title: 'Group 1',
        icon: 'GroupIcon',
        schemaUid: 'group-1',
        hideInMenu: false,
        children: [],
      },
    ]);
  });

  it('should convert Menu.Item to page route', async () => {
    const schema = {
      properties: {
        key1: {
          'x-component': 'Menu.Item',
          title: 'Page 1',
          'x-component-props': { icon: 'PageIcon' },
          'x-uid': 'page-1',
        },
      },
    };
    const uiSchemas = {
      getProperties: async () => ({
        properties: {
          page: {
            'x-uid': 'page-schema-1',
          },
        },
      }),
    };
    const result = await schemaToRoutes(schema, uiSchemas);
    expect(result).toEqual([
      {
        type: 'page',
        title: 'Page 1',
        icon: 'PageIcon',
        menuSchemaUid: 'page-1',
        schemaUid: 'page-schema-1',
        hideInMenu: false,
        displayTitle: true,
        enableHeader: true,
        enableTabs: undefined,
        children: [],
      },
    ]);
  });

  it('should convert Menu.Link to link route', async () => {
    const schema = {
      properties: {
        key1: {
          'x-component': 'Menu.URL',
          title: 'Link 1',
          'x-component-props': {
            icon: 'LinkIcon',
            href: '/test',
            params: { foo: 'bar' },
          },
          'x-uid': 'link-1',
        },
      },
    };
    const uiSchemas = {};
    const result = await schemaToRoutes(schema, uiSchemas);
    expect(result).toEqual([
      {
        type: 'link',
        title: 'Link 1',
        icon: 'LinkIcon',
        options: {
          href: '/test',
          params: { foo: 'bar' },
        },
        schemaUid: 'link-1',
        hideInMenu: false,
      },
    ]);
  });

  it('should convert unknown component to tabs route', async () => {
    const schema = {
      properties: {
        key1: {
          'x-component': 'Unknown',
          title: 'Tab 1',
          'x-component-props': { icon: 'TabIcon' },
          'x-uid': 'tab-1',
        },
      },
    };
    const uiSchemas = {};
    const result = await schemaToRoutes(schema, uiSchemas);
    expect(result).toEqual([
      {
        type: 'tabs',
        title: 'Tab 1',
        icon: 'TabIcon',
        schemaUid: 'tab-1',
        tabSchemaName: 'key1',
        hideInMenu: false,
      },
    ]);
  });
});
