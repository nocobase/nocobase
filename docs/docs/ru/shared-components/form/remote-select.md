---
title: "RemoteSelect"
description: "RemoteSelect: Асинхронно загрузить опции Select из API."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` используется, чтобы асинхронно загрузить опции Select из API.

## Базовое использование

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

| Параметр | Тип | Описание |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Async request for loading options |
| `fieldNames` | `{ label; value }` | Map option label and value fields |
| `options` | `DefaultOptionType[]` | Static options |
| `mode` | `SelectProps['mode']` | Select mode |
| `showSearch` | `boolean` | Включен ли поиск |
| `filterOption` | `boolean | function` | Client-side option filtering |
