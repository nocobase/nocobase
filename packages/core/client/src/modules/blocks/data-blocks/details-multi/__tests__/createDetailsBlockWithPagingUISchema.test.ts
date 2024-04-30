/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createDetailsWithPaginationUISchema } from '../createDetailsWithPaginationUISchema';

vi.mock('@formily/shared', () => ({
  uid: vi.fn().mockReturnValue('mocked-uid'),
}));

describe('createDetailsBlockWithPaginationUISchema', () => {
  it('should return the correct schema', () => {
    const schema = createDetailsWithPaginationUISchema({
      collectionName: 'users',
      dataSource: 'users',
      rowKey: 'id',
    });

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "mocked-uid": {
            "properties": {
              "grid": {
                "properties": {},
                "type": "void",
                "x-component": "Grid",
                "x-initializer": "details:configureFields",
              },
              "mocked-uid": {
                "properties": {},
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "style": {
                    "marginBottom": 24,
                  },
                },
                "x-initializer": "details:configureActions",
              },
              "pagination": {
                "type": "void",
                "x-component": "Pagination",
                "x-use-component-props": "useDetailsPaginationProps",
              },
            },
            "type": "void",
            "x-component": "Details",
            "x-read-pretty": true,
            "x-use-component-props": "useDetailsWithPaginationProps",
          },
        },
        "type": "void",
        "x-acl-action": "users:view",
        "x-component": "CardItem",
        "x-decorator": "DetailsBlockProvider",
        "x-decorator-props": {
          "action": "list",
          "association": undefined,
          "collection": "users",
          "dataSource": "users",
          "params": {
            "pageSize": 1,
          },
          "readPretty": true,
        },
        "x-settings": "blockSettings:detailsWithPagination",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useDetailsWithPaginationDecoratorProps",
      }
    `);
  });
});
