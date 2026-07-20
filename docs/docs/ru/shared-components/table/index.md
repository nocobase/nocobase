---
title: "Table"
description: "Table: Показывать списки, выбирать строки и сортировать перетаскиванием на страницах настроек."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` используется, чтобы показывать списки, выбирать строки и сортировать перетаскиванием на страницах настроек.



## Базовое использование

```tsx file="../_demos/table.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Обязательный идентификатор строки |
| `showIndex` | `boolean` | Показывать индекс строки перед выбором |
| `isDraggable` | `boolean` | Включена ли сортировка перетаскиванием |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Вызывается после завершения сортировки перетаскиванием |
| `showSortHandle` | `boolean` | Показывать ли стандартную ручку перетаскивания |
| `sortHandleColumnWidth` | `number` | Ширина автоматической колонки ручки перетаскивания |

## Дополнительные экспорты

| Описание | Описание |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Связанные ссылки

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
