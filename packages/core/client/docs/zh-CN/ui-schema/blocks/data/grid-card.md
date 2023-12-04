# GridCard

## UI Schema

### 栅格卡片

```json
{
  "type": "void",
  "version": "2.0",
  "x-designer": "GridCard.Designer",
  "x-component": "BlockItem",
  "x-decorator": "GridCard.Decorator",
  "x-acl-action": "users:view",
  "x-component-props": {
    "useProps": "{{ useGridCardBlockItemProps }}"
  },
  "x-decorator-props": {
    "action": "list",
    "params": {
      "pageSize": 12
    },
    "rowKey": "id",
    "resource": "users",
    "collection": "users",
    "readPretty": true,
    "runWhenParamsChanged": true
  },
  "_isJSONSchemaObject": true,
  "properties": {
    "actionBar": {
      "type": "void",
      "version": "2.0",
      "x-component": "ActionBar",
      "x-initializer": "GridCardActionInitializers",
      "x-component-props": {
        "style": {
          "marginBottom": "var(--nb-spacing)"
        }
      },
      "_isJSONSchemaObject": true,
      "x-uid": "prx9wnlzqb1",
      "x-async": false,
      "x-index": 1
    },
    "list": {
      "type": "array",
      "version": "2.0",
      "x-component": "GridCard",
      "x-component-props": {
        "useProps": "{{ useGridCardBlockProps }}"
      },
      "_isJSONSchemaObject": true,
      "properties": {
        "item": {
          "type": "object",
          "version": "2.0",
          "x-component": "GridCard.Item",
          "x-read-pretty": true,
          "x-component-props": {
            "useProps": "{{ useGridCardItemProps }}"
          },
          "_isJSONSchemaObject": true,
          "properties": {
            "grid": {
              "type": "void",
              "version": "2.0",
              "x-component": "Grid",
              "x-initializer": "ReadPrettyFormItemInitializers",
              "_isJSONSchemaObject": true,
              "x-initializer-props": {
                "useProps": "{{ useGridCardItemInitializerProps }}"
              },
              "x-uid": "pq895sv6136",
              "x-async": false,
              "x-index": 1
            },
            "actionBar": {
              "type": "void",
              "version": "2.0",
              "x-align": "left",
              "x-component": "ActionBar",
              "x-initializer": "GridCardItemActionInitializers",
              "x-component-props": {
                "layout": "one-column",
                "useProps": "{{ useGridCardActionBarProps }}"
              },
              "_isJSONSchemaObject": true,
              "x-uid": "w2c3qcp4nme",
              "x-async": false,
              "x-index": 2
            }
          },
          "x-uid": "1ct8yn1jnzn",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "pvnkvtc6tte",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-uid": "phodsqwsifq",
  "x-async": false,
  "x-index": 1
}
```

### 关系数据的栅格卡片

```json
{
  "x-uid": "yr79zvl98lc",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a.o2m:view",
  "x-decorator": "GridCard.Decorator",
  "x-decorator-props": {
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m",
    "readPretty": true,
    "action": "list",
    "params": {
      "pageSize": 12
    },
    "runWhenParamsChanged": true,
    "columnCount": {
      "xs": 1,
      "md": 12,
      "lg": 12,
      "xxl": 12
    }
  },
  "x-component": "BlockItem",
  "x-component-props": {
    "useProps": "{{ useGridCardBlockItemProps }}"
  },
  "x-designer": "GridCard.Designer",
  "properties": {
    "actionBar": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-initializer": "GridCardActionInitializers",
      "x-component": "ActionBar",
      "x-component-props": {
        "style": {
          "marginBottom": "var(--nb-spacing)"
        }
      },
      "x-uid": "u36l44beq6a",
      "x-async": false,
      "x-index": 1
    },
    "list": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "array",
      "x-component": "GridCard",
      "x-component-props": {
        "useProps": "{{ useGridCardBlockProps }}"
      },
      "properties": {
        "item": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "object",
          "x-component": "GridCard.Item",
          "x-read-pretty": true,
          "x-component-props": {
            "useProps": "{{ useGridCardItemProps }}"
          },
          "properties": {
            "grid": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-component": "Grid",
              "x-initializer": "ReadPrettyFormItemInitializers",
              "x-initializer-props": {
                "useProps": "{{ useGridCardItemInitializerProps }}"
              },
              "x-uid": "aqxlonv3bpk",
              "x-async": false,
              "x-index": 1
            },
            "actionBar": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-align": "left",
              "x-initializer": "GridCardItemActionInitializers",
              "x-component": "ActionBar",
              "x-component-props": {
                "useProps": "{{ useGridCardActionBarProps }}",
                "layout": "one-column"
              },
              "x-uid": "zxhqo81kdf5",
              "x-async": false,
              "x-index": 2
            }
          },
          "x-uid": "ed56owlyz1p",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "nfpuvrkwkk7",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-async": false,
  "x-index": 1
}
```