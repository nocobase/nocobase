---
title: "EnvVariableInput"
description: "EnvVariableInput: Chỉ cho phép biến môi trường `$env`."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` dùng để chỉ cho phép biến môi trường `$env`.

## Cách dùng cơ bản

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value` | `string` | Giá trị hiện tại |
| `onChange` | `(value: string) => void` | Callback khi thay đổi |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `disabled` | `boolean` | Có bị vô hiệu hóa hay không |
| `password` | `boolean` | Mask plain non-variable values |
| `placeholder` | `string` | Placeholder text |

## Liên kết liên quan

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
