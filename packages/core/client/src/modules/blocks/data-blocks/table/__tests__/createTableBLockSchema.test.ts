import { createTableBlockUISchema } from '../createTableBlockUISchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createTableBLockSchemaV2', () => {
  it('should create a default table block schema with minimum options', () => {
    const options = { dataSource: 'abc', collectionName: 'users', association: 'users.roles', rowKey: 'rowKey' };
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
                "x-designer": "TableV2.ActionColumnDesigner",
                "x-initializer": "table:configureItemActions",
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
        "x-acl-action": "users:list",
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
          "rowKey": "rowKey",
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
