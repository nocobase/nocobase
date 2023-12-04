# Gantt

## UI Schema

### 甘特图区块

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "users:list",
  "x-decorator": "GanttBlockProvider",
  "x-decorator-props": {
    "collection": "users",
    "resource": "users",
    "action": "list",
    "fieldNames": {
      "id": "id",
      "start": "createdAt",
      "range": "day",
      "title": "nickname",
      "end": "f_46b1u4dp820"
    },
    "params": {
      "paginate": false
    }
  },
  "x-designer": "Gantt.Designer",
  "x-component": "CardItem",
  "properties": {
    "rx21gtpcj3w": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "Gantt",
      "x-component-props": {
        "useProps": "{{ useGanttBlockProps }}"
      },
      "properties": {
        "toolBar": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "x-initializer": "GanttActionInitializers",
          "x-uid": "m0uru68ugw9",
          "x-async": false,
          "x-index": 1
        },
        "table": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "array",
          "x-decorator": "div",
          "x-decorator-props": {
            "style": {
              "float": "left",
              "maxWidth": "35%"
            }
          },
          "x-initializer": "TableColumnInitializers",
          "x-component": "TableV2",
          "x-component-props": {
            "rowKey": "id",
            "rowSelection": {
              "type": "checkbox"
            },
            "useProps": "{{ useTableBlockProps }}",
            "pagination": false
          },
          "properties": {
            "actions": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "title": "{{ t(\"Actions\") }}",
              "x-action-column": "actions",
              "x-decorator": "TableV2.Column.ActionBar",
              "x-component": "TableV2.Column",
              "x-designer": "TableV2.ActionColumnDesigner",
              "x-initializer": "TableActionColumnInitializers",
              "properties": {
                "actions": {
                  "_isJSONSchemaObject": true,
                  "version": "2.0",
                  "type": "void",
                  "x-decorator": "DndContext",
                  "x-component": "Space",
                  "x-component-props": {
                    "split": "|"
                  },
                  "x-uid": "z2vnizu7bds",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "8gbabo6kdr6",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "5c8g2x6rvro",
          "x-async": false,
          "x-index": 2
        },
        "detail": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Gantt.Event",
          "properties": {
            "drawer": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-component": "Action.Drawer",
              "x-component-props": {
                "className": "nb-action-popup"
              },
              "title": "{{ t(\"View record\") }}",
              "properties": {
                "tabs": {
                  "_isJSONSchemaObject": true,
                  "version": "2.0",
                  "type": "void",
                  "x-component": "Tabs",
                  "x-component-props": {},
                  "x-initializer": "TabPaneInitializers",
                  "properties": {
                    "tab1": {
                      "_isJSONSchemaObject": true,
                      "version": "2.0",
                      "type": "void",
                      "title": "{{t(\"Details\")}}",
                      "x-component": "Tabs.TabPane",
                      "x-designer": "Tabs.Designer",
                      "x-component-props": {},
                      "properties": {
                        "grid": {
                          "_isJSONSchemaObject": true,
                          "version": "2.0",
                          "type": "void",
                          "x-component": "Grid",
                          "x-initializer": "RecordBlockInitializers",
                          "x-uid": "jr5h3asz6gp",
                          "x-async": false,
                          "x-index": 1
                        }
                      },
                      "x-uid": "8uwfpgyok9x",
                      "x-async": false,
                      "x-index": 1
                    }
                  },
                  "x-uid": "bjm4sfwxmrx",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "7cmwpc0rrwj",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "nffb7qbs96o",
          "x-async": false,
          "x-index": 3
        }
      },
      "x-uid": "hoi2j5lhlho",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "e0rdive4xpa",
  "x-async": false,
  "x-index": 1
}
```