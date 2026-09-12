---
title: "ScanInput"
description: "ScanInput: Adicionar suporte a escaneamento em um input."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` é usado para adicionar suporte a escaneamento em um input.

## Uso básico

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Make the input read-only |
| `enableScan` | `boolean` | Reserved prop; the scan button is always rendered |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Formatos de QR code ou código de barras compatíveis |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Callback de alteração |

## Links relacionados

- [CodeScanner](./code-scanner)
