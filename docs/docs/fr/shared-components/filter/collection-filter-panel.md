---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Intégrer un panneau de filtre de Collection dans une page."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` sert à intégrer un panneau de filtre de Collection dans une page.

## Utilisation de base

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection utilisée comme source des champs |
| `initialValue` | `Record<string, unknown>` | Valeur initiale du filtre |
| `onChange` | `(filter) => void` | Callback de changement |
| `t` | `(key, options?) => string` | Fonction de traduction |
| `filterableFieldNames` | `string[]` | Liste autorisée de champs |
| `nonfilterableFieldNames` | `string[]` | Liste bloquée de champs |
| `noIgnore` | `boolean` | Ignorer les restrictions de liste autorisée |

## Méthodes

| Méthode | Description |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Liens associés

- [CollectionFilter](./)
