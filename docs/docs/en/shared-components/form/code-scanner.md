---
title: "CodeScanner"
description: "CodeScanner: Control the low-level full-screen scanner."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` is used to control the low-level full-screen scanner.

## Basic Usage

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` | Whether the scanner is visible |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Supported QR code or barcode formats |
| `onClose` | `() => void` | Called when the scanner closes |
| `onScanSuccess` | `(result: string) => void` | Called after a successful scan |

## Related Links

- [ScanInput](./scan-input)
