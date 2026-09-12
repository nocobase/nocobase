---
title: "RemoteSelect"
description: "RemoteSelect: Tải tùy chọn Select bất đồng bộ từ API."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` dùng để tải tùy chọn Select bất đồng bộ từ API.

## Cách dùng cơ bản

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

| Tham số | Kiểu | Mô tả |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Async request for loading options |
| `fieldNames` | `{ label; value }` | Map option label and value fields |
| `options` | `DefaultOptionType[]` | Static options |
| `mode` | `SelectProps['mode']` | Select mode |
| `showSearch` | `boolean` | Có bật tìm kiếm hay không |
| `filterOption` | `boolean | function` | Client-side option filtering |
