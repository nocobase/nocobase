---
title: "CodeScanner"
description: "CodeScanner: Controlar el escáner de pantalla completa de bajo nivel."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` sirve para controlar el escáner de pantalla completa de bajo nivel.

## Uso básico

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `visible` | `boolean` | Si el escáner está visible |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Formatos de QR o código de barras admitidos |
| `onClose` | `() => void` | Se llama al cerrar el escáner |
| `onScanSuccess` | `(result: string) => void` | Se llama tras un escaneo correcto |

## Enlaces relacionados

- [ScanInput](./scan-input)
