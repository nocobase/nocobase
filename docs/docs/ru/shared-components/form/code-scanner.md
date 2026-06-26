---
title: "CodeScanner"
description: "CodeScanner: Управлять низкоуровневым полноэкранным сканером."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` используется, чтобы управлять низкоуровневым полноэкранным сканером.

## Базовое использование

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `visible` | `boolean` | Отображается ли сканер |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Поддерживаемые форматы QR-кодов и штрихкодов |
| `onClose` | `() => void` | Вызывается при закрытии сканера |
| `onScanSuccess` | `(result: string) => void` | Вызывается после успешного сканирования |

## Связанные ссылки

- [ScanInput](./scan-input)
