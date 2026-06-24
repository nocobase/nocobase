---
title: "SortHandle"
description: "SortHandle：Table 拖拽排序的拖拽手柄。"
keywords: "SortHandle,Table,拖拽排序,NocoBase"
---

# SortHandle

`SortHandle` 是 `Table` 拖拽排序的拖拽手柄。通常来说，直接给 [Table](./) 传 `isDraggable` 就够了；只有当你要自己控制手柄所在列时，才需要直接使用它。

## 基本用法

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

`SortHandle` 需要放在 `Table` 的可拖拽行上下文里。单独渲染它不会触发拖拽。

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string \| number` | 保留参数，当前不会参与渲染 |
| `style` | `React.CSSProperties` | 自定义样式 |

## 相关链接

- [Table](./) — 设置页表格
- [SortableRow](./sortable-row) — antd Table body row 的拖拽实现
