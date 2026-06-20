---
title: "Table"
description: "Table: Mostrar listas, seleccionar filas y ordenar por arrastre en páginas de configuración."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` sirve para mostrar listas, seleccionar filas y ordenar por arrastre en páginas de configuración.



## Uso básico

```tsx file="../_demos/table.tsx" preview
```

## API

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Identidad de fila obligatoria |
| `showIndex` | `boolean` | Mostrar índice de fila antes de la selección |
| `isDraggable` | `boolean` | Si la ordenación por arrastre está habilitada |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Se llama al finalizar la ordenación por arrastre |
| `showSortHandle` | `boolean` | Si se muestra el asa de arrastre predeterminada |
| `sortHandleColumnWidth` | `number` | Ancho de la columna automática del asa de arrastre |

## Exportaciones adicionales

| Descripción | Descripción |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Enlaces relacionados

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
