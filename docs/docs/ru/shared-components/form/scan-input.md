---
title: "ScanInput"
description: "ScanInput: Добавить поддержку сканирования в поле ввода."
keywords: "ScanInput,NocoBase,client-v2"
---

# ScanInput

`ScanInput` используется, чтобы добавить поддержку сканирования в поле ввода.

## Базовое использование

```tsx file="../_demos/scan-input.tsx" preview
```

## API

| Параметр | Тип | Описание |
| --- | --- | --- |
| `disableManualInput` | `boolean` | Make the input read-only |
| `enableScan` | `boolean` | Reserved prop; the scan button is always rendered |
| `formatsToSupport` | `Html5QrcodeSupportedFormats[]` | Поддерживаемые форматы QR-кодов и штрихкодов |
| `onChange` | `(value: string | ChangeEvent<HTMLInputElement>) => void` | Callback изменения |

## Связанные ссылки

- [CodeScanner](./code-scanner)
