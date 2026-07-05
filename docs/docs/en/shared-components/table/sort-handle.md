---
title: "SortHandle"
description: "SortHandle: Customize the drag handle column of a Table."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` is used to customize the drag handle column of a Table.

## Basic Usage

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

| Prop | Type | Description |
| --- | --- | --- |
| `id` | `string | number` | Reserved prop; not used for rendering |
| `style` | `React.CSSProperties` | Custom style |

## Related Links

- [Table](./)
- [SortableRow](./sortable-row)
