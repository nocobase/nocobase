---
title: "CollectionFilterPanel"
description: "CollectionFilterPanel: Embed a Collection filter panel in a page."
keywords: "CollectionFilterPanel,NocoBase,client-v2"
---

# CollectionFilterPanel

`CollectionFilterPanel` is used to embed a Collection filter panel in a page.

## Basic Usage

```tsx
import { CollectionFilterPanel, type CollectionFilterPanelRef } from '@nocobase/client-v2';

const ref = useRef<CollectionFilterPanelRef>(null);

<CollectionFilterPanel ref={ref} collection={collection} t={t} />;

const filter = ref.current?.getFilter();
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | Initial filter value |
| `onChange` | `(filter) => void` | Change callback |
| `t` | `(key, options?) => string` | Translation function |
| `filterableFieldNames` | `string[]` | Field allowlist |
| `nonfilterableFieldNames` | `string[]` | Field blocklist |
| `noIgnore` | `boolean` | Skip allowlist restrictions |

## Methods

| Method | Description |
| --- | --- |
| `getFilter()` | Get the compiled filter |
| `reset()` | Clear all conditions |

## Related Links

- [CollectionFilter](./)
