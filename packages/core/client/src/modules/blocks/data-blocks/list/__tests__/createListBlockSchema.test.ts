import { createListBlockSchema } from '../createListBlockSchema';

describe('createListBlockSchema', () => {
  test('should return the correct schema', () => {
    const options = {
      collectionName: 'users',
      dataSource: 'users',
      association: 'user',
      templateSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          age: {
            type: 'number',
          },
        },
      },
      rowKey: 'id',
    };

    const schema = createListBlockSchema(options);

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "actionBar": {
            "type": "void",
            "x-component": "ActionBar",
            "x-component-props": {
              "style": {
                "marginBottom": "var(--nb-spacing)",
              },
            },
            "x-initializer": "list:configureActions",
          },
          "list": {
            "properties": {
              "item": {
                "properties": {
                  "actionBar": {
                    "type": "void",
                    "x-align": "left",
                    "x-component": "ActionBar",
                    "x-component-props": {
                      "layout": "one-column",
                    },
                    "x-initializer": "list:configureItemActions",
                    "x-use-component-props": "useListActionBarProps",
                  },
                  "grid": {
                    "properties": {
                      "age": {
                        "type": "number",
                      },
                      "name": {
                        "type": "string",
                      },
                    },
                    "type": "object",
                  },
                },
                "type": "object",
                "x-component": "List.Item",
                "x-read-pretty": true,
                "x-use-component-props": "useListItemProps",
              },
            },
            "type": "array",
            "x-component": "List",
            "x-use-component-props": "useListBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "user:view",
        "x-component": "CardItem",
        "x-decorator": "List.Decorator",
        "x-decorator-props": {
          "action": "list",
          "association": "user",
          "collection": "users",
          "dataSource": "users",
          "params": {
            "pageSize": 10,
          },
          "readPretty": true,
          "rowKey": "id",
          "runWhenParamsChanged": true,
        },
        "x-settings": "blockSettings:list",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useListBlockDecoratorProps",
      }
    `);
  });
});
