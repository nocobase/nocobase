---
title: "SortableRow"
description: "SortableRow: Настроить перетаскиваемую строку antd Table."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` используется, чтобы настроить перетаскиваемую строку antd Table.

## Базовое использование

```tsx
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableRow } from '@nocobase/client-v2';
import { Table } from 'antd';

<DndContext>
  <SortableContext items={records.map((record) => record.id)}>
    <Table rowKey="id" components={{ body: { row: SortableRow } }} columns={columns} dataSource={records} />
  </SortableContext>
</DndContext>;
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `rowIndex` | `number` | Current row index |
| `className` | `string` | Пользовательский className |

## Связанные ссылки

- [Table](./)
- [SortHandle](./sort-handle)
