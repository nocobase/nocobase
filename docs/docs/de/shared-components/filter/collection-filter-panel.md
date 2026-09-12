---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Ein Collection-Filterpanel in eine Seite einbetten."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` dient dazu: ein Collection-Filterpanel in eine Seite einbetten.

## Grundlegende Verwendung

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
```

## API

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection als Feldquelle |
| `initialValue` | `Record<string, unknown>` | Initialer Filterwert |
| `onChange` | `(filter) => void` | Änderungs-Callback |
| `t` | `(key, options?) => string` | Übersetzungsfunktion |
| `filterableFieldNames` | `string[]` | Feld-Whitelist |
| `nonfilterableFieldNames` | `string[]` | Feld-Blacklist |
| `noIgnore` | `boolean` | Whitelist-Beschränkung überspringen |

## Methoden

| Methode | Beschreibung |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Verwandte Links

- [CollectionFilter](./)
