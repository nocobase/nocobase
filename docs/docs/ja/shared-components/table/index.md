---
title: "Table"
description: "Table: 設定ページで一覧表示、行選択、ドラッグソートを行う."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` は、設定ページで一覧表示、行選択、ドラッグソートを行うためのコンポーネントです。



## 基本的な使い方

```tsx file="../_demos/table.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | 必須の行識別子 |
| `showIndex` | `boolean` | 選択前に行番号を表示する |
| `isDraggable` | `boolean` | ドラッグソートを有効にするかどうか |
| `onSortEnd` | `(from, to) => void | Promise<void>` | ドラッグソート終了後に呼ばれる |
| `showSortHandle` | `boolean` | デフォルトのドラッグハンドルを表示するかどうか |
| `sortHandleColumnWidth` | `number` | 自動ドラッグハンドル列の幅 |

## 付随するエクスポート

| 説明 | 説明 |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## 関連リンク

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
