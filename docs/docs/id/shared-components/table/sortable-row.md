---
title: "SortableRow"
description: "SortableRow: Menyesuaikan baris drag pada antd Table."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` digunakan untuk menyesuaikan baris drag pada antd Table.

## Penggunaan dasar

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

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `rowIndex` | `number` | Current row index |
| `className` | `string` | className kustom |

## Tautan terkait

- [Table](./)
- [SortHandle](./sort-handle)
