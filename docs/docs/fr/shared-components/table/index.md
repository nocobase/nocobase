---
title: "Table"
description: "Table: Afficher des listes, sélectionner des lignes et trier par glisser-déposer dans les pages de configuration."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` sert à afficher des listes, sélectionner des lignes et trier par glisser-déposer dans les pages de configuration.



## Utilisation de base

```tsx file="../_demos/table.tsx" preview
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Identité de ligne obligatoire |
| `showIndex` | `boolean` | Afficher l’index de ligne avant la sélection |
| `isDraggable` | `boolean` | Indique si le tri par glisser-déposer est activé |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Appelé à la fin du tri par glisser-déposer |
| `showSortHandle` | `boolean` | Indique si la poignée par défaut est affichée |
| `sortHandleColumnWidth` | `number` | Largeur de la colonne automatique de poignée |

## Exports associés

| Description | Description |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Liens associés

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
