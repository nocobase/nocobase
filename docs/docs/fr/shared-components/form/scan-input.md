---
title: "ScanInput"
description: "ScanInput: Ajouter la prise en charge du scan à un champ de saisie."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` sert à ajouter la prise en charge du scan à un champ de saisie.

## Utilisation de base

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Rendre le champ en lecture seule |
| `enableScan` | `boolean` | Paramètre réservé ; le bouton de scan est toujours rendu |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Formats de QR code ou code-barres pris en charge |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Callback de changement |

## Liens associés

- [CodeScanner](./code-scanner)
