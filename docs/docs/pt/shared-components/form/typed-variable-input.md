---
title: "TypedVariableInput"
description: "TypedVariableInput: Permitir que um campo aceite constantes e variáveis."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` é usado para permitir que um campo aceite constantes e variáveis.

## Uso básico

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value` | `unknown` | Valor atual |
| `onChange` | `(next: unknown) => void` | Callback de alteração |
| `types` | `TypedConstantSpec[]` | Allowed constant types |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `nullable` | `boolean` | Se null é permitido |
| `delimiters` | `[string, string]` | Variable delimiters |
| `disabled` | `boolean` | Se está desabilitado |
| `placeholder` | `string` | Placeholder text |
| `style` | `React.CSSProperties` | Estilo personalizado |
| `className` | `string` | className personalizada |
