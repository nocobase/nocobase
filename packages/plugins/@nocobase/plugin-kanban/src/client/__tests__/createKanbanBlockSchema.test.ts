import { createKanbanBlockUISchema } from '../createKanbanBlockUISchema';

vi.mock('@formily/shared', () => {
  return {
    uid: vi.fn(() => 'mocked-uid'),
  };
});

test('createKanbanBlockSchema should return an object with expected properties', () => {
  const options = {
    collectionName: 'testCollection',
    groupField: 'testGroupField',
    sortField: 'testSortField',
    dataSource: 'testDataSource',
    params: { testParam: 'testValue' },
  };

  const result = createKanbanBlockUISchema(options);

  expect(result).toMatchInlineSnapshot(`
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
          "x-initializer": "kanban:configureActions",
        },
        "mocked-uid": {
          "properties": {
            "card": {
              "properties": {
                "grid": {
                  "type": "void",
                  "x-component": "Grid",
                  "x-component-props": {
                    "dndContext": false,
                  },
                },
              },
              "type": "void",
              "x-component": "Kanban.Card",
              "x-component-props": {
                "openMode": "drawer",
              },
              "x-decorator": "BlockItem",
              "x-designer": "Kanban.Card.Designer",
              "x-label-disabled": true,
              "x-read-pretty": true,
            },
            "cardViewer": {
              "properties": {
                "drawer": {
                  "properties": {
                    "tabs": {
                      "properties": {
                        "tab1": {
                          "properties": {
                            "grid": {
                              "properties": {},
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
                  "x-component": "Action.Container",
                  "x-component-props": {
                    "className": "nb-action-popup",
                  },
                },
              },
              "title": "{{ t("View") }}",
              "type": "void",
              "x-action": "view",
              "x-component": "Kanban.CardViewer",
              "x-component-props": {
                "openMode": "drawer",
              },
              "x-designer": "Action.Designer",
            },
          },
          "type": "array",
          "x-component": "Kanban",
          "x-use-component-props": "useKanbanBlockProps",
        },
      },
      "type": "void",
      "x-acl-action": "testCollection:list",
      "x-component": "CardItem",
      "x-decorator": "KanbanBlockProvider",
      "x-decorator-props": {
        "action": "list",
        "collection": "testCollection",
        "dataSource": "testDataSource",
        "groupField": "testGroupField",
        "params": {
          "paginate": false,
          "testParam": "testValue",
        },
        "sortField": "testSortField",
      },
      "x-settings": "blockSettings:kanban",
      "x-toolbar": "BlockSchemaToolbar",
    }
  `);
});
