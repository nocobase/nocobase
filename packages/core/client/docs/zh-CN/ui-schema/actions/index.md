# 概览

## UI Schema 协议

- `x-action`
- `x-align`
- `x-acl-action`
- `x-acl-action-props`
- `x-action-settings`

## 常规操作

```json
{
  "type": "void",
  "title": "{{ t(\"Submit\") }}",
  "x-component": "Action",
  "x-component-props": {
    "type": "primary",
    "htmlType": "submit",
    "useProps": "{{ useCreateActionProps }}"
  },
}
```

## 弹窗操作

```json
{
  "type": "void",
  "title": "{{t('Open drawer')}}",
  "x-component": "Action",
  "x-component-props": {
    "openMode": "drawer",
    "type": "primary",
    "icon": "PlusOutlined"
  },
  "x-align": "right",
  "properties": {
    "drawer": {
      "type": "void",
      "x-component": "Action.Container",
      "x-component-props": {},
      "properties": {
      },
    }
  }
}
```

更多示例查看 [Action](/apis/action)