---
title: "ScanInput"
description: "ScanInput: Ein Eingabefeld um Scan-Unterstützung erweitern."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` dient dazu: ein Eingabefeld um Scan-Unterstützung erweitern.

## Grundlegende Verwendung

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Eingabefeld schreibgeschützt machen |
| `enableScan` | `boolean` | Reservierter Parameter; der Scan-Button wird immer gerendert |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Unterstützte QR-Code- oder Barcode-Formate |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Änderungs-Callback |

## Verwandte Links

- [CodeScanner](./code-scanner)
