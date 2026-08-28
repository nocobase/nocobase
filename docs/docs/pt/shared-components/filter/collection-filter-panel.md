---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Incorporar um painel de filtro de Collection em uma página."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` é usado para incorporar um painel de filtro de Collection em uma página.

## Uso básico

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
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

## Métodos

| Método | Descrição |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Links relacionados

- [CollectionFilter](./)
