---
title: "TypedVariableInput"
description: "TypedVariableInput: Allow a field to accept both constants and variables."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` is used to allow a field to accept both constants and variables.

## Basic Usage

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Current value |
| `onChange` | `(next: unknown) => void` | Change callback |
| `types` | `TypedConstantSpec[]` | Allowed constant types |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `nullable` | `boolean` | Whether null is allowed |
| `delimiters` | `[string, string]` | Variable delimiters |
| `disabled` | `boolean` | Whether disabled |
| `placeholder` | `string` | Placeholder text |
| `style` | `React.CSSProperties` | Custom style |
| `className` | `string` | Custom class name |
