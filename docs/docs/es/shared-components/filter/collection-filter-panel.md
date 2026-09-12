---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Incrustar un panel de filtro de Collection en una página."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` sirve para incrustar un panel de filtro de Collection en una página.

## Uso básico

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
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

## Métodos

| Método | Descripción |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Enlaces relacionados

- [CollectionFilter](./)
