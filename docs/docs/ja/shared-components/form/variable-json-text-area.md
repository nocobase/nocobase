---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: JSON / JSON5 設定に変数を挿入する."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` は、JSON / JSON5 設定に変数を挿入するためのコンポーネントです。

`VariableJsonTextArea` は [JsonTextArea](./json-text-area) を基にしています。

## 基本的な使い方

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `value` | `unknown` | 現在の値 |
| `onChange` | `(value: unknown) => void` | 値変更時のコールバック |
| `namespaces` | `string[]` | 選択できるトップレベル変数 namespace |
| `extraNodes` | `MetaTreeNode[]` | 追加のローカル変数ノード |
| `metaTree` | `MetaTreeNode[] | function` | カスタム変数ツリー |
| `delimiters` | `[string, string]` | 変数の区切り文字 |
| `formatPathToValue` | `(meta) => string | undefined` | カスタム変数パスフォーマッター |

## 関連リンク

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
