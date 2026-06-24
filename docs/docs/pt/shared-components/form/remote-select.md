---
title: "RemoteSelect"
description: "RemoteSelect: Carregar opções de Select de forma assíncrona a partir de uma API."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` é usado para carregar opções de Select de forma assíncrona a partir de uma API.

## Uso básico

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

| Parâmetro | Tipo | Descrição |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Async request for loading options |
| `fieldNames` | `{ label; value }` | Map option label and value fields |
| `options` | `DefaultOptionType[]` | Static options |
| `mode` | `SelectProps['mode']` | Select mode |
| `showSearch` | `boolean` | Se a busca está habilitada |
| `filterOption` | `boolean | function` | Client-side option filtering |
