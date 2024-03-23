import { ISchema } from '@formily/react';
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
                  "style": {
                    "marginTop": 24,
                  },
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
});
