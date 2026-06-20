---
title: "VariableInput"
description: "VariableInput: Permitir que um campo de linha única aceite variáveis como `{{ $env.X }}` é usado para e `{{ $user.name }}`."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` é usado para permitir que um campo de linha única aceite variáveis como `{{ $env.X }}` e `{{ $user.name }}`.

## Uso básico

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `value` | `string` | Valor atual |
| `onChange` | `(value: string) => void` | Callback de alteração |
| `disabled` | `boolean` | Se está desabilitado |
| `placeholder` | `string` | Placeholder text |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `className` | `string` | className personalizada |
| `style` | `React.CSSProperties` | Estilo personalizado |

## Links relacionados

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
