---
title: "TypedVariableInput"
description: "TypedVariableInput: Permitir que un campo acepte constantes y variables."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` sirve para permitir que un campo acepte constantes y variables.

## Uso básico

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `value` | `unknown` | Valor actual |
| `onChange` | `(next: unknown) => void` | Callback de cambio |
| `types` | `TypedConstantSpec[]` | Tipos de constante permitidos |
| `namespaces` | `string[]` | Namespaces superiores permitidos para variables |
| `extraNodes` | `MetaTreeNode[]` | Nodos de variable locales adicionales |
| `nullable` | `boolean` | Si se permite null |
| `delimiters` | `[string, string]` | Delimitadores de variable |
| `disabled` | `boolean` | Si está deshabilitado |
| `placeholder` | `string` | Texto de marcador |
| `style` | `React.CSSProperties` | Estilo personalizado |
| `className` | `string` | className personalizada |
