# Calendar

## x-initializer

- CalendarActionInitializers
- TabPaneInitializers
- RecordBlockInitializers

## x-designer

- CalendarV2.Designer

## x-settings

- CalendarSettings

## UI Schema

### 日历区块

```json
{
  "type": "void",
  "version": "2.0",
  "x-designer": "CalendarV2.Designer",
  "x-component": "CardItem",
  "x-decorator": "CalendarBlockProvider",
  "x-acl-action": "users:list",
  "x-decorator-props": {
    "action": "list",
    "params": {
      "paginate": false
    },
    "resource": "users",
    "collection": "users",
    "fieldNames": {
      "id": "id",
      "end": ["f_nxqfedh5fd5"],
      "start": ["f_nxqfedh5fd5"],
      "title": "nickname"
    }
  },
  "_isJSONSchemaObject": true,
  "properties": {
    "puytl7p5x8o": {
      "type": "void",
      "version": "2.0",
      "x-component": "CalendarV2",
      "x-component-props": {
        "useProps": "{{ useCalendarBlockProps }}"
      },
      "_isJSONSchemaObject": true,
      "properties": {
        "toolBar": {
          "type": "void",
          "version": "2.0",
          "x-component": "CalendarV2.ActionBar",
          "x-initializer": "CalendarActionInitializers",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "_isJSONSchemaObject": true,
          "x-uid": "494h1j6bxyg",
          "x-async": false,
          "x-index": 1
        },
        "event": {
          "type": "void",
          "version": "2.0",
          "x-component": "CalendarV2.Event",
          "_isJSONSchemaObject": true,
          "properties": {
            "drawer": {
              "type": "void",
              "title": "{{ t(\"View record\") }}",
              "version": "2.0",
              "x-component": "Action.Drawer",
              "x-component-props": {
                "className": "nb-action-popup"
              },
              "_isJSONSchemaObject": true,
              "properties": {
                "tabs": {
                  "type": "void",
                  "version": "2.0",
                  "x-component": "Tabs",
                  "x-initializer": "TabPaneInitializers",
                  "x-component-props": {},
                  "_isJSONSchemaObject": true,
                  "x-initializer-props": {
                    "gridInitializer": "RecordBlockInitializers"
                  },
                  "properties": {
                    "tab1": {
                      "type": "void",
                      "title": "{{t(\"Details\")}}",
                      "version": "2.0",
                      "x-designer": "Tabs.Designer",
                      "x-component": "Tabs.TabPane",
                      "x-component-props": {},
                      "_isJSONSchemaObject": true,
                      "properties": {
                        "grid": {
                          "type": "void",
                          "version": "2.0",
                          "x-component": "Grid",
                          "x-initializer": "RecordBlockInitializers",
                          "_isJSONSchemaObject": true,
                          "x-initializer-props": {
                            "actionInitializers": "CalendarFormActionInitializers"
                          },
                          "x-uid": "yty9wg20qq0",
                          "x-async": false,
                          "x-index": 1
                        }
                      },
                      "x-uid": "hcsgenoc3hb",
                      "x-async": false,
                      "x-index": 1
                    }
                  },
                  "x-uid": "c5cpptwxw7s",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "c5iarcnpefc",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "080x8qlpn6s",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "pcche4s596p",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "gk2jk3gpo9f",
  "x-async": false,
  "x-index": 1
}
```

### 关系的日历区块

```json
{
  "x-uid": "8q0hsbdr9fc",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a.o2m:list",
  "x-decorator": "CalendarBlockProvider",
  "x-decorator-props": {
    "collection": "b",
    "resource": "a.o2m",
    "action": "list",
    "fieldNames": {
      "id": "id",
      "start": "createdAt",
      "title": "f_ex4581dfc0t"
    },
    "params": {
      "paginate": false
    },
    "association": "a.o2m"
  },
  "x-designer": "CalendarV2.Designer",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "关系的日历区块"
  },
  "properties": {
    "v3za6qejuz7": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "CalendarV2",
      "x-component-props": {
        "useProps": "{{ useCalendarBlockProps }}"
      },
      "properties": {
        "toolBar": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "CalendarV2.ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "x-initializer": "CalendarActionInitializers",
          "x-uid": "u9ntffsdsrh",
          "x-async": false,
          "x-index": 1
        },
        "event": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "CalendarV2.Event",
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
                  "x-initializer-props": {
                    "gridInitializer": "RecordBlockInitializers"
                  },
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
                          "x-initializer-props": {
                            "actionInitializers": "CalendarFormActionInitializers"
                          },
                          "x-initializer": "RecordBlockInitializers",
                          "x-uid": "2swhiw4lee5",
                          "x-async": false,
                          "x-index": 1
                        }
                      },
                      "x-uid": "z6odjfbwnht",
                      "x-async": false,
                      "x-index": 1
                    }
                  },
                  "x-uid": "mxr7ikhfc9y",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "mfgucnj7ev8",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "05l5a2h42pn",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "v2jazzvqa85",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```