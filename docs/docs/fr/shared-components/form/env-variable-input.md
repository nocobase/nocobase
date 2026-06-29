---
title: "EnvVariableInput"
description: "EnvVariableInput: Autoriser uniquement les variables d’environnement `$env`."
keywords: "EnvVariableInput,NocoBase,client-v2"
---

# EnvVariableInput

`EnvVariableInput` sert à autoriser uniquement les variables d’environnement `$env`.

## Utilisation de base

```tsx file="../_demos/env-variable-input.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `value` | `string` | Valeur actuelle |
| `onChange` | `(value: string) => void` | Callback de changement |
| `addonBefore` | `React.ReactNode` | Contenu avant le champ |
| `disabled` | `boolean` | Indique si le composant est désactivé |
| `password` | `boolean` | Masque les valeurs littérales non variables |
| `placeholder` | `string` | Texte du placeholder |

## Liens associés

- [VariableInput](./variable-input)
- [TypedVariableInput](./typed-variable-input)
