---
title: "VariableTextArea"
description: "VariableTextArea: Permitir variables en texto multilínea."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` sirve para permitir variables en texto multilínea.

## Uso básico

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value` | `string` | Valor actual |
| `onChange` | `(value: string) => void` | Callback de cambio |
| `disabled` | `boolean` | Si está deshabilitado |
| `placeholder` | `string` | Texto de marcador |
| `namespaces` | `string[]` | Namespaces superiores permitidos para variables |
| `extraNodes` | `MetaTreeNode[]` | Nodos de variable locales adicionales |
| `delimiters` | `[string, string]` | Delimitadores de variable |
| `rows` | `number` | Número fijo de filas |
| `maxRows` | `number` | Número máximo de filas |

## Enlaces relacionados

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
