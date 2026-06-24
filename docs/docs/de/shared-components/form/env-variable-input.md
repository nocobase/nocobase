---
title: "EnvVariableInput"
description: "EnvVariableInput: Nur `$env`-Umgebungsvariablen erlauben."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` dient dazu: nur `$env`-Umgebungsvariablen erlauben.

## Grundlegende Verwendung

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `value` | `string` | Aktueller Wert |
| `onChange` | `(value: string) => void` | Änderungs-Callback |
| `addonBefore` | `React.ReactNode` | Inhalt vor dem Eingabefeld |
| `disabled` | `boolean` | Ob deaktiviert |
| `password` | `boolean` | Maskiert einfache Nicht-Variablenwerte |
| `placeholder` | `string` | Platzhaltertext |

## Verwandte Links

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
