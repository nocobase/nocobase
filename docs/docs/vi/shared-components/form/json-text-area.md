---
title: "JsonTextArea"
description: "JsonTextArea: Chỉnh sửa cấu hình JSON / JSON5."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` dùng để chỉnh sửa cấu hình JSON / JSON5.

## Cách dùng cơ bản

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value` | `unknown` | Giá trị hiện tại |
| `onChange` | `(value: unknown) => void` | Callback khi thay đổi |
| `space` | `number` | Stringify indentation |
| `json5` | `boolean` | Có parse bằng JSON5 hay không |
| `showError` | `boolean` | Có hiển thị lỗi parse hay không |

## Liên kết liên quan

- [VariableJsonTextArea](./variable-json-text-area)
