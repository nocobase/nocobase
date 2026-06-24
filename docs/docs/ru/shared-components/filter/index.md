---
title: "CollectionFilter"
description: "CollectionFilter: Фильтровать Collection по нескольким условиям."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` используется, чтобы фильтровать Collection по нескольким условиям.

## Базовое использование

```tsx
import { CollectionFilter } from '@nocobase/client-v2';

<CollectionFilter
  collection={collection}
  t={t}
  onChange={(filter) => {
    listRequest.run({ filter });
  }}
/>;
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | Начальное значение фильтра |
| `onChange` | `(filter) => void` | Callback изменения |
| `t` | `(key, options?) => string` | Функция перевода |
| `filterableFieldNames` | `string[]` | Список разрешенных полей |
| `nonfilterableFieldNames` | `string[]` | Список заблокированных полей |
| `noIgnore` | `boolean` | Пропустить ограничения списка разрешений |
| `buttonText` | `React.ReactNode` | Пользовательский текст кнопки |
| `showCount` | `boolean` | Показывать ли число условий |
| `popoverProps` | `PopoverProps` | Props, передаваемые в Antd Popover |
| `buttonProps` | `ButtonProps` | Props, передаваемые в Antd Button |
| `popoverMinWidth` | `number` | Минимальная ширина содержимого Popover |

## Связанные ссылки

- [CollectionFilterPanel](./collection-filter-panel)
