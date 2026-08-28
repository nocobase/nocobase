---
title: "SortHandle"
description: "SortHandle: Menyesuaikan kolom pegangan drag pada Table."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` digunakan untuk menyesuaikan kolom pegangan drag pada Table.

## Penggunaan dasar

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

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `id` | `string | number` | Reserved prop; not used for rendering |
| `style` | `React.CSSProperties` | Gaya kustom |

## Tautan terkait

- [Table](./)
- [SortableRow](./sortable-row)
