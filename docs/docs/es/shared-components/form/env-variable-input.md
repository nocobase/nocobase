---
title: "EnvVariableInput"
description: "EnvVariableInput: Permitir solo variables de entorno `$env`."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` sirve para permitir solo variables de entorno `$env`.

## Uso básico

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value` | `string` | Valor actual |
| `onChange` | `(value: string) => void` | Callback de cambio |
| `addonBefore` | `React.ReactNode` | Contenido antes del input |
| `disabled` | `boolean` | Si está deshabilitado |
| `password` | `boolean` | Enmascara valores literales que no son variables |
| `placeholder` | `string` | Texto de marcador |

## Enlaces relacionados

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
