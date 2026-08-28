---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Вставлять переменные в конфигурацию JSON / JSON5."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` используется, чтобы вставлять переменные в конфигурацию JSON / JSON5.

`VariableJsonTextArea` is based on [JsonTextArea](./json-text-area).

## Базовое использование

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value` | `unknown` | Текущее значение |
| `onChange` | `(value: unknown) => void` | Callback изменения |
| `namespaces` | `string[]` | Allowed top-level variable namespaces |
| `extraNodes` | `MetaTreeNode[]` | Additional local variable nodes |
| `metaTree` | `MetaTreeNode[] | function` | Пользовательское дерево переменных |
| `delimiters` | `[string, string]` | Variable delimiters |
| `formatPathToValue` | `(meta) => string | undefined` | Пользовательский форматтер пути переменной |

## Связанные ссылки

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
