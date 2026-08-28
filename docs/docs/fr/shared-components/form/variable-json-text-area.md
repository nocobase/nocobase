---
title: "VariableJsonTextArea"
description: "VariableJsonTextArea: Insérer des variables dans une configuration JSON / JSON5."
keywords: "VariableJsonTextArea,NocoBase,client-v2"
---

# VariableJsonTextArea

`VariableJsonTextArea` sert à insérer des variables dans une configuration JSON / JSON5.

`VariableJsonTextArea` s’appuie sur [JsonTextArea](./json-text-area).

## Utilisation de base

```tsx file="../_demos/variable-json-text-area.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Valeur actuelle |
| `onChange` | `(value: unknown) => void` | Callback de changement |
| `namespaces` | `string[]` | Namespaces racine autorisés pour les variables |
| `extraNodes` | `MetaTreeNode[]` | Nœuds de variables locaux supplémentaires |
| `metaTree` | `MetaTreeNode[] | function` | Arbre de variables personnalisé |
| `delimiters` | `[string, string]` | Délimiteurs de variables |
| `formatPathToValue` | `(meta) => string | undefined` | Formateur personnalisé de chemin de variable |

## Liens associés

- [JsonTextArea](./json-text-area)
- [VariableInput](./variable-input)
