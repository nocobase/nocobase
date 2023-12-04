# List

## UI Schema

### 列表区块

```json
{
  "x-uid": "h9mzrnxokk3",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a:view",
  "x-decorator": "List.Decorator",
  "x-decorator-props": {
    "resource": "a",
    "collection": "a",
    "readPretty": true,
    "action": "list",
    "params": {
      "pageSize": 10
    },
    "runWhenParamsChanged": true,
    "rowKey": "id"
  },
  "x-component": "CardItem",
  "x-designer": "List.Designer",
  "x-component-props": {
    "title": "List 区块"
  },
  "properties": {
    "actionBar": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-initializer": "ListActionInitializers",
      "x-component": "ActionBar",
      "x-component-props": {
        "style": {
          "marginBottom": "var(--nb-spacing)"
        }
      },
      "x-uid": "chjgpgd45qz",
      "x-async": false,
      "x-index": 1
    },
    "list": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "array",
      "x-component": "List",
      "x-component-props": {
        "props": "{{ useListBlockProps }}"
      },
      "properties": {
        "item": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "object",
          "x-component": "List.Item",
          "x-read-pretty": true,
          "x-component-props": {
            "useProps": "{{ useListItemProps }}"
          },
          "properties": {
            "grid": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-component": "Grid",
              "x-initializer": "ReadPrettyFormItemInitializers",
              "x-initializer-props": {
                "useProps": "{{ useListItemInitializerProps }}"
              },
              "x-uid": "u45nwmwlone",
              "x-async": false,
              "x-index": 1
            },
            "actionBar": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-align": "left",
              "x-initializer": "ListItemActionInitializers",
              "x-component": "ActionBar",
              "x-component-props": {
                "useProps": "{{ useListActionBarProps }}",
                "layout": "one-column"
              },
              "x-uid": "9erso7nhotq",
              "x-async": false,
              "x-index": 2
            }
          },
          "x-uid": "qkuzlun8frh",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "1mfaa48qy5j",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-async": false,
  "x-index": 1
}
```

### 对多关系的列表区块

```json
{
  "x-uid": "6tzpnkz60rx",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a.o2m:view",
  "x-decorator": "List.Decorator",
  "x-decorator-props": {
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m",
    "readPretty": true,
    "action": "list",
    "params": {
      "pageSize": 10
    },
    "runWhenParamsChanged": true
  },
  "x-component": "CardItem",
  "x-designer": "List.Designer",
  "x-component-props": {
    "title": "对多关系的列表区块"
  },
  "properties": {
    "actionBar": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-initializer": "ListActionInitializers",
      "x-component": "ActionBar",
      "x-component-props": {
        "style": {
          "marginBottom": "var(--nb-spacing)"
        }
      },
      "x-uid": "i05xr7nfs26",
      "x-async": false,
      "x-index": 1
    },
    "list": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "array",
      "x-component": "List",
      "x-component-props": {
        "props": "{{ useListBlockProps }}"
      },
      "properties": {
        "item": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "object",
          "x-component": "List.Item",
          "x-read-pretty": true,
          "x-component-props": {
            "useProps": "{{ useListItemProps }}"
          },
          "properties": {
            "grid": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-component": "Grid",
              "x-initializer": "ReadPrettyFormItemInitializers",
              "x-initializer-props": {
                "useProps": "{{ useListItemInitializerProps }}"
              },
              "x-uid": "krerg70a28e",
              "x-async": false,
              "x-index": 1
            },
            "actionBar": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-align": "left",
              "x-initializer": "ListItemActionInitializers",
              "x-component": "ActionBar",
              "x-component-props": {
                "useProps": "{{ useListActionBarProps }}",
                "layout": "one-column"
              },
              "x-uid": "9745q36ltfv",
              "x-async": false,
              "x-index": 2
            }
          },
          "x-uid": "yxc0lnax9gk",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "6mlzb7p6dvn",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-async": false,
  "x-index": 1
}
```