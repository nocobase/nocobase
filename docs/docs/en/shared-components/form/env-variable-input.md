---
title: "EnvVariableInput"
description: "EnvVariableInput: Allow only `$env` is used to environment variables."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` is used to allow only `$env` environment variables.

## Basic Usage

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `value` | `string` | Current value |
| `onChange` | `(value: string) => void` | Change callback |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `disabled` | `boolean` | Whether disabled |
| `password` | `boolean` | Mask plain non-variable values |
| `placeholder` | `string` | Placeholder text |

## Related Links

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
