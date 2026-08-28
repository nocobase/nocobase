---
title: "RemoteSelect"
description: "RemoteSelect: Charger les options d’un Select de façon asynchrone depuis une API."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` sert à charger les options d’un Select de façon asynchrone depuis une API.

## Utilisation de base

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

| Paramètre | Type | Description |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Requête asynchrone pour charger les options |
| `fieldNames` | `{ label; value }` | Associe les champs label et value des options |
| `options` | `DefaultOptionType[]` | Options statiques |
| `mode` | `SelectProps['mode']` | Mode Select |
| `showSearch` | `boolean` | Indique si la recherche est activée |
| `filterOption` | `boolean | function` | Filtrage des options côté client |
