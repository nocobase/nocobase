# Form

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-decorator": "FilterFormBlockProvider",
  "x-decorator-props": {
    "resource": "users",
    "collection": "users"
  },
  "x-designer": "FormV2.FilterDesigner",
  "x-component": "CardItem",
  "x-filter-targets": [],
  "x-filter-operators": {},
  "properties": {
    "dwltvxybiir": {
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
          "x-initializer": "FilterFormItemInitializers",
          "x-uid": "aggw48stzwc",
          "x-async": false,
          "x-index": 1
        },
        "actions": {
          "_isJSONSchemaObject": true,
          "version": "2.0",
          "type": "void",
          "x-initializer": "FilterFormActionInitializers",
          "x-component": "ActionBar",
          "x-component-props": {
            "layout": "one-column",
            "style": {
              "float": "right"
            }
          },
          "x-uid": "7aogdo89a7s",
          "x-async": false,
          "x-index": 2
        }
      },
      "x-uid": "wreuz6dr1pc",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "7d1o5bruekl",
  "x-async": false,
  "x-index": 1
}
```