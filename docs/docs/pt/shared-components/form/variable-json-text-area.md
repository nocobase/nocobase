---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Inserir variáveis em configuração JSON / JSON5."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` é usado para inserir variáveis em configuração JSON / JSON5.

`VariableJsonTextArea` is based on [JsonTextArea](./json-text-area).

## Uso básico

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value` | `unknown` | Valor atual |
| `onChange` | `(value: unknown) => void` | Callback de alteração |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `metaTree` | `MetaTreeNode[] | function` | Árvore de variáveis personalizada |
| `delimiters` | `[string, string]` | Variable delimiters |
| `formatPathToValue` | `(meta) => string | undefined` | Formatador personalizado de caminho de variável |

## Links relacionados

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
