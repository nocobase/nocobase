---
title: "Table"
description: "Table：client-v2 设置页表格，支持行号 / checkbox 切换和拖拽排序。"
keywords: "Table,设置页表格,拖拽排序,rowSelection,NocoBase"
---

# Table

`Table` 是 `@nocobase/client-v2` 提供的设置页表格组件，基于 Antd `Table`。它额外处理了两类常见交互：

- 行号和 checkbox 在同一个选择列里切换
- 行拖拽排序

## 基本用法

```tsx file="../_demos/table.tsx" preview
```

## 拖拽排序

传 `isDraggable` 后，表格会显示拖拽手柄。拖拽结束时触发 `onSortEnd(from, to)`，组件不会直接修改 `dataSource`，需要你在回调里持久化排序并刷新列表。

```tsx
import { Table } from '@nocobase/client-v2';

<Table
  rowKey="id"
  columns={columns}
  dataSource={records}
  isDraggable
  onSortEnd={async (from, to) => {
    await ctx.api.resource('items').move({
      sourceId: from.id,
      targetId: to.id,
    });
    refresh();
  }}
/>;
```

## API

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `rowKey` | `string \| (record, index) => React.Key` | - | 必填，行身份、拖拽和选择都依赖它 |
| `showIndex` | `boolean` | `true` | 有 `rowSelection` 时，默认显示行号，hover 或选中时显示 checkbox |
| `isDraggable` | `boolean` | `false` | 是否开启拖拽排序 |
| `onSortEnd` | `(from, to) => void \| Promise<void>` | - | 拖拽结束回调 |
| `showSortHandle` | `boolean` | `true` | 是否显示默认拖拽手柄 |
| `sortHandleColumnWidth` | `number` | `40` | 没有 `rowSelection` 时，自动插入手柄列的宽度 |

其他参数继承 Antd `Table`。

## 附带导出

| 名称 | 说明 |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | 默认分页大小，值为 `50` |
| `PAGE_SIZE_OPTIONS` | 默认分页选项，值为 `[5, 10, 20, 50, 100, 200]` |

## 相关链接

- [SortHandle](./sort-handle) — 自定义拖拽手柄列
- [SortableRow](./sortable-row) — antd Table body row 的拖拽实现
