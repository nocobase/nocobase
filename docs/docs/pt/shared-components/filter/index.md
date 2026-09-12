---
title: "CollectionFilter"
description: "CollectionFilter: Filtrar uma Collection com múltiplas condições."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` é usado para filtrar uma Collection com múltiplas condições.

## Uso básico

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

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | Valor inicial do filtro |
| `onChange` | `(filter) => void` | Callback de alteração |
| `t` | `(key, options?) => string` | Função de tradução |
| `filterableFieldNames` | `string[]` | Lista de campos permitidos |
| `nonfilterableFieldNames` | `string[]` | Lista de campos bloqueados |
| `noIgnore` | `boolean` | Ignorar restrições da lista de permitidos |
| `buttonText` | `React.ReactNode` | Texto personalizado do botão |
| `showCount` | `boolean` | Se deve mostrar o número de condições |
| `popoverProps` | `PopoverProps` | Props passadas para Antd Popover |
| `buttonProps` | `ButtonProps` | Props passadas para Antd Button |
| `popoverMinWidth` | `number` | Largura mínima do conteúdo do Popover |

## Links relacionados

- [CollectionFilterPanel](./collection-filter-panel)
