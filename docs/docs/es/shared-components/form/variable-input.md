---
title: "VariableInput"
description: "VariableInput: Permitir que un campo de una línea acepte variables como `{{ $env.X }}` sirve para y `{{ $user.name }}`."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` sirve para permitir que un campo de una línea acepte variables como `{{ $env.X }}` y `{{ $user.name }}`.

## Uso básico

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value` | `string` | Valor actual |
| `onChange` | `(value: string) => void` | Callback de cambio |
| `disabled` | `boolean` | Si está deshabilitado |
| `placeholder` | `string` | Texto de marcador |
| `addonBefore` | `React.ReactNode` | Contenido antes del input |
| `namespaces` | `string[]` | Namespaces superiores permitidos para variables |
| `extraNodes` | `MetaTreeNode[]` | Nodos de variable locales adicionales |
| `delimiters` | `[string, string]` | Delimitadores de variable |
| `className` | `string` | className personalizada |
| `style` | `React.CSSProperties` | Estilo personalizado |

## Enlaces relacionados

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
