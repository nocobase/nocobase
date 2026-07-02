---
title: "VariableInput"
description: "VariableInput: Let a single-line field accept variables such as `{{ $env.X }}` is used to and `{{ $user.name }}`."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` is used to let a single-line field accept variables such as `{{ $env.X }}` and `{{ $user.name }}`.

## Basic Usage

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | Current value |
| `onChange` | `(value: string) => void` | Change callback |
| `disabled` | `boolean` | Whether disabled |
| `placeholder` | `string` | Placeholder text |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `className` | `string` | Custom class name |
| `style` | `React.CSSProperties` | Custom style |

## Related Links

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
