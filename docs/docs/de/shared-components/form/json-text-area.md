---
title: "JsonTextArea"
description: "JsonTextArea: JSON- / JSON5-Konfiguration bearbeiten."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` dient dazu: jSON- / JSON5-Konfiguration bearbeiten.

## Grundlegende Verwendung

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value` | `unknown` | Aktueller Wert |
| `onChange` | `(value: unknown) => void` | Änderungs-Callback |
| `space` | `number` | Einrückung beim Serialisieren |
| `json5` | `boolean` | Ob mit JSON5 geparst wird |
| `showError` | `boolean` | Ob Parse-Fehler angezeigt werden |

## Verwandte Links

- [VariableJsonTextArea](./variable-json-text-area)
