---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Insertar variables en configuración JSON / JSON5."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` sirve para insertar variables en configuración JSON / JSON5.

`VariableJsonTextArea` se basa en [JsonTextArea](./json-text-area).

## Uso básico

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value` | `unknown` | Valor actual |
| `onChange` | `(value: unknown) => void` | Callback de cambio |
| `namespaces` | `string[]` | Namespaces superiores permitidos para variables |
| `extraNodes` | `MetaTreeNode[]` | Nodos de variable locales adicionales |
| `metaTree` | `MetaTreeNode[] | function` | Árbol de variables personalizado |
| `delimiters` | `[string, string]` | Delimitadores de variable |
| `formatPathToValue` | `(meta) => string | undefined` | Formateador personalizado de rutas de variable |

## Enlaces relacionados

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
