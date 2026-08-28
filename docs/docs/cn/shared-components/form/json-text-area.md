---
title: "JsonTextArea"
description: "JsonTextArea：编辑 JSON / JSON5 配置。"
keywords: "JsonTextArea,JSON,JSON5,NocoBase"
---

# JsonTextArea

`JsonTextArea` 用来编辑 JSON 配置。它的 `value` / `onChange` 处理的是 JS 值，不是字符串。编辑时会实时解析，blur 时会格式化并触发 `onChange`。

## 基本用法

```tsx file="../_demos/json-text-area.tsx" preview
```

在表单里使用：

```tsx
import { JsonTextArea } from '@nocobase/client-v2';

<Form.Item name="customConfig" label={t('Custom config')}>
  <JsonTextArea rows={6} json5 />
</Form.Item>;
```

## API

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `value` | `unknown` | - | JSON 对应的 JS 值 |
| `onChange` | `(value: unknown) => void` | - | blur 且解析成功后触发 |
| `space` | `number` | `2` | 序列化缩进 |
| `json5` | `boolean` | `false` | 是否使用 JSON5 解析 |
| `showError` | `boolean` | `true` | 是否显示解析错误 |

其他参数继承 Antd `Input.TextArea`。

## 相关链接

- [VariableJsonTextArea](./variable-json-text-area) — 需要在 JSON 里插入变量时使用
