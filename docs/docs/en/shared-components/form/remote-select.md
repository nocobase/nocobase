---
title: "RemoteSelect"
description: "RemoteSelect: Load Select options asynchronously from an API."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` is used to load Select options asynchronously from an API.

## Basic Usage

```tsx
import { RemoteSelect } from '@nocobase/client-v2';

<RemoteSelect<{ name: string; title: string }>
  request={async () => {
    const { data } = await ctx.api.resource('providers').list();
    return data.data;
  }}
  fieldNames={{ label: 'title', value: 'name' }}
/>;
```

## API

| Prop | Type | Description |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Async request for loading options |
| `fieldNames` | `{ label; value }` | Map option label and value fields |
| `options` | `DefaultOptionType[]` | Static options |
| `mode` | `SelectProps['mode']` | Select mode |
| `showSearch` | `boolean` | Whether search is enabled |
| `filterOption` | `boolean | function` | Client-side option filtering |
