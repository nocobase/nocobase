---
title: "VariableTextArea"
description: "VariableTextArea: Разрешить многострочному тексту принимать переменные."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` используется, чтобы разрешить многострочному тексту принимать переменные.

## Базовое использование

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value` | `string` | Текущее значение |
| `onChange` | `(value: string) => void` | Callback изменения |
| `disabled` | `boolean` | Отключено ли поле |
| `placeholder` | `string` | Placeholder text |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `delimiters` | `[string, string]` | Variable delimiters |
| `rows` | `number` | Fixed row count |
| `maxRows` | `number` | Maximum row count |

## Связанные ссылки

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
