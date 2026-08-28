---
title: "CollectionFilter"
description: "CollectionFilter: Filtrar una Collection con varias condiciones."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` sirve para filtrar una Collection con varias condiciones.

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

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection usada como origen de campos |
| `initialValue` | `Record<string, unknown>` | Valor inicial del filtro |
| `onChange` | `(filter) => void` | Callback de cambio |
| `t` | `(key, options?) => string` | Función de traducción |
| `filterableFieldNames` | `string[]` | Lista permitida de campos |
| `nonfilterableFieldNames` | `string[]` | Lista bloqueada de campos |
| `noIgnore` | `boolean` | Omitir restricciones de lista permitida |
| `buttonText` | `React.ReactNode` | Texto personalizado del botón |
| `showCount` | `boolean` | Si se muestra el número de condiciones |
| `popoverProps` | `PopoverProps` | Props pasadas a Antd Popover |
| `buttonProps` | `ButtonProps` | Props pasadas a Antd Button |
| `popoverMinWidth` | `number` | Ancho mínimo del contenido del Popover |

## Enlaces relacionados

- [CollectionFilterPanel](./collection-filter-panel)
