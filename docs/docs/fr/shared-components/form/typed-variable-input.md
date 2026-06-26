---
title: "TypedVariableInput"
description: "TypedVariableInput: Permettre à un champ d’accepter à la fois des constantes et des variables."
keywords: "TypedVariableInput,NocoBase,client-v2"
---

# TypedVariableInput

`TypedVariableInput` sert à permettre à un champ d’accepter à la fois des constantes et des variables.

## Utilisation de base

```tsx file="../_demos/typed-variable-input.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `value` | `unknown` | Valeur actuelle |
| `onChange` | `(next: unknown) => void` | Callback de changement |
| `types` | `TypedConstantSpec[]` | Types de constantes autorisés |
| `namespaces` | `string[]` | Namespaces racine autorisés pour les variables |
| `extraNodes` | `MetaTreeNode[]` | Nœuds de variables locaux supplémentaires |
| `nullable` | `boolean` | Indique si null est autorisé |
| `delimiters` | `[string, string]` | Délimiteurs de variables |
| `disabled` | `boolean` | Indique si le composant est désactivé |
| `placeholder` | `string` | Texte du placeholder |
| `style` | `React.CSSProperties` | Style personnalisé |
| `className` | `string` | className personnalisée |
