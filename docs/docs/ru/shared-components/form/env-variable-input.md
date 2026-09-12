---
title: "EnvVariableInput"
description: "EnvVariableInput: Разрешить только переменные окружения `$env`."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` используется, чтобы разрешить только переменные окружения `$env`.

## Базовое использование

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value` | `string` | Текущее значение |
| `onChange` | `(value: string) => void` | Callback изменения |
| `addonBefore` | `React.ReactNode` | Content before the input |
| `disabled` | `boolean` | Отключено ли поле |
| `password` | `boolean` | Mask plain non-variable values |
| `placeholder` | `string` | Placeholder text |

## Связанные ссылки

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
