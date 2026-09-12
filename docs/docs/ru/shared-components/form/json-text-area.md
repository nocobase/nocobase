---
title: "JsonTextArea"
description: "JsonTextArea: Редактировать конфигурацию JSON / JSON5."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` используется, чтобы редактировать конфигурацию JSON / JSON5.

## Базовое использование

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value` | `unknown` | Текущее значение |
| `onChange` | `(value: unknown) => void` | Callback изменения |
| `space` | `number` | Stringify indentation |
| `json5` | `boolean` | Парсить ли через JSON5 |
| `showError` | `boolean` | Показывать ли ошибки парсинга |

## Связанные ссылки

- [VariableJsonTextArea](./variable-json-text-area)
