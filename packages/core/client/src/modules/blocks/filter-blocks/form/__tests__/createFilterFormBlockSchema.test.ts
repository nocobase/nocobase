import { createFilterFormBlockSchema } from '../createFilterFormBlockSchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createFilterFormBlockSchema', () => {
  test('should return the correct schema', () => {
    const schema = createFilterFormBlockSchema({
      collectionName: 'myCollection',
      dataSource: 'myDataSource',
      templateSchema: { type: 'string' },
    });

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "mocked-uid": {
            "properties": {
              "grid": {
                "type": "string",
              },
              "mocked-uid": {
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "layout": "one-column",
                  "style": {
                    "float": "right",
                  },
                },
                "x-initializer": "filterForm:configureActions",
              },
            },
            "type": "void",
            "x-component": "FormV2",
            "x-use-component-props": "useFilterFormBlockProps",
          },
        },
        "type": "void",
        "x-component": "CardItem",
        "x-decorator": "FilterFormBlockProvider",
        "x-decorator-props": {
          "collection": "myCollection",
          "dataSource": "myDataSource",
        },
        "x-filter-operators": {},
        "x-filter-targets": [],
        "x-settings": "blockSettings:filterForm",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useFilterFormBlockDecoratorProps",
      }
    `);
  });

  test('should return the correct schema without templateSchema', () => {
    const schema = createFilterFormBlockSchema({
      collectionName: 'myCollection',
      dataSource: 'myDataSource',
    });

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "mocked-uid": {
            "properties": {
              "grid": {
                "type": "void",
                "x-component": "Grid",
                "x-initializer": "filterForm:configureFields",
              },
              "mocked-uid": {
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "layout": "one-column",
                  "style": {
                    "float": "right",
                  },
                },
                "x-initializer": "filterForm:configureActions",
              },
            },
            "type": "void",
            "x-component": "FormV2",
            "x-use-component-props": "useFilterFormBlockProps",
          },
        },
        "type": "void",
        "x-component": "CardItem",
        "x-decorator": "FilterFormBlockProvider",
        "x-decorator-props": {
          "collection": "myCollection",
          "dataSource": "myDataSource",
        },
        "x-filter-operators": {},
        "x-filter-targets": [],
        "x-settings": "blockSettings:filterForm",
        "x-toolbar": "BlockSchemaToolbar",
        "x-use-decorator-props": "useFilterFormBlockDecoratorProps",
      }
    `);
  });
});
