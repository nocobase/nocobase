---
title: "JsonTextArea"
description: "JsonTextArea: Modifier une configuration JSON / JSON5."
keywords: "JsonTextArea,NocoBase,client-v2"
---

# JsonTextArea

`JsonTextArea` sert à modifier une configuration JSON / JSON5.

## Utilisation de base

```tsx file="../_demos/json-text-area.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Valeur actuelle |
| `onChange` | `(value: unknown) => void` | Callback de changement |
| `space` | `number` | Indentation de sérialisation |
| `json5` | `boolean` | Indique si JSON5 est utilisé pour le parsing |
| `showError` | `boolean` | Indique si les erreurs de parsing sont affichées |

## Liens associés

- [VariableJsonTextArea](./variable-json-text-area)
