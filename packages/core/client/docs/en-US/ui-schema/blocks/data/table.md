# Table

## UI Schema

### 表格区块

```json
{
  "type": "void",
  "version": "2.0",
  "x-designer": "TableBlockDesigner",
  "x-component": "CardItem",
  "x-decorator": "TableBlockProvider",
  "x-acl-action": "users:list",
  "x-filter-targets": [],
  "x-decorator-props": {
    "action": "list",
    "params": {
      "pageSize": 20
    },
    "rowKey": "id",
    "dragSort": false,
    "resource": "users",
    "showIndex": true,
    "collection": "users",
    "disableTemplate": false
  },
  "_isJSONSchemaObject": true,
  "properties": {
    "actions": {
      "type": "void",
      "version": "2.0",
      "x-component": "ActionBar",
      "x-initializer": "TableActionInitializers",
      "x-component-props": {
        "style": {
          "marginBottom": "var(--nb-spacing)"
        }
      },
      "_isJSONSchemaObject": true,
      "x-uid": "55tgsn1puqk",
      "x-async": false,
      "x-index": 1
    },
    "g22il5nkv67": {
      "type": "array",
      "version": "2.0",
      "x-component": "TableV2",
      "x-initializer": "TableColumnInitializers",
      "x-component-props": {
        "rowKey": "id",
        "useProps": "{{ useTableBlockProps }}",
        "rowSelection": {
          "type": "checkbox"
        }
      },
      "_isJSONSchemaObject": true,
      "properties": {
        "actions": {
          "type": "void",
          "title": "{{ t(\"Actions\") }}",
          "version": "2.0",
          "x-designer": "TableV2.ActionColumnDesigner",
          "x-component": "TableV2.Column",
          "x-decorator": "TableV2.Column.ActionBar",
          "x-initializer": "TableActionColumnInitializers",
          "x-action-column": "actions",
          "_isJSONSchemaObject": true,
          "properties": {
            "actions": {
              "type": "void",
              "version": "2.0",
              "x-component": "Space",
              "x-decorator": "DndContext",
              "x-component-props": {
                "split": "|"
              },
              "_isJSONSchemaObject": true,
              "x-uid": "qkcugf5l0h6",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "kbgbskxsj3j",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "6r8e3mhnuxg",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-uid": "b87bbc5x0cp",
  "x-async": false,
  "x-index": 1
}
```

### 对多关系区块

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-decorator": "TableBlockProvider",
  "x-acl-action": "a.o2m:list",
  "x-decorator-props": {
    "collection": "b",
    "resource": "a.o2m",
    "action": "list",
    "params": {
      "pageSize": 20
    },
    "showIndex": true,
    "dragSort": false,
    "disableTemplate": false,
    "association": "a.o2m"
  },
  "x-designer": "TableBlockDesigner",
  "x-component": "CardItem",
  "x-filter-targets": [],
  "properties": {
    "actions": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-initializer": "TableActionInitializers",
      "x-component": "ActionBar",
      "x-component-props": {
        "style": {
          "marginBottom": "var(--nb-spacing)"
        }
      },
      "x-uid": "0gwze38mzps",
      "x-async": false,
      "x-index": 1
    },
    "0wuk1cpy5zp": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "array",
      "x-initializer": "TableColumnInitializers",
      "x-component": "TableV2",
      "x-component-props": {
        "rowKey": "id",
        "rowSelection": {
          "type": "checkbox"
        },
        "useProps": "{{ useTableBlockProps }}"
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
              "x-uid": "gq0nkc7rf0q",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "zx97354nzfq",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "nss8uocacdq",
      "x-async": false,
      "x-index": 2
    }
  },
  "x-uid": "0j5kcrius5z",
  "x-async": false,
  "x-index": 1
}
```
