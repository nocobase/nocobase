---
title: "CodeScanner"
description: "CodeScanner: Mengontrol pemindai layar penuh tingkat rendah."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` digunakan untuk mengontrol pemindai layar penuh tingkat rendah.

## Penggunaan dasar

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `visible` | `boolean` | Apakah pemindai terlihat |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Format QR code atau barcode yang didukung |
| `onClose` | `() => void` | Dipanggil saat pemindai ditutup |
| `onScanSuccess` | `(result: string) => void` | Dipanggil setelah pemindaian berhasil |

## Tautan terkait

- [ScanInput](./scan-input)
