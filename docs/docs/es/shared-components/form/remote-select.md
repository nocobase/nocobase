---
title: "RemoteSelect"
description: "RemoteSelect: Cargar opciones de Select de forma asíncrona desde una API."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` sirve para cargar opciones de Select de forma asíncrona desde una API.

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

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Petición asíncrona para cargar opciones |
| `fieldNames` | `{ label; value }` | Mapea los campos de etiqueta y valor de las opciones |
| `options` | `DefaultOptionType[]` | Opciones estáticas |
| `mode` | `SelectProps['mode']` | Modo Select |
| `showSearch` | `boolean` | Si la búsqueda está habilitada |
| `filterOption` | `boolean | function` | Filtrado de opciones en cliente |
