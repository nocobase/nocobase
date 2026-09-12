---
title: "CollectionFilter"
description: "CollectionFilter: Filtrer une Collection avec plusieurs conditions."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` sert à filtrer une Collection avec plusieurs conditions.

## Utilisation de base

```tsx
import { CollectionFilter } from '@nocobase/client-v2';

<CollectionFilter
  collection={collection}
  t={t}
  onChange={(filter) => {
    listRequest.run({ filter });
  }}
/>;
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | Valeur initiale du filtre |
| `onChange` | `(filter) => void` | Callback de changement |
| `t` | `(key, options?) => string` | Fonction de traduction |
| `filterableFieldNames` | `string[]` | Liste autorisée de champs |
| `nonfilterableFieldNames` | `string[]` | Liste bloquée de champs |
| `noIgnore` | `boolean` | Ignorer les restrictions de liste autorisée |
| `buttonText` | `React.ReactNode` | Texte personnalisé du bouton |
| `showCount` | `boolean` | Indique si le nombre de conditions est affiché |
| `popoverProps` | `PopoverProps` | Props transmises à Antd Popover |
| `buttonProps` | `ButtonProps` | Props transmises à Antd Button |
| `popoverMinWidth` | `number` | Largeur minimale du contenu du Popover |

## Liens associés

- [CollectionFilterPanel](./collection-filter-panel)
