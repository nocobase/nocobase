---
title: "ScanInput"
description: "ScanInput: Thêm hỗ trợ quét vào ô nhập."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` dùng để thêm hỗ trợ quét vào ô nhập.

## Cách dùng cơ bản

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Make the input read-only |
| `enableScan` | `boolean` | Reserved prop; the scan button is always rendered |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Định dạng QR code hoặc barcode được hỗ trợ |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Callback khi thay đổi |

## Liên kết liên quan

- [CodeScanner](./code-scanner)
