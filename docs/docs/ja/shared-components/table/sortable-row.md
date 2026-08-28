---
title: "SortableRow"
description: "SortableRow: antd Table のドラッグ可能な行をカスタマイズする."
keywords: "SortableRow,NocoBase,client-v2"
---

# SortableRow

`SortableRow` は、antd Table のドラッグ可能な行をカスタマイズするためのコンポーネントです。

## 基本的な使い方

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

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `rowIndex` | `number` | 現在の行インデックス |
| `className` | `string` | カスタム className |

## 関連リンク

- [Table](./)
- [SortHandle](./sort-handle)
