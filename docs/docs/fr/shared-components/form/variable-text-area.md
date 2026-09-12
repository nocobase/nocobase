---
title: "VariableTextArea"
description: "VariableTextArea: Permettre au texte multiligne d’accepter des variables."
keywords: "VariableTextArea,NocoBase,client-v2"
---

# VariableTextArea

`VariableTextArea` sert à permettre au texte multiligne d’accepter des variables.

## Utilisation de base

```tsx file="../_demos/variable-text-area.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `value` | `string` | Valeur actuelle |
| `onChange` | `(value: string) => void` | Callback de changement |
| `disabled` | `boolean` | Indique si le composant est désactivé |
| `placeholder` | `string` | Texte du placeholder |
| `namespaces` | `string[]` | Namespaces racine autorisés pour les variables |
| `extraNodes` | `MetaTreeNode[]` | Nœuds de variables locaux supplémentaires |
| `delimiters` | `[string, string]` | Délimiteurs de variables |
| `rows` | `number` | Nombre de lignes fixe |
| `maxRows` | `number` | Nombre maximal de lignes |

## Liens associés

- [VariableInput](./variable-input)
- [VariableJsonTextArea](./variable-json-text-area)
