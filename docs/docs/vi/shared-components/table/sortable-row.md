---
title: "SortableRow"
description: "SortableRow: Tùy chỉnh hàng có thể kéo của antd Table."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` dùng để tùy chỉnh hàng có thể kéo của antd Table.

## Cách dùng cơ bản

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

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `rowIndex` | `number` | Current row index |
| `className` | `string` | className tùy chỉnh |

## Liên kết liên quan

- [Table](./)
- [SortHandle](./sort-handle)
