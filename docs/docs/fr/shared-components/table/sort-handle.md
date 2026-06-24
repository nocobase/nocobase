---
title: "SortHandle"
description: "SortHandle: Personnaliser la colonne de poignée de déplacement d’une Table."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` sert à personnaliser la colonne de poignée de déplacement d’une Table.

## Utilisation de base

```tsx
import { SortHandle, Table } from '@nocobase/client-v2';

<Table
  rowKey="id"
  isDraggable
  showSortHandle={false}
  columns={[
    { key: 'sort', width: 40, render: () => <SortHandle /> },
    ...columns,
  ]}
/>;
```

## API

| Paramètre | Type | Description |
| --- | --- | --- |
| `id` | `string | number` | Paramètre réservé ; non utilisé pour le rendu |
| `style` | `React.CSSProperties` | Style personnalisé |

## Liens associés

- [Table](./)
- [SortableRow](./sortable-row)
