---
title: "ScanInput"
description: "ScanInput: Añadir soporte de escaneo a un input."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` sirve para añadir soporte de escaneo a un input.

## Uso básico

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Hacer que el input sea de solo lectura |
| `enableScan` | `boolean` | Parámetro reservado; el botón de escaneo siempre se renderiza |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Formatos de QR o código de barras admitidos |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Callback de cambio |

## Enlaces relacionados

- [CodeScanner](./code-scanner)
