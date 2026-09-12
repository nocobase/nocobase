---
title: "CodeScanner"
description: "CodeScanner: Den niedrigstufigen Vollbild-Scanner steuern."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` dient dazu: den niedrigstufigen Vollbild-Scanner steuern.

## Grundlegende Verwendung

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `visible` | `boolean` | Ob der Scanner sichtbar ist |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Unterstützte QR-Code- oder Barcode-Formate |
| `onClose` | `() => void` | Wird beim Schließen des Scanners aufgerufen |
| `onScanSuccess` | `(result: string) => void` | Wird nach erfolgreichem Scan aufgerufen |

## Verwandte Links

- [ScanInput](./scan-input)
