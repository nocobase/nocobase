---
title: "Table"
description: "Table: Hiển thị danh sách, chọn hàng và sắp xếp kéo thả trong trang thiết lập."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` dùng để hiển thị danh sách, chọn hàng và sắp xếp kéo thả trong trang thiết lập.



## Cách dùng cơ bản

```tsx file="../_demos/table.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Định danh hàng bắt buộc |
| `showIndex` | `boolean` | Hiển thị chỉ số hàng trước khi chọn |
| `isDraggable` | `boolean` | Có bật sắp xếp kéo thả hay không |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Được gọi sau khi sắp xếp kéo thả kết thúc |
| `showSortHandle` | `boolean` | Có hiển thị tay nắm kéo mặc định hay không |
| `sortHandleColumnWidth` | `number` | Độ rộng cột tay nắm kéo tự động |

## Export đi kèm

| Mô tả | Mô tả |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Liên kết liên quan

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
