---
title: "FileSizeInput"
description: "FileSizeInput: Ввести размер файла и сохранить его в байтах."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` используется, чтобы ввести размер файла и сохранить его в байтах.

## Базовое использование

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `value` | `number` | Текущее значение |
| `onChange` | `(value: number | null) => void` | Callback изменения |
| `disabled` | `boolean` | Отключено ли поле |
| `min` | `number` | Minimum value |
| `max` | `number` | Maximum value |
