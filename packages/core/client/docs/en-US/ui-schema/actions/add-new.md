# Add new

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "type": "void",
  "x-action": "create",
  "x-acl-action": "create",
  "title": "{{t('Add new')}}",
  "x-designer": "Action.Designer",
  "x-component": "Action",
  "x-decorator": "ACLActionProvider",
  "x-component-props": {
    "openMode": "drawer",
    "type": "primary",
    "component": "CreateRecordAction",
    "icon": "PlusOutlined"
  },
  "x-align": "right",
  "x-acl-action-props": {
    "skipScopeCheck": true
  },
  "properties": {
    "drawer": {
      "_isJSONSchemaObject": true,
      "version": "2.0",
      "type": "void",
      "title": "{{ t(\"Add record\") }}",
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
          "x-initializer": "TabPaneInitializersForCreateFormBlock",
          "properties": {
            "tab1": {
              "_isJSONSchemaObject": true,
              "version": "2.0",
              "type": "void",
              "title": "{{t(\"Add new\")}}",
              "x-component": "Tabs.TabPane",
              "x-designer": "Tabs.Designer",
              "x-component-props": {},
              "properties": {
                "grid": {
                  "_isJSONSchemaObject": true,
                  "version": "2.0",
                  "type": "void",
                  "x-component": "Grid",
                  "x-initializer": "CreateFormBlockInitializers",
                  "x-uid": "psh2rj6pkab",
                  "x-async": false,
                  "x-index": 1
                }
              },
              "x-uid": "3i7grk0aytf",
              "x-async": false,
              "x-index": 1
            }
          },
          "x-uid": "75s24n1nlkh",
          "x-async": false,
          "x-index": 1
        }
      },
      "x-uid": "wg1f4xyx7vp",
      "x-async": false,
      "x-index": 1
    }
  },
  "x-uid": "2hwye7mt2th",
  "x-async": false,
  "x-index": 1
}
```