---
title: "CodeScanner"
description: "CodeScanner: Contrôler le scanner plein écran de bas niveau."
keywords: "CodeScanner,NocoBase,client-v2"
---

# CodeScanner

`CodeScanner` sert à contrôler le scanner plein écran de bas niveau.

## Utilisation de base

```tsx
import { CodeScanner } from '@nocobase/client-v2';

<CodeScanner
  visible={visible}
  onClose={() => setVisible(false)}
  onScanSuccess={(text) => setValue(text)}
/>;
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `visible` | `boolean` | Indique si le scanner est visible |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Formats de QR code ou code-barres pris en charge |
| `onClose` | `() => void` | Appelé à la fermeture du scanner |
| `onScanSuccess` | `(result: string) => void` | Appelé après un scan réussi |

## Liens associés

- [ScanInput](./scan-input)
