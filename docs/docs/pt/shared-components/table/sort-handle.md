---
title: "SortHandle"
description: "SortHandle: Personalizar a coluna de alça de arraste de uma Table."
keywords: "SortHandle,NocoBase,client-v2"
---

# SortHandle

`SortHandle` é usado para personalizar a coluna de alça de arraste de uma Table.

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

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `id` | `string | number` | Reserved prop; not used for rendering |
| `style` | `React.CSSProperties` | Estilo personalizado |

## Links relacionados

- [Table](./)
- [SortableRow](./sortable-row)
