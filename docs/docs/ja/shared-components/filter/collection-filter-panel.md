---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Collection フィルターパネルをページに埋め込む."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` は、Collection フィルターパネルをページに埋め込むためのコンポーネントです。

## 基本的な使い方

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `collection` | `Collection | undefined` | フィールドの取得元 Collection |
| `initialValue` | `Record<string, unknown>` | 初期 filter 値 |
| `onChange` | `(filter) => void` | 値変更時のコールバック |
| `t` | `(key, options?) => string` | 翻訳関数 |
| `filterableFieldNames` | `string[]` | フィールドの許可リスト |
| `nonfilterableFieldNames` | `string[]` | フィールドのブロックリスト |
| `noIgnore` | `boolean` | 許可リスト制限をスキップする |

## メソッド

| メソッド | 説明 |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## 関連リンク

- [CollectionFilter](./)
