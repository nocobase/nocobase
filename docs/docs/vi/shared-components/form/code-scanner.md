---
title: "CodeScanner"
description: "CodeScanner: Điều khiển trình quét toàn màn hình cấp thấp."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` dùng để điều khiển trình quét toàn màn hình cấp thấp.

## Cách dùng cơ bản

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `visible` | `boolean` | Có hiển thị trình quét hay không |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Định dạng QR code hoặc barcode được hỗ trợ |
| `onClose` | `() => void` | Được gọi khi trình quét đóng |
| `onScanSuccess` | `(result: string) => void` | Được gọi sau khi quét thành công |

## Liên kết liên quan

- [ScanInput](./scan-input)
