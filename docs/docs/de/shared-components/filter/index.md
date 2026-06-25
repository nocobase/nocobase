---
title: "CollectionFilter"
description: "CollectionFilter: Eine Collection mit mehreren Bedingungen filtern."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` dient dazu: eine Collection mit mehreren Bedingungen filtern.

## Grundlegende Verwendung

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

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | Initialer Filterwert |
| `onChange` | `(filter) => void` | Änderungs-Callback |
| `t` | `(key, options?) => string` | Übersetzungsfunktion |
| `filterableFieldNames` | `string[]` | Feld-Whitelist |
| `nonfilterableFieldNames` | `string[]` | Feld-Blacklist |
| `noIgnore` | `boolean` | Whitelist-Beschränkung überspringen |
| `buttonText` | `React.ReactNode` | Eigener Button-Text |
| `showCount` | `boolean` | Ob die Anzahl der Bedingungen angezeigt wird |
| `popoverProps` | `PopoverProps` | Props für Antd Popover |
| `buttonProps` | `ButtonProps` | Props für Antd Button |
| `popoverMinWidth` | `number` | Mindestbreite des Popover-Inhalts |

## Verwandte Links

- [CollectionFilterPanel](./collection-filter-panel)
