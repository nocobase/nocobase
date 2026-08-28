---
title: "SortHandle"
description: "SortHandle: Настроить колонку ручки перетаскивания Table."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` используется, чтобы настроить колонку ручки перетаскивания Table.

## Базовое использование

```tsx
import { SortHandle, Table } from '@nocobase/client-v2';

<Table
  rowKey="id"
  isDraggable
  showSortHandle={false}
  columns={[
    { key: 'sort', width: 40, render: () => <SortHandle /> },
    ...columns,
  ]}
/>;
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `id` | `string | number` | Reserved prop; not used for rendering |
| `style` | `React.CSSProperties` | Пользовательский стиль |

## Связанные ссылки

- [Table](./)
- [SortableRow](./sortable-row)
