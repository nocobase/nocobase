---
title: "RemoteSelect"
description: "RemoteSelect: Select-Optionen asynchron über eine API laden."
keywords: "RemoteSelect,NocoBase,client-v2"
---

# RemoteSelect

`RemoteSelect` dient dazu: select-Optionen asynchron über eine API laden.

## Grundlegende Verwendung

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

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `request` | `() => Promise<T[]>` | Asynchrone Anfrage zum Laden der Optionen |
| `fieldNames` | `{ label; value }` | Option-Felder für Label und Wert zuordnen |
| `options` | `DefaultOptionType[]` | Statische Optionen |
| `mode` | `SelectProps['mode']` | Select-Modus |
| `showSearch` | `boolean` | Ob Suche aktiviert ist |
| `filterOption` | `boolean | function` | Clientseitiges Filtern der Optionen |
