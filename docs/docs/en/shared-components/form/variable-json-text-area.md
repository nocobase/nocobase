---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Insert variables into JSON / JSON5 configuration."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` is used to insert variables into JSON / JSON5 configuration.

`VariableJsonTextArea` is based on [JsonTextArea](./json-text-area).

## Basic Usage

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Current value |
| `onChange` | `(value: unknown) => void` | Change callback |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `metaTree` | `MetaTreeNode[] | function` | Custom variable tree |
| `delimiters` | `[string, string]` | Variable delimiters |
| `formatPathToValue` | `(meta) => string | undefined` | Custom variable path formatter |

## Related Links

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
