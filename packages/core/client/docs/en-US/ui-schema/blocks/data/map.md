# Map

## UI Schema

### 地图区块

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "t_ddo5bd0swdg:list",
  "x-decorator": "MapBlockProvider",
  "x-decorator-props": {
    "collection": "t_ddo5bd0swdg",
    "resource": "t_ddo5bd0swdg",
    "action": "list",
    "fieldNames": {
      "field": ["f_tmhy5bbusr8"]
    },
    "params": {
      "paginate": false
    }
  },
  "x-designer": "MapBlockDesigner",
  "x-component": "CardItem",
  "x-filter-targets": [],
  "properties": {
    "actions": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-initializer": "MapActionInitializers",
      "x-component": "ActionBar",
      "x-component-props": {
        "style": {
          "marginBottom": 16
        }
      },
      "x-uid": "ap0xzy32bms",
      "x-async": false,
      "x-index": 1
    },
    "1672zefmplu": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "MapBlock",
      "x-component-props": {
        "useProps": "{{ useMapBlockProps }}"
      },
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
                      "x-uid": "vce3u8hfdrf",
                      "x-async": false,
                      "x-index": 1
                    }
                  },
                  "x-uid": "waw7z3qw7nn",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "szyybarlapl",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "83m07ksqbal",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "5cquhqq2161",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-uid": "p42awfpfnbf",
  "x-async": false,
  "x-index": 1
}
```