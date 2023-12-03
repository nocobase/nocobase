# 提交

## UI Schema

### 新建数据的提交

```json
{
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
  "x-uid": "aaxbm1i5xxd",
  "x-async": false,
  "x-index": 1
}
```