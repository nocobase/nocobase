---
title: "VariableTextArea"
description: "VariableTextArea: Mehrzeiligen Text Variablen akzeptieren lassen."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` dient dazu: mehrzeiligen Text Variablen akzeptieren lassen.

## Grundlegende Verwendung

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value` | `string` | Aktueller Wert |
| `onChange` | `(value: string) => void` | Änderungs-Callback |
| `disabled` | `boolean` | Ob deaktiviert |
| `placeholder` | `string` | Platzhaltertext |
| `namespaces` | `string[]` | Erlaubte Top-Level-Namespaces für Variablen |
| `extraNodes` | `MetaTreeNode[]` | Zusätzliche lokale Variablenknoten |
| `delimiters` | `[string, string]` | Variablen-Trennzeichen |
| `rows` | `number` | Feste Zeilenanzahl |
| `maxRows` | `number` | Maximale Zeilenanzahl |

## Verwandte Links

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
