---
title: "TypedVariableInput"
description: "TypedVariableInput: Einem Feld Konstanten und Variablen zugleich erlauben."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` dient dazu: einem Feld Konstanten und Variablen zugleich erlauben.

## Grundlegende Verwendung

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value` | `unknown` | Aktueller Wert |
| `onChange` | `(next: unknown) => void` | Änderungs-Callback |
| `types` | `TypedConstantSpec[]` | Erlaubte Konstantentypen |
| `namespaces` | `string[]` | Erlaubte Top-Level-Namespaces für Variablen |
| `extraNodes` | `MetaTreeNode[]` | Zusätzliche lokale Variablenknoten |
| `nullable` | `boolean` | Ob null erlaubt ist |
| `delimiters` | `[string, string]` | Variablen-Trennzeichen |
| `disabled` | `boolean` | Ob deaktiviert |
| `placeholder` | `string` | Platzhaltertext |
| `style` | `React.CSSProperties` | Eigener Stil |
| `className` | `string` | Eigene className |
