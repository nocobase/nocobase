---
title: "RemoteSelect"
description: "RemoteSelect: Memuat opsi Select secara asinkron dari API."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` digunakan untuk memuat opsi Select secara asinkron dari API.

## Penggunaan dasar

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

| Parameter | Tipe | Deskripsi |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Async request for loading options |
| `fieldNames` | `{ label; value }` | Map option label and value fields |
| `options` | `DefaultOptionType[]` | Static options |
| `mode` | `SelectProps['mode']` | Select mode |
| `showSearch` | `boolean` | Apakah pencarian diaktifkan |
| `filterOption` | `boolean | function` | Client-side option filtering |
