import { createMapBlockUISchema } from '../../block/createMapBlockUISchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

test('createMapBlockSchema should return an object with expected properties', () => {
  const options = {
    collectionName: 'testCollection',
    dataSource: 'testDataSource',
    fieldNames: {
      label: 'field1',
      value: 'field2',
    },
  };

  const result = createMapBlockUISchema(options);

  expect(result).toMatchInlineSnapshot(`
    {
      "properties": {
        "actions": {
          "type": "void",
          "x-component": "ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 16,
            },
          },
          "x-initializer": "map:configureActions",
        },
        "mocked-uid": {
          "properties": {
            "drawer": {
              "properties": {
                "tabs": {
                  "properties": {
                    "tab1": {
                      "properties": {
                        "grid": {
                          "type": "void",
                          "x-component": "Grid",
                          "x-initializer": "popup:common:addBlock",
                        },
                      },
                      "title": "{{t("Details")}}",
                      "type": "void",
                      "x-component": "Tabs.TabPane",
                      "x-component-props": {},
                      "x-designer": "Tabs.Designer",
                    },
                  },
                  "type": "void",
                  "x-component": "Tabs",
                  "x-component-props": {},
                  "x-initializer": "TabPaneInitializers",
                },
              },
              "title": "{{ t("View record") }}",
              "type": "void",
              "x-component": "Action.Drawer",
              "x-component-props": {
                "className": "nb-action-popup",
              },
            },
          },
          "type": "void",
          "x-component": "MapBlock",
          "x-use-component-props": "useMapBlockProps",
        },
      },
      "type": "void",
      "x-acl-action": "testCollection:list",
      "x-component": "CardItem",
      "x-decorator": "MapBlockProvider",
      "x-decorator-props": {
        "action": "list",
        "collection": "testCollection",
        "dataSource": "testDataSource",
        "fieldNames": {
          "label": "field1",
          "value": "field2",
        },
        "params": {
          "paginate": false,
        },
      },
      "x-filter-targets": [],
      "x-settings": "blockSettings:map",
      "x-toolbar": "BlockSchemaToolbar",
    }
  `);
});
