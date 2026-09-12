---
title: "Table"
description: "Table: Display lists, select rows, and drag-sort rows on settings pages."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` is used to display lists, select rows, and drag-sort rows on settings pages.

It is based on Antd Table and adds row selection and drag sorting for settings pages.

## Basic Usage

```tsx file="../_demos/table.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Required row identity |
| `showIndex` | `boolean` | Show row index before selection |
| `isDraggable` | `boolean` | Whether drag sorting is enabled |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Called after drag sorting ends |
| `showSortHandle` | `boolean` | Whether to show the default drag handle |
| `sortHandleColumnWidth` | `number` | Width of the automatic drag-handle column |

## Attached exports

| Description | Description |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Related Links

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
