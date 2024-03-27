import { createGanttBlockUISchema } from '../createGanttBlockUISchema';

vi.mock('@formily/shared', () => {
  return {
    uid: () => 'mocked-uid',
  };
});

describe('createGanttBlockSchema', () => {
  it('should generate schema correctly', () => {
    const options = {
      collectionName: 'TestCollection',
      fieldNames: {
        label: 'field1',
        value: 'field2',
      },
      dataSource: 'TestDataSource',
    };
    const schema = createGanttBlockUISchema(options);

    expect(schema).toMatchInlineSnapshot(`
      {
        "properties": {
          "mocked-uid": {
            "properties": {
              "detail": {
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
                "x-component": "Gantt.Event",
              },
              "table": {
                "properties": {
                  "actions": {
                    "properties": {
                      "actions": {
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
                  "pagination": false,
                  "rowKey": "id",
                  "rowSelection": {
                    "type": "checkbox",
                  },
                },
                "x-decorator": "div",
                "x-decorator-props": {
                  "style": {
                    "float": "left",
                    "maxWidth": "35%",
                  },
                },
                "x-initializer": "table:configureColumns",
                "x-use-component-props": "useTableBlockProps",
              },
              "toolBar": {
                "properties": {},
                "type": "void",
                "x-component": "ActionBar",
                "x-component-props": {
                  "style": {
                    "marginBottom": 24,
                  },
                },
                "x-initializer": "gantt:configureActions",
              },
            },
            "type": "void",
            "x-component": "Gantt",
            "x-use-component-props": "useGanttBlockProps",
          },
        },
        "type": "void",
        "x-acl-action": "TestCollection:list",
        "x-component": "CardItem",
        "x-decorator": "GanttBlockProvider",
        "x-decorator-props": {
          "action": "list",
          "collection": "TestCollection",
          "dataSource": "TestDataSource",
          "fieldNames": {
            "label": "field1",
            "value": "field2",
          },
          "params": {
            "paginate": false,
          },
        },
        "x-settings": "blockSettings:gantt",
        "x-toolbar": "BlockSchemaToolbar",
      }
    `);
  });
});
