---
title: "SortableRow"
description: "SortableRow: Customize the draggable row of an antd Table."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` is used to customize the draggable row of an antd Table.

## Basic Usage

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

| Prop | Type | Description |
| --- | --- | --- |
| `rowIndex` | `number` | Current row index |
| `className` | `string` | Custom class name |

## Related Links

- [Table](./)
- [SortHandle](./sort-handle)
