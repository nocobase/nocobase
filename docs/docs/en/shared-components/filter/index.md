---
title: "CollectionFilter"
description: "CollectionFilter: Filter a Collection with multiple conditions."
keywords: "CollectionFilter,NocoBase,client-v2"
---

# CollectionFilter

`CollectionFilter` is used to filter a Collection with multiple conditions.

## Basic Usage

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

| Prop | Type | Description |
| --- | --- | --- |
| `collection` | `Collection | undefined` | Collection used as the field source |
| `initialValue` | `Record<string, unknown>` | Initial filter value |
| `onChange` | `(filter) => void` | Change callback |
| `t` | `(key, options?) => string` | Translation function |
| `filterableFieldNames` | `string[]` | Field allowlist |
| `nonfilterableFieldNames` | `string[]` | Field blocklist |
| `noIgnore` | `boolean` | Skip allowlist restrictions |
| `buttonText` | `React.ReactNode` | Custom button text |
| `showCount` | `boolean` | Whether to show the number of conditions |
| `popoverProps` | `PopoverProps` | Props passed to Antd Popover |
| `buttonProps` | `ButtonProps` | Props passed to Antd Button |
| `popoverMinWidth` | `number` | Minimum width of the Popover content |

## Related Links

- [CollectionFilterPanel](./collection-filter-panel)
