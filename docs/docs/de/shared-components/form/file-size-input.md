---
title: "FileSizeInput"
description: "FileSizeInput: Eine Dateigröße eingeben und als Bytes speichern."
keywords: "FileSizeInput,NocoBase,client-v2"
---

# FileSizeInput

`FileSizeInput` dient dazu: eine Dateigröße eingeben und als Bytes speichern.

## Grundlegende Verwendung

```tsx file="../_demos/file-size-input.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value` | `number` | Aktueller Wert |
| `onChange` | `(value: number | null) => void` | Änderungs-Callback |
| `disabled` | `boolean` | Ob deaktiviert |
| `min` | `number` | Minimalwert |
| `max` | `number` | Maximalwert |
