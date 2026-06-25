---
title: "VariableTextArea"
description: "VariableTextArea: Permitir variáveis em texto multilinha."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` é usado para permitir variáveis em texto multilinha.

## Uso básico

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value` | `string` | Valor atual |
| `onChange` | `(value: string) => void` | Callback de alteração |
| `disabled` | `boolean` | Se está desabilitado |
| `placeholder` | `string` | Placeholder text |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `rows` | `number` | Fixed row count |
| `maxRows` | `number` | Maximum row count |

## Links relacionados

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
