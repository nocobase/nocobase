---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Встроить панель фильтра Collection в страницу."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` используется, чтобы встроить панель фильтра Collection в страницу.

## Базовое использование

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
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

## Методы

| Метод | Описание |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Связанные ссылки

- [CollectionFilter](./)
