---
title: "VariableInput"
description: "VariableInput: 単一行フィールドで `{{ $env.X }}` は、や `{{ $userためのコンポーネントです。name }}` のような変数を使えるようにする."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` は、単一行フィールドで `{{ $env.X }}` や `{{ $user.name }}` のような変数を使えるようにするためのコンポーネントです。

## 基本的な使い方

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `value` | `string` | 現在の値 |
| `onChange` | `(value: string) => void` | 値変更時のコールバック |
| `disabled` | `boolean` | 無効化するかどうか |
| `placeholder` | `string` | プレースホルダー文字列 |
| `addonBefore` | `React.ReactNode` | 入力欄の前に表示する内容 |
| `namespaces` | `string[]` | 選択できるトップレベル変数 namespace |
| `extraNodes` | `MetaTreeNode[]` | 追加のローカル変数ノード |
| `delimiters` | `[string, string]` | 変数の区切り文字 |
| `className` | `string` | カスタム className |
| `style` | `React.CSSProperties` | カスタムスタイル |

## 関連リンク

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
