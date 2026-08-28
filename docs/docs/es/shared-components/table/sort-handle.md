---
title: "SortHandle"
description: "SortHandle: Personalizar la columna de asa de arrastre de una Table."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` sirve para personalizar la columna de asa de arrastre de una Table.

## Uso básico

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

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `id` | `string | number` | Parámetro reservado; no se usa para renderizar |
| `style` | `React.CSSProperties` | Estilo personalizado |

## Enlaces relacionados

- [Table](./)
- [SortableRow](./sortable-row)
