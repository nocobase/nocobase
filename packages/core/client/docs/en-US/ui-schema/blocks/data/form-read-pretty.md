# Form (Read pretty)

## UI Schema

### 单数据详情

```json
{
  "x-uid": "dt4q817fw81",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a:get",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "resource": "a",
    "collection": "a",
    "readPretty": true,
    "action": "get",
    "useParams": "{{ useParamsFromRecord }}",
    "useSourceId": "{{ useSourceIdFromParentRecord }}"
  },
  "x-designer": "FormV2.ReadPrettyDesigner",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "Form read pretty"
  },
  "properties": {
    "30qrxij609o": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-read-pretty": true,
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "ReadPrettyFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "x-uid": "fznn1ygt50o",
          "x-async": false,
          "x-index": 1
        },
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "ReadPrettyFormItemInitializers",
          "x-uid": "t3o4t8fi7l7",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "6dp2qqoc4s0",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```

### 关系数据详情

```json
{
  "x-uid": "jf470wrzdaf",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a.o2oBelongsTo:get",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "resource": "a.o2oBelongsTo",
    "collection": "b",
    "association": "a.o2oBelongsTo",
    "readPretty": true,
    "action": "get",
    "useParams": "{{ useParamsFromRecord }}",
    "useSourceId": "{{ useSourceIdFromParentRecord }}"
  },
  "x-designer": "FormV2.ReadPrettyDesigner",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "对一关系详情"
  },
  "properties": {
    "uauk2wbj3iq": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-read-pretty": true,
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "ReadPrettyFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "x-uid": "r3pcykksp8l",
          "x-async": false,
          "x-index": 1
        },
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "ReadPrettyFormItemInitializers",
          "x-uid": "vs000etludp",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "rt228uhudcf",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```

### 表格详情

```json
{
  "x-uid": "lxcjjkkor1m",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a.o2m:get",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m",
    "readPretty": true,
    "action": "get",
    "useParams": "{{ useParamsFromRecord }}",
    "useSourceId": "{{ useSourceIdFromParentRecord }}"
  },
  "x-designer": "FormV2.ReadPrettyDesigner",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "表格详情"
  },
  "properties": {
    "7pe17tcgtye": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-read-pretty": true,
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "ReadPrettyFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "x-uid": "wek8nc795ja",
          "x-async": false,
          "x-index": 1
        },
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "ReadPrettyFormItemInitializers",
          "x-uid": "5y5u8qm6yvz",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "5bpcm982n51",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```

### 查看关系数据

```json
{
  "x-uid": "5ymsrq1fv37",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action": "a.o2m:get",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m",
    "readPretty": true,
    "action": "get",
    "useParams": "{{ useParamsFromRecord }}",
    "useSourceId": "{{ useSourceIdFromParentRecord }}"
  },
  "x-designer": "FormV2.ReadPrettyDesigner",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "查看关系数据"
  },
  "properties": {
    "vehcfr0fsh2": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-read-pretty": true,
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "ReadPrettyFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "style": {
              "marginBottom": 24
            }
          },
          "x-uid": "zpuz629u2dg",
          "x-async": false,
          "x-index": 1
        },
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "ReadPrettyFormItemInitializers",
          "x-uid": "b8u8e2k5inf",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "2rz0u3j14px",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```