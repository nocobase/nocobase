---
title: "VariableInput"
description: "VariableInput: Permettre à un champ sur une ligne d’accepter des variables comme `{{ $env.X }}` sert à et `{{ $user.name }}`."
keywords: "VariableInput,NocoBase,client-v2"
---

# VariableInput

`VariableInput` sert à permettre à un champ sur une ligne d’accepter des variables comme `{{ $env.X }}` et `{{ $user.name }}`.

## Utilisation de base

```tsx file="../_demos/variable-input.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `value` | `string` | Valeur actuelle |
| `onChange` | `(value: string) => void` | Callback de changement |
| `disabled` | `boolean` | Indique si le composant est désactivé |
| `placeholder` | `string` | Texte du placeholder |
| `addonBefore` | `React.ReactNode` | Contenu avant le champ |
| `namespaces` | `string[]` | Namespaces racine autorisés pour les variables |
| `extraNodes` | `MetaTreeNode[]` | Nœuds de variables locaux supplémentaires |
| `delimiters` | `[string, string]` | Délimiteurs de variables |
| `className` | `string` | className personnalisée |
| `style` | `React.CSSProperties` | Style personnalisé |

## Liens associés

- [VariableTextArea](./variable-text-area)
- [EnvVariableInput](./env-variable-input)
- [TypedVariableInput](./typed-variable-input)
