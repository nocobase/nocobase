/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';
import { createEditFormBlockUISchema } from '../createEditFormBlockUISchema';

vi.mock('@formily/shared', () => ({
  uid: () => 'uniqueId',
}));

describe('createEditFormBlockUISchema', () => {
  it('should create a schema with all options', () => {
    const schema = createEditFormBlockUISchema({
      collectionName: 'users',
      dataSource: 'UserDataSource',
      association: 'users:update',
      templateSchema: { type: 'string' },
    });

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "uniqueId": {
            "properties": {
              "grid": {
                "type": "string",
              },
              "uniqueId": {
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "layout": "one-column",
                },
                "x-initializer": "editForm:configureActions",
              },
            },
            "type": "void",
            "x-component": "FormV2",
            "x-use-component-props": "useEditFormBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "users:update:update",
        "x-acl-action-props": {
          "skipScopeCheck": false,
        },
        "x-component": "CardItem",
        "x-decorator": "FormBlockProvider",
        "x-decorator-props": {
          "action": "get",
          "association": "users:update",
          "collection": "users",
          "dataSource": "UserDataSource",
        },
        "x-settings": "blockSettings:editForm",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useEditFormBlockDecoratorProps",
      }
    `);
  });

  it('should create a valid schema with custom x-use-decorator-props', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'usersDataSource',
      isCurrent: true,
    };

    const result = createEditFormBlockUISchema(options);
    expect(result).toMatchInlineSnapshot(`
      {
        "properties": {
          "uniqueId": {
            "properties": {
              "grid": {
                "properties": {},
                "type": "void",
                "x-component": "Grid",
                "x-initializer": "form:configureFields",
              },
              "uniqueId": {
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "layout": "one-column",
                },
                "x-initializer": "editForm:configureActions",
              },
            },
            "type": "void",
            "x-component": "FormV2",
            "x-use-component-props": "useEditFormBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "users:update",
        "x-acl-action-props": {
          "skipScopeCheck": false,
        },
        "x-component": "CardItem",
        "x-decorator": "FormBlockProvider",
        "x-decorator-props": {
          "action": "get",
          "association": undefined,
          "collection": "users",
          "dataSource": "usersDataSource",
        },
        "x-is-current": true,
        "x-settings": "blockSettings:editForm",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useEditFormBlockDecoratorProps",
      }
    `);
  });
});
