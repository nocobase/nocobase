---
title: "SortHandle"
description: "SortHandle: Tùy chỉnh cột tay nắm kéo của Table."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` dùng để tùy chỉnh cột tay nắm kéo của Table.

## Cách dùng cơ bản

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

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `id` | `string | number` | Reserved prop; not used for rendering |
| `style` | `React.CSSProperties` | Kiểu tùy chỉnh |

## Liên kết liên quan

- [Table](./)
- [SortableRow](./sortable-row)
