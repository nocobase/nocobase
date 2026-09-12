---
title: "CollectionFilter"
description: "CollectionFilter: 複数条件で Collection をフィルターする."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` は、複数条件で Collection をフィルターするためのコンポーネントです。

## 基本的な使い方

```tsx
import { CollectionFilter } from '@nocobase/client-v2';

<CollectionFilter
  collection={collection}
  t={t}
  onChange={(filter) => {
    listRequest.run({ filter });
  }}
/>;
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | 初期 filter 値 |
| `onChange` | `(filter) => void` | 値変更時のコールバック |
| `t` | `(key, options?) => string` | 翻訳関数 |
| `filterableFieldNames` | `string[]` | フィールドの許可リスト |
| `nonfilterableFieldNames` | `string[]` | フィールドのブロックリスト |
| `noIgnore` | `boolean` | 許可リスト制限をスキップする |
| `buttonText` | `React.ReactNode` | カスタムボタン文言 |
| `showCount` | `boolean` | 条件数を表示するかどうか |
| `popoverProps` | `PopoverProps` | Antd Popover に渡す props |
| `buttonProps` | `ButtonProps` | Antd Button に渡す props |
| `popoverMinWidth` | `number` | Popover 内容の最小幅 |

## 関連リンク

- [CollectionFilterPanel](./collection-filter-panel)
