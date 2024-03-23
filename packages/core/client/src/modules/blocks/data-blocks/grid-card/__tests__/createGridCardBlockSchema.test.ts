import { createGridCardBlockSchema } from '../createGridCardBlockSchema';

describe('createGridCardBlockSchema', () => {
  test('should return the correct schema', () => {
    const options = {
      collectionName: 'testCollection',
      dataSource: 'testDataSource',
      association: 'testAssociation',
      templateSchema: { type: 'string' },
      rowKey: 'testRowKey',
    };

    const schema = createGridCardBlockSchema(options);

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
            "x-initializer": "gridCard:configureActions",
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
                    "x-initializer": "gridCard:configureItemActions",
                    "x-use-component-props": "useGridCardActionBarProps",
                  },
                  "grid": {
                    "type": "string",
                  },
                },
                "type": "object",
                "x-component": "GridCard.Item",
                "x-read-pretty": true,
                "x-use-component-props": "useGridCardItemProps",
              },
            },
            "type": "array",
            "x-component": "GridCard",
            "x-use-component-props": "useGridCardBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "testAssociation:view",
        "x-component": "BlockItem",
        "x-decorator": "GridCard.Decorator",
        "x-decorator-props": {
          "action": "list",
          "association": "testAssociation",
          "collection": "testCollection",
          "dataSource": "testDataSource",
          "params": {
            "pageSize": 12,
          },
          "readPretty": true,
          "rowKey": "testRowKey",
          "runWhenParamsChanged": true,
        },
        "x-settings": "blockSettings:gridCard",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-component-props": "useGridCardBlockItemProps",
        "x-use-decorator-props": "useGridCardBlockDecoratorProps",
      }
    `);
  });

  test('should return the correct schema when templateSchema is empty', () => {
    const options = {
      collectionName: 'testCollection',
      dataSource: 'testDataSource',
      association: 'testAssociation',
      rowKey: 'testRowKey',
    };

    const schema = createGridCardBlockSchema(options);

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
            "x-initializer": "gridCard:configureActions",
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
                    "x-initializer": "gridCard:configureItemActions",
                    "x-use-component-props": "useGridCardActionBarProps",
                  },
                  "grid": {
                    "type": "void",
                    "x-component": "Grid",
                    "x-initializer": "details:configureFields",
                  },
                },
                "type": "object",
                "x-component": "GridCard.Item",
                "x-read-pretty": true,
                "x-use-component-props": "useGridCardItemProps",
              },
            },
            "type": "array",
            "x-component": "GridCard",
            "x-use-component-props": "useGridCardBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "testAssociation:view",
        "x-component": "BlockItem",
        "x-decorator": "GridCard.Decorator",
        "x-decorator-props": {
          "action": "list",
          "association": "testAssociation",
          "collection": "testCollection",
          "dataSource": "testDataSource",
          "params": {
            "pageSize": 12,
          },
          "readPretty": true,
          "rowKey": "testRowKey",
          "runWhenParamsChanged": true,
        },
        "x-settings": "blockSettings:gridCard",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-component-props": "useGridCardBlockItemProps",
        "x-use-decorator-props": "useGridCardBlockDecoratorProps",
      }
    `);
  });
});
