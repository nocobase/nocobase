---
title: "JsonTextArea"
description: "JsonTextArea: Editar configuração JSON / JSON5."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` é usado para editar configuração JSON / JSON5.

## Uso básico

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value` | `unknown` | Valor atual |
| `onChange` | `(value: unknown) => void` | Callback de alteração |
| `space` | `number` | Stringify indentation |
| `json5` | `boolean` | Se deve fazer parse com JSON5 |
| `showError` | `boolean` | Se deve mostrar erros de parse |

## Links relacionados

- [VariableJsonTextArea](./variable-json-text-area)
