---
title: "VariableInput"
description: "VariableInput: Разрешить однострочному полю принимать переменные вроде `{{ $env.X }}` используется, чтобы и `{{ $user.name }}`."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` используется, чтобы разрешить однострочному полю принимать переменные вроде `{{ $env.X }}` и `{{ $user.name }}`.

## Базовое использование

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value` | `string` | Текущее значение |
| `onChange` | `(value: string) => void` | Callback изменения |
| `disabled` | `boolean` | Отключено ли поле |
| `placeholder` | `string` | Placeholder text |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `className` | `string` | Пользовательский className |
| `style` | `React.CSSProperties` | Пользовательский стиль |

## Связанные ссылки

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
