---
title: "VariableTextArea"
description: "VariableTextArea: Let multi-line text accept variables."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` is used to let multi-line text accept variables.

## Basic Usage

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | Current value |
| `onChange` | `(value: string) => void` | Change callback |
| `disabled` | `boolean` | Whether disabled |
| `placeholder` | `string` | Placeholder text |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `rows` | `number` | Fixed row count |
| `maxRows` | `number` | Maximum row count |

## Related Links

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
