---
title: "VariableTextArea"
description: "VariableTextArea：在多行文本中插入 NocoBase 变量。"
keywords: "VariableTextArea,变量输入,$env,$user,NocoBase"
---

# VariableTextArea

`VariableTextArea` 用来输入多行文本和变量表达式。变量会保留 `{{ ... }}` 字面，适合邮件正文、消息模板等长文本。

如果只需要单行输入，默认用 [VariableInput](./variable-input)。

## 基本用法

```tsx file="../_demos/variable-text-area.tsx" preview
```

```tsx
import { VariableTextArea } from '@nocobase/client-v2';

<Form.Item name="content" label={t('Content')}>
  <VariableTextArea namespaces={['$env', '$user']} rows={10} />
</Form.Item>;
```

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `string` | 当前值 |
| `onChange` | `(value: string) => void` | 值变化回调 |
| `disabled` | `boolean` | 是否禁用 |
| `placeholder` | `string` | 占位文字 |
| `namespaces` | `string[]` | 限定可选的顶层命名空间 |
| `extraNodes` | `MetaTreeNode[]` | 追加局部变量节点 |
| `delimiters` | `[string, string]` | 变量分隔符，默认 `['{{', '}}']` |
| `className` | `string` | 自定义 class |
| `style` | `React.CSSProperties` | 自定义样式 |
| `rows` | `number` | 固定行数 |
| `maxRows` | `number` | 最大行数 |

## 相关链接

- [VariableInput](./variable-input) — 单行变量输入
- [VariableJsonTextArea](./variable-json-text-area) — 在 JSON 配置里插入变量
