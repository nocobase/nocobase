# Kanban

## UI Schema

### 看板区块

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "t_ehwqkw0ljw2:list",
  "x-decorator": "KanbanBlockProvider",
  "x-decorator-props": {
    "collection": "t_ehwqkw0ljw2",
    "resource": "t_ehwqkw0ljw2",
    "action": "list",
    "groupField": "f_5h4umwf59lc",
    "params": {
      "sort": ["f_5h4umwf59lc_sort"],
      "paginate": false
    }
  },
  "x-designer": "Kanban.Designer",
  "x-component": "CardItem",
  "properties": {
    "actions": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-initializer": "KanbanActionInitializers",
      "x-component": "ActionBar",
      "x-component-props": {
        "style": {
          "marginBottom": "var(--nb-spacing)"
        }
      },
      "x-uid": "4vh5t2iohwp",
      "x-async": false,
      "x-index": 1
    },
    "iwnc45ou960": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "array",
      "x-component": "Kanban",
      "x-component-props": {
        "useProps": "{{ useKanbanBlockProps }}"
      },
      "properties": {
        "card": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-read-pretty": true,
          "x-label-disabled": true,
          "x-decorator": "BlockItem",
          "x-component": "Kanban.Card",
          "x-component-props": {
            "openMode": "drawer"
          },
          "x-designer": "Kanban.Card.Designer",
          "properties": {
            "grid": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-component": "Grid",
              "x-component-props": {
                "dndContext": false
              },
              "x-uid": "3v010y09684",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "dk9a5cb9d95",
          "x-async": false,
          "x-index": 1
        },
        "cardViewer": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "title": "{{ t(\"View\") }}",
          "x-designer": "Action.Designer",
          "x-component": "Kanban.CardViewer",
          "x-action": "view",
          "x-component-props": {
            "openMode": "drawer"
          },
          "properties": {
            "drawer": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "title": "{{ t(\"View record\") }}",
              "x-component": "Action.Container",
              "x-component-props": {
                "className": "nb-action-popup"
              },
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
                          "x-uid": "1lhiyyydpye",
                          "x-async": false,
                          "x-index": 1
                        }
                      },
                      "x-uid": "gisuj0zldz1",
                      "x-async": false,
                      "x-index": 1
                    }
                  },
                  "x-uid": "ohly2w4gnwp",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "29hjrxcfczh",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "0k56h1q80xo",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "uny2d4n5ry4",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-uid": "3gga5lop4t6",
  "x-async": false,
  "x-index": 1
}
```