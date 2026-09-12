---
title: "JsonTextArea"
description: "JsonTextArea: JSON / JSON5 設定を編集する."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` は、JSON / JSON5 設定を編集するためのコンポーネントです。

## 基本的な使い方

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `value` | `unknown` | 現在の値 |
| `onChange` | `(value: unknown) => void` | 値変更時のコールバック |
| `space` | `number` | 文字列化するときのインデント |
| `json5` | `boolean` | JSON5 でパースするかどうか |
| `showError` | `boolean` | パースエラーを表示するかどうか |

## 関連リンク

- [VariableJsonTextArea](./variable-json-text-area)
