/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createTableSelectorUISchema } from '../createTableSelectorUISchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createTableSelectorSchema', () => {
  test('should return the correct schema', () => {
    const schema = createTableSelectorUISchema({
      collectionName: 'example',
      dataSource: 'example',
      rowKey: 'id',
    });

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "mocked-uid": {
            "type": "void",
            "x-component": "ActionBar",
            "x-component-props": {
              "style": {
                "marginBottom": "var(--nb-spacing)",
              },
            },
            "x-initializer": "table:configureActions",
          },
          "value": {
            "type": "array",
            "x-component": "TableV2.Selector",
            "x-component-props": {
              "rowSelection": {
                "type": "checkbox",
              },
            },
            "x-initializer": "table:configureColumns",
            "x-use-component-props": "useTableSelectorProps",
          },
        },
        "type": "void",
        "x-acl-action": "example:list",
        "x-component": "CardItem",
        "x-decorator": "TableSelectorProvider",
        "x-decorator-props": {
          "action": "list",
          "collection": "example",
          "dataSource": "example",
          "params": {
            "pageSize": 20,
          },
          "rowKey": "id",
        },
        "x-settings": "blockSettings:tableSelector",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useTableSelectorDecoratorProps",
      }
    `);
  });
});
