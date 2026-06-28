---
title: "CodeScanner"
description: "CodeScanner: Controlar o scanner de tela cheia de baixo nível."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` é usado para controlar o scanner de tela cheia de baixo nível.

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

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `visible` | `boolean` | Se o scanner está visível |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Formatos de QR code ou código de barras compatíveis |
| `onClose` | `() => void` | Chamado quando o scanner fecha |
| `onScanSuccess` | `(result: string) => void` | Chamado após uma leitura bem-sucedida |

## Links relacionados

- [ScanInput](./scan-input)
