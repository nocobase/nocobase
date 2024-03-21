# Details

## UI Schema

### 详情区块（带分页）

```json
{
  "type": "void",
  "version": "2.0",
  "x-designer": "DetailsDesigner",
  "x-component": "CardItem",
  "x-decorator": "DetailsBlockProvider",
  "x-acl-action": "users:view",
  "x-decorator-props": {
    "action": "list",
    "params": {
      "pageSize": 1
    },
    "rowKey": "id",
    "resource": "users",
    "collection": "users",
    "readPretty": true
  },
  "_isJSONSchemaObject": true,
  "properties": {
    "mjad1dcywip": {
      "type": "void",
      "version": "2.0",
      "x-component": "Details",
      "x-read-pretty": true,
      "x-component-props": {
        "useProps": "{{ useDetailsBlockProps }}"
      },
      "_isJSONSchemaObject": true,
      "properties": {
        "8avswx6qgyp": {
          "type": "void",
          "version": "2.0",
          "x-component": "ActionBar",
          "x-initializer": "DetailsActionInitializers",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "_isJSONSchemaObject": true,
          "x-uid": "01w17yleng8",
          "x-async": false,
          "x-index": 1
        },
        "grid": {
          "type": "void",
          "version": "2.0",
          "x-component": "Grid",
          "x-initializer": "ReadPrettyFormItemInitializers",
          "_isJSONSchemaObject": true,
          "x-uid": "bgu0ix4lfmc",
          "x-async": false,
          "x-index": 2
        },
        "pagination": {
          "type": "void",
          "version": "2.0",
          "x-component": "Pagination",
          "x-component-props": {
            "useProps": "{{ useDetailsPaginationProps }}"
          },
          "_isJSONSchemaObject": true,
          "x-uid": "6riuxghrz30",
          "x-async": false,
          "x-index": 3
        }
      },
      "x-uid": "3apkfu8ngrp",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "yeodhismy2w",
  "x-async": false,
  "x-index": 1
}
```

### 对多关系区块

```json
{
  "x-uid": "2gm2iw937q5",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a.o2m:view",
  "x-decorator": "DetailsBlockProvider",
  "x-decorator-props": {
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m",
    "readPretty": true,
    "action": "list",
    "params": {
      "pageSize": 1
    },
    "rowKey": "id"
  },
  "x-designer": "DetailsDesigner",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "关系区块"
  },
  "properties": {
    "paj8b2noc1g": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "Details",
      "x-read-pretty": true,
      "x-component-props": {
        "useProps": "{{ useDetailsBlockProps }}"
      },
      "properties": {
        "3jisjip7503": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "DetailsActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "x-uid": "cbkfxafywtx",
          "x-async": false,
          "x-index": 1
        },
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "ReadPrettyFormItemInitializers",
          "x-uid": "d1ls1w6gpzm",
          "x-async": false,
          "x-index": 2
        },
        "pagination": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Pagination",
          "x-component-props": {
            "useProps": "{{ useDetailsPaginationProps }}"
          },
          "x-uid": "u0rzv8370za",
          "x-async": false,
          "x-index": 3
        }
      },
      "x-uid": "1hfu8jbzzqw",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```