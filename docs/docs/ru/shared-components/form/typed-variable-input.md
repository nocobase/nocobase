---
title: "TypedVariableInput"
description: "TypedVariableInput: Разрешить полю принимать и константы, и переменные."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` используется, чтобы разрешить полю принимать и константы, и переменные.

## Базовое использование

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value` | `unknown` | Текущее значение |
| `onChange` | `(next: unknown) => void` | Callback изменения |
| `types` | `TypedConstantSpec[]` | Allowed constant types |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `nullable` | `boolean` | Разрешен ли null |
| `delimiters` | `[string, string]` | Variable delimiters |
| `disabled` | `boolean` | Отключено ли поле |
| `placeholder` | `string` | Placeholder text |
| `style` | `React.CSSProperties` | Пользовательский стиль |
| `className` | `string` | Пользовательский className |
