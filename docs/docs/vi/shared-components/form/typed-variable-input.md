---
title: "TypedVariableInput"
description: "TypedVariableInput: Cho phép trường nhận cả hằng số và biến."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` dùng để cho phép trường nhận cả hằng số và biến.

## Cách dùng cơ bản

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `value` | `unknown` | Giá trị hiện tại |
| `onChange` | `(next: unknown) => void` | Callback khi thay đổi |
| `types` | `TypedConstantSpec[]` | Allowed constant types |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `nullable` | `boolean` | Có cho phép null hay không |
| `delimiters` | `[string, string]` | Variable delimiters |
| `disabled` | `boolean` | Có bị vô hiệu hóa hay không |
| `placeholder` | `string` | Placeholder text |
| `style` | `React.CSSProperties` | Kiểu tùy chỉnh |
| `className` | `string` | className tùy chỉnh |
