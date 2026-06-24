---
title: "JsonTextArea"
description: "JsonTextArea: Edit JSON / JSON5 configuration."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` is used to edit JSON / JSON5 configuration.

## Basic Usage

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Current value |
| `onChange` | `(value: unknown) => void` | Change callback |
| `space` | `number` | Stringify indentation |
| `json5` | `boolean` | Whether to parse with JSON5 |
| `showError` | `boolean` | Whether to show parse errors |

## Related Links

- [VariableJsonTextArea](./variable-json-text-area)
