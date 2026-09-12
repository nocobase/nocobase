---
title: "VariableTextArea"
description: "VariableTextArea: 複数行テキストで変数を使えるようにする."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` は、複数行テキストで変数を使えるようにするためのコンポーネントです。

## 基本的な使い方

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `value` | `string` | 現在の値 |
| `onChange` | `(value: string) => void` | 値変更時のコールバック |
| `disabled` | `boolean` | 無効化するかどうか |
| `placeholder` | `string` | プレースホルダー文字列 |
| `namespaces` | `string[]` | 選択できるトップレベル変数 namespace |
| `extraNodes` | `MetaTreeNode[]` | 追加のローカル変数ノード |
| `delimiters` | `[string, string]` | 変数の区切り文字 |
| `rows` | `number` | 固定行数 |
| `maxRows` | `number` | 最大行数 |

## 関連リンク

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
