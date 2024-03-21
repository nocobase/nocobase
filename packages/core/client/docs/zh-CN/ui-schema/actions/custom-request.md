# 自定义请求

<Alert type="warning">
x-component 不统一，x-action 也不统一，有三种风格的 schema
</Alert>

## UI Schema

### 表单的自定义请求

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "title": "{{ t(\"Custom request\") }}",
  "x-component": "CustomRequestAction",
  "x-action": "customize:form:request",
  "x-designer": "CustomRequestAction.Designer",
  "x-decorator": "CustomRequestAction.Decorator",
  "x-action-settings": {
    "onSuccess": {
      "manualClose": false,
      "redirecting": false,
      "successMessage": "{{t(\"Request success\")}}"
    }
  },
  "type": "void",
  "x-uid": "d1rfalvivfo",
  "x-async": false,
  "x-index": 2
}
```

### 表格列操作的自定义请求

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "title": "{{ t(\"Custom request\") }}",
  "x-component": "Action.Link",
  "x-action": "customize:table:request",
  "x-designer": "Action.Designer",
  "x-action-settings": {
    "requestSettings": {},
    "onSuccess": {
      "manualClose": false,
      "redirecting": false,
      "successMessage": "{{t(\"Request success\")}}"
    }
  },
  "x-component-props": {
    "useProps": "{{ useCustomizeRequestActionProps }}"
  },
  "x-designer-props": {
    "linkageAction": true
  },
  "type": "void",
  "x-uid": "edn0y4fq7xb",
  "x-async": false,
  "x-index": 1
}
```

### 详情的自定义请求

```json
{
  "_isJSONSchemaObject": true,
  "version": "2.0",
  "title": "{{ t(\"Custom request\") }}",
  "x-component": "CustomRequestAction",
  "x-action": "customize:form:request",
  "x-designer": "CustomRequestAction.Designer",
  "x-decorator": "CustomRequestAction.Decorator",
  "x-action-settings": {
    "onSuccess": {
      "manualClose": false,
      "redirecting": false,
      "successMessage": "{{t(\"Request success\")}}"
    }
  },
  "type": "void",
  "x-uid": "glc5zkr0ke3",
  "x-async": false,
  "x-index": 1
}
```