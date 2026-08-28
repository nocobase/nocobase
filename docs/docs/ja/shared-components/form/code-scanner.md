---
title: "CodeScanner"
description: "CodeScanner: 低レベルの全画面スキャナーを制御する."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` は、低レベルの全画面スキャナーを制御するためのコンポーネントです。

## 基本的な使い方

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| パラメータ | 型 | 説明 |
| --- | --- | --- |
| `visible` | `boolean` | スキャナーを表示するかどうか |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | 対応する QR コード / バーコード形式 |
| `onClose` | `() => void` | スキャナーを閉じるときに呼ばれる |
| `onScanSuccess` | `(result: string) => void` | スキャン成功後に呼ばれる |

## 関連リンク

- [ScanInput](./scan-input)
