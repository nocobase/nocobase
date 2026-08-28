---
title: "SortableRow"
description: "SortableRow: Personnaliser la ligne déplaçable d’une antd Table."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` sert à personnaliser la ligne déplaçable d’une antd Table.

## Utilisation de base

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

| Paramètre | Type | Description |
| --- | --- | --- |
| `rowIndex` | `number` | Index de ligne actuel |
| `className` | `string` | className personnalisée |

## Liens associés

- [Table](./)
- [SortHandle](./sort-handle)
