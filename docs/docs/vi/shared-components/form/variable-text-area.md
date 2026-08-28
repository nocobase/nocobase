---
title: "VariableTextArea"
description: "VariableTextArea: Cho phép văn bản nhiều dòng nhận biến."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` dùng để cho phép văn bản nhiều dòng nhận biến.

## Cách dùng cơ bản

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value` | `string` | Giá trị hiện tại |
| `onChange` | `(value: string) => void` | Callback khi thay đổi |
| `disabled` | `boolean` | Có bị vô hiệu hóa hay không |
| `placeholder` | `string` | Placeholder text |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `rows` | `number` | Fixed row count |
| `maxRows` | `number` | Maximum row count |

## Liên kết liên quan

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
