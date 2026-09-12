---
title: "SortHandle"
description: "SortHandle: Table のドラッグハンドル列をカスタマイズする."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` は、Table のドラッグハンドル列をカスタマイズするためのコンポーネントです。

## 基本的な使い方

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

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `id` | `string | number` | 予約パラメータ。描画には使われない |
| `style` | `React.CSSProperties` | カスタムスタイル |

## 関連リンク

- [Table](./)
- [SortableRow](./sortable-row)
