---
title: "TypedVariableInput"
description: "TypedVariableInput: フィールドで定数と変数の両方を受け付ける."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` は、フィールドで定数と変数の両方を受け付けるためのコンポーネントです。

## 基本的な使い方

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `value` | `unknown` | 現在の値 |
| `onChange` | `(next: unknown) => void` | 値変更時のコールバック |
| `types` | `TypedConstantSpec[]` | 許可する定数型 |
| `namespaces` | `string[]` | 選択できるトップレベル変数 namespace |
| `extraNodes` | `MetaTreeNode[]` | 追加のローカル変数ノード |
| `nullable` | `boolean` | null を許可するかどうか |
| `delimiters` | `[string, string]` | 変数の区切り文字 |
| `disabled` | `boolean` | 無効化するかどうか |
| `placeholder` | `string` | プレースホルダー文字列 |
| `style` | `React.CSSProperties` | カスタムスタイル |
| `className` | `string` | カスタム className |
