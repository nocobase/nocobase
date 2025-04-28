/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createTableBlockUISchema } from '../createTableBlockUISchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createTableBLockSchemaV2', () => {
  it('should create a default table block schema with minimum options', () => {
    const options = { dataSource: 'abc', collectionName: 'users', association: 'users.roles' };
    const schema = createTableBlockUISchema(options);

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "actions": {
            "properties": {},
            "type": "void",
            "x-component": "ActionBar",
            "x-component-props": {
              "style": {
                "marginBottom": "var(--nb-spacing)",
              },
            },
            "x-initializer": "table:configureActions",
          },
          "mocked-uid": {
            "properties": {
              "actions": {
                "properties": {
                  "mocked-uid": {
                    "type": "void",
                    "x-component": "Space",
                    "x-component-props": {
                      "split": "|",
                    },
                    "x-decorator": "DndContext",
                  },
                },
                "title": "{{ t("Actions") }}",
                "type": "void",
                "x-action-column": "actions",
                "x-component": "TableV2.Column",
                "x-decorator": "TableV2.Column.ActionBar",
                "x-initializer": "table:configureItemActions",
                "x-settings": "fieldSettings:TableColumn",
                "x-toolbar": "TableColumnSchemaToolbar",
                "x-toolbar-props": {
                  "initializer": "table:configureItemActions",
                },
              },
            },
            "type": "array",
            "x-component": "TableV2",
            "x-component-props": {
              "rowKey": "id",
              "rowSelection": {
                "type": "checkbox",
              },
            },
            "x-initializer": "table:configureColumns",
            "x-use-component-props": "useTableBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "users.roles:list",
        "x-component": "CardItem",
        "x-decorator": "TableBlockProvider",
        "x-decorator-props": {
          "action": "list",
          "association": "users.roles",
          "collection": "users",
          "dataSource": "abc",
          "dragSort": false,
          "params": {
            "pageSize": 20,
          },
          "showIndex": true,
        },
        "x-filter-targets": [],
        "x-settings": "blockSettings:table",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useTableBlockDecoratorProps",
      }
    `);
  });
});
