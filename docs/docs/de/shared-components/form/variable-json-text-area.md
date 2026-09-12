---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Variablen in JSON- / JSON5-Konfiguration einfügen."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` dient dazu: variablen in JSON- / JSON5-Konfiguration einfügen.

`VariableJsonTextArea` basiert auf [JsonTextArea](./json-text-area).

## Grundlegende Verwendung

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value` | `unknown` | Aktueller Wert |
| `onChange` | `(value: unknown) => void` | Änderungs-Callback |
| `namespaces` | `string[]` | Erlaubte Top-Level-Namespaces für Variablen |
| `extraNodes` | `MetaTreeNode[]` | Zusätzliche lokale Variablenknoten |
| `metaTree` | `MetaTreeNode[] | function` | Eigener Variablenbaum |
| `delimiters` | `[string, string]` | Variablen-Trennzeichen |
| `formatPathToValue` | `(meta) => string | undefined` | Eigene Formatierung für Variablenpfade |

## Verwandte Links

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
