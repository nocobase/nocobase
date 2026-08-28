---
title: "ScanInput"
description: "ScanInput: Add scanning support to an input."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` is used to add scanning support to an input.

## Basic Usage

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Make the input read-only |
| `enableScan` | `boolean` | Reserved prop; the scan button is always rendered |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Supported QR code or barcode formats |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Change callback |

## Related Links

- [CodeScanner](./code-scanner)
