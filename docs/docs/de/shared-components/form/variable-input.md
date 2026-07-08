---
title: "VariableInput"
description: "VariableInput: Einzeilige Felder Variablen wie `{{ $env.X }}` dient dazu: und `{{ $user.name }}` akzeptieren lassen."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` dient dazu: einzeilige Felder Variablen wie `{{ $env.X }}` und `{{ $user.name }}` akzeptieren lassen.

## Grundlegende Verwendung

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value` | `string` | Aktueller Wert |
| `onChange` | `(value: string) => void` | Änderungs-Callback |
| `disabled` | `boolean` | Ob deaktiviert |
| `placeholder` | `string` | Platzhaltertext |
| `addonBefore` | `React.ReactNode` | Inhalt vor dem Eingabefeld |
| `namespaces` | `string[]` | Erlaubte Top-Level-Namespaces für Variablen |
| `extraNodes` | `MetaTreeNode[]` | Zusätzliche lokale Variablenknoten |
| `delimiters` | `[string, string]` | Variablen-Trennzeichen |
| `className` | `string` | Eigene className |
| `style` | `React.CSSProperties` | Eigener Stil |

## Verwandte Links

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
