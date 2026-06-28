---
title: "SortHandle"
description: "SortHandle: Die Drag-Handle-Spalte einer Table anpassen."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` dient dazu: die Drag-Handle-Spalte einer Table anpassen.

## Grundlegende Verwendung

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

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `id` | `string | number` | Reservierter Parameter; wird nicht gerendert |
| `style` | `React.CSSProperties` | Eigener Stil |

## Verwandte Links

- [Table](./)
- [SortableRow](./sortable-row)
