---
title: "EnvVariableInput"
description: "EnvVariableInput: `$env` は、環境変数だけを選択できるようにするためのコンポーネントです。"
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` は、`$env` 環境変数だけを選択できるようにするためのコンポーネントです。

## 基本的な使い方

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `value` | `string` | 現在の値 |
| `onChange` | `(value: string) => void` | 値変更時のコールバック |
| `addonBefore` | `React.ReactNode` | 入力欄の前に表示する内容 |
| `disabled` | `boolean` | 無効化するかどうか |
| `password` | `boolean` | 変数ではない通常値をマスクする |
| `placeholder` | `string` | プレースホルダー文字列 |

## 関連リンク

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
