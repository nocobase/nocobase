---
title: "SortableRow"
description: "SortableRow：antd Table body row 的拖拽实现。"
keywords: "SortableRow,Table,拖拽排序,NocoBase"
---

# SortableRow

`SortableRow` 是 antd Table `components.body.row` 的拖拽实现。它会读取 antd 注入到行上的 `data-row-key`，并为行内的 [SortHandle](./sort-handle) 提供拖拽上下文。

通常来说，不需要直接使用它。[Table](./) 开启 `isDraggable` 后会自动配置。

## 基本用法

```tsx
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { SortableRow } from '@nocobase/client-v2';
import { Table } from 'antd';

<DndContext>
  <SortableContext items={records.map((record) => record.id)}>
    <Table
      rowKey="id"
      components={{ body: { row: SortableRow } }}
      columns={columns}
      dataSource={records}
    />
  </SortableContext>
</DndContext>;
```

## API

`SortableRow` 会接收 antd Table body row 透传的属性，通常不需要手动传参数。

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `rowIndex` | `number` | 当前行索引 |
| `className` | `string` | 行 className |

## 相关链接

- [Table](./) — 设置页表格
- [SortHandle](./sort-handle) — 自定义拖拽手柄列
