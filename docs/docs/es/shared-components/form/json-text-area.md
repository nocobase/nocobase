---
title: "JsonTextArea"
description: "JsonTextArea: Editar configuración JSON / JSON5."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` sirve para editar configuración JSON / JSON5.

## Uso básico

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value` | `unknown` | Valor actual |
| `onChange` | `(value: unknown) => void` | Callback de cambio |
| `space` | `number` | Indentación al serializar |
| `json5` | `boolean` | Si se analiza con JSON5 |
| `showError` | `boolean` | Si se muestran errores de análisis |

## Enlaces relacionados

- [VariableJsonTextArea](./variable-json-text-area)
