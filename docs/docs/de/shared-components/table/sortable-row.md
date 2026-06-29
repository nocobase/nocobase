---
title: "SortableRow"
description: "SortableRow: Die ziehbare Zeile einer antd Table anpassen."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` dient dazu: die ziehbare Zeile einer antd Table anpassen.

## Grundlegende Verwendung

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

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `rowIndex` | `number` | Aktueller Zeilenindex |
| `className` | `string` | Eigene className |

## Verwandte Links

- [Table](./)
- [SortHandle](./sort-handle)
