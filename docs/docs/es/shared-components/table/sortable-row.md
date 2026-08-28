---
title: "SortableRow"
description: "SortableRow: Personalizar la fila arrastrable de una antd Table."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` sirve para personalizar la fila arrastrable de una antd Table.

## Uso básico

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

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `rowIndex` | `number` | Índice de fila actual |
| `className` | `string` | className personalizada |

## Enlaces relacionados

- [Table](./)
- [SortHandle](./sort-handle)
