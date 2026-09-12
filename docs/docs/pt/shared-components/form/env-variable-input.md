---
title: "EnvVariableInput"
description: "EnvVariableInput: Permitir apenas variáveis de ambiente `$env`."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` é usado para permitir apenas variáveis de ambiente `$env`.

## Uso básico

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value` | `string` | Valor atual |
| `onChange` | `(value: string) => void` | Callback de alteração |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `disabled` | `boolean` | Se está desabilitado |
| `password` | `boolean` | Mask plain non-variable values |
| `placeholder` | `string` | Placeholder text |

## Links relacionados

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
