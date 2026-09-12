---
title: "VariableInput"
description: "VariableInput: Cho phép trường một dòng nhận biến như `{{ $env.X }}` dùng để và `{{ $user.name }}`."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` dùng để cho phép trường một dòng nhận biến như `{{ $env.X }}` và `{{ $user.name }}`.

## Cách dùng cơ bản

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value` | `string` | Giá trị hiện tại |
| `onChange` | `(value: string) => void` | Callback khi thay đổi |
| `disabled` | `boolean` | Có bị vô hiệu hóa hay không |
| `placeholder` | `string` | Placeholder text |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `className` | `string` | className tùy chỉnh |
| `style` | `React.CSSProperties` | Kiểu tùy chỉnh |

## Liên kết liên quan

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
