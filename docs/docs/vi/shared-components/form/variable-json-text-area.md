---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Chèn biến vào cấu hình JSON / JSON5."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` dùng để chèn biến vào cấu hình JSON / JSON5.

`VariableJsonTextArea` is based on [JsonTextArea](./json-text-area).

## Cách dùng cơ bản

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value` | `unknown` | Giá trị hiện tại |
| `onChange` | `(value: unknown) => void` | Callback khi thay đổi |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `metaTree` | `MetaTreeNode[] | function` | Cây biến tùy chỉnh |
| `delimiters` | `[string, string]` | Variable delimiters |
| `formatPathToValue` | `(meta) => string | undefined` | Bộ định dạng đường dẫn biến tùy chỉnh |

## Liên kết liên quan

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
