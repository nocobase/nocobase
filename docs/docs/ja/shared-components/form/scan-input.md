---
title: "ScanInput"
description: "ScanInput: 入力欄にスキャン機能を追加する."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` は、入力欄にスキャン機能を追加するためのコンポーネントです。

## 基本的な使い方

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `disableManualInput` | `boolean` | 入力欄を読み取り専用にする |
| `enableScan` | `boolean` | 予約パラメータ。スキャンボタンは常に表示される |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | 対応する QR コード / バーコード形式 |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | 値変更時のコールバック |

## 関連リンク

- [CodeScanner](./code-scanner)
