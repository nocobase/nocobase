---
title: "FileSizeInput"
description: "FileSizeInput: ファイルサイズを入力し、バイト数として保存する."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` は、ファイルサイズを入力し、バイト数として保存するためのコンポーネントです。

## 基本的な使い方

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `value` | `number` | 現在の値 |
| `onChange` | `(value: number | null) => void` | 値変更時のコールバック |
| `disabled` | `boolean` | 無効化するかどうか |
| `min` | `number` | 最小値 |
| `max` | `number` | 最大値 |
