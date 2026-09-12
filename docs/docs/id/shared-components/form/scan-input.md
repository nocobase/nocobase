---
title: "ScanInput"
description: "ScanInput: Menambahkan dukungan pemindaian ke input."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` digunakan untuk menambahkan dukungan pemindaian ke input.

## Penggunaan dasar

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Make the input read-only |
| `enableScan` | `boolean` | Reserved prop; the scan button is always rendered |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Format QR code atau barcode yang didukung |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Callback perubahan |

## Tautan terkait

- [CodeScanner](./code-scanner)
