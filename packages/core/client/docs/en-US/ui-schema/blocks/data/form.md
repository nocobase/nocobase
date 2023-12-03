# Form

## UI Schema

### 添加表单

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action-props": {
    "skipScopeCheck": true
  },
  "x-acl-action": "a:create",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "resource": "a",
    "collection": "a"
  },
  "x-designer": "FormV2.Designer",
  "x-component": "CardItem",
  "x-component-props": {},
  "properties": {
    "23pj9m7ot5a": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "FormItemInitializers",
          "x-uid": "0ctuwnatyzd",
          "x-async": false,
          "x-index": 1
        },
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "CreateFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "layout": "one-column",
            "style": {
              "marginTop": 24
            }
          },
          "properties": {
            "j7ta88et3mv": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "title": "{{ t(\"Submit\") }}",
              "x-action": "submit",
              "x-component": "Action",
              "x-designer": "Action.Designer",
              "x-component-props": {
                "type": "primary",
                "htmlType": "submit",
                "useProps": "{{ useCreateActionProps }}"
              },
              "x-action-settings": {
                "triggerWorkflows": []
              },
              "type": "void",
              "x-uid": "ua858zswy37",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "o0riryr0ob0",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "1ng4hies4yu",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "ebiyvziafda",
  "x-async": false,
  "x-index": 1
}
```

### 编辑表单

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action-props": {
    "skipScopeCheck": false
  },
  "x-acl-action": "a:update",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "useSourceId": "{{ useSourceIdFromParentRecord }}",
    "useParams": "{{ useParamsFromRecord }}",
    "action": "get",
    "resource": "a",
    "collection": "a"
  },
  "x-designer": "FormV2.Designer",
  "x-component": "CardItem",
  "x-component-props": {},
  "properties": {
    "w533dipin7p": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "FormItemInitializers",
          "x-uid": "otncpmalhjr",
          "x-async": false,
          "x-index": 1
        },
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "UpdateFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "layout": "one-column",
            "style": {
              "marginTop": 24
            }
          },
          "x-uid": "qjjmm1qkapx",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "n12zo6qd72g",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "zafyvmng9m5",
  "x-async": false,
  "x-index": 1
}
```

### 关系新增表单

```json
{
  "x-uid": "il5q341k4vg",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action-props": {
    "skipScopeCheck": true
  },
  "x-acl-action": "a.o2m:create",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "useSourceId": "{{ useSourceIdFromParentRecord }}",
    "useParams": "{{ useParamsFromRecord }}",
    "action": null,
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m"
  },
  "x-designer": "FormV2.Designer",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "关系新增表单"
  },
  "properties": {
    "3357yvwe4je": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "FormItemInitializers",
          "x-uid": "88xhnoml321",
          "x-async": false,
          "x-index": 1
        },
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "CreateFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "layout": "one-column",
            "style": {
              "marginTop": 24
            }
          },
          "x-uid": "dhs8o8vpl1h",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "h6fhh9ox9ay",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```

### 关系新增（关系表格里的 Add new）

useSourceIdFromParentRecord 和 useParamsFromRecord 参数缺失

```json
{
  "x-uid": "6tknohm4ubr",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action-props": {
    "skipScopeCheck": true
  },
  "x-acl-action": "a.o2m:create",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m"
  },
  "x-designer": "FormV2.Designer",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "关系新增表单-Table"
  },
  "properties": {
    "o96izt6ez7m": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "FormItemInitializers",
          "properties": {
            "pk9l1i26yq6": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "x-component": "Grid.Row",
              "properties": {
                "32wz2lr9cry": {
                  "_isJSONSchemaObject": true,
                  "version": "2.0",
                  "type": "void",
                  "x-component": "Grid.Col",
                  "properties": {
                    "id": {
                      "_isJSONSchemaObject": true,
                      "version": "2.0",
                      "type": "string",
                      "x-designer": "FormItem.Designer",
                      "x-component": "CollectionField",
                      "x-decorator": "FormItem",
                      "x-collection-field": "b.id",
                      "x-component-props": {},
                      "x-read-pretty": true,
                      "x-uid": "jb09nj4kbfm",
                      "x-async": false,
                      "x-index": 1
                    }
                  },
                  "x-uid": "rtx3b0uom75",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "5gvd7ks6m0z",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "fcw1y2xk6km",
          "x-async": false,
          "x-index": 1
        },
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "CreateFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "layout": "one-column",
            "style": {
              "marginTop": 24
            }
          },
          "x-uid": "msgopb1meoq",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "g0mg6fhho4x",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```

### 关系编辑

```json
{
  "x-uid": "kzg1tz339ro",
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-acl-action-props": {
    "skipScopeCheck": false
  },
  "x-acl-action": "a.o2m:update",
  "x-decorator": "FormBlockProvider",
  "x-decorator-props": {
    "useSourceId": "{{ useSourceIdFromParentRecord }}",
    "useParams": "{{ useParamsFromRecord }}",
    "action": "get",
    "resource": "a.o2m",
    "collection": "b",
    "association": "a.o2m"
  },
  "x-designer": "FormV2.Designer",
  "x-component": "CardItem",
  "x-component-props": {
    "title": "关系编辑表单"
  },
  "properties": {
    "3jqysycq8m0": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "x-component": "FormV2",
      "x-component-props": {
        "useProps": "{{ useFormBlockProps }}"
      },
      "properties": {
        "grid": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-component": "Grid",
          "x-initializer": "FormItemInitializers",
          "x-uid": "sy3sjswogh4",
          "x-async": false,
          "x-index": 1
        },
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "UpdateFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "layout": "one-column",
            "style": {
              "marginTop": 24
            }
          },
          "x-uid": "xarcyjpypsy",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "lepez9684rm",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-async": false,
  "x-index": 1
}
```