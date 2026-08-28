---
title: "Table"
description: "Table: Exibir listas, selecionar linhas e ordenar por arraste em páginas de configuração."
keywords: "Table,NocoBase,client-v2"
---

# Table

`Table` é usado para exibir listas, selecionar linhas e ordenar por arraste em páginas de configuração.



## Uso básico

```tsx file="../_demos/table.tsx" preview
```

## API

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `rowKey` | `string | (record, index) => React.Key` | Identidade obrigatória da linha |
| `showIndex` | `boolean` | Mostrar índice da linha antes da seleção |
| `isDraggable` | `boolean` | Se a ordenação por arraste está habilitada |
| `onSortEnd` | `(from, to) => void | Promise<void>` | Chamado após o fim da ordenação por arraste |
| `showSortHandle` | `boolean` | Se deve mostrar a alça de arraste padrão |
| `sortHandleColumnWidth` | `number` | Largura da coluna automática de alça de arraste |

## Exportações adicionais

| Descrição | Descrição |
| --- | --- |
| `DEFAULT_PAGE_SIZE` | `50` |
| `PAGE_SIZE_OPTIONS` | `[5, 10, 20, 50, 100, 200]` |

## Links relacionados

- [SortHandle](./sort-handle)
- [SortableRow](./sortable-row)
