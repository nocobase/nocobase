:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/resource/multi-record-resource).
:::

# MultiRecordResource

En samlingsorienterad resurs: begäranden returnerar en array och stöder sidbrytning, filtrering, sortering samt CRUD-operationer. Den är lämplig för scenarier med "flera poster" såsom tabeller och listor. Till skillnad från [APIResource](./api-resource.md) anger MultiRecordResource resursnamnet via `setResourceName()`, konstruerar automatiskt URL:er som `users:list` och `users:create`, samt har inbyggda funktioner för sidbrytning, filtrering och radmarkering.

**Arv**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Skapande**: `ctx.makeResource('MultiRecordResource')` eller `ctx.initResource('MultiRecordResource')`. Innan användning måste ni anropa `setResourceName('samlingsnamn')` (t.ex. `'users'`); i RunJS injiceras `ctx.api` av körtidsmiljön.

---

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **Tabellblock** | Tabell- och listblock använder MultiRecordResource som standard och stöder sidbrytning, filtrering och sortering. |
| **JSBlock-listor** | Ladda data från samlingar som användare eller ordrar i ett JSBlock och utför anpassad rendering. |
| **Massåtgärder** | Använd `getSelectedRows()` för att hämta markerade rader och `destroySelectedRows()` för massradering. |
| **Associationsresurser** | Ladda associerade samlingar med format som `users.tags`, vilket kräver `setSourceId(parentRecordId)`. |

---

## Dataformat

- `getData()` returnerar en **array med poster**, vilket motsvarar fältet `data` i list-API-svaret.
- `getMeta()` returnerar metadata för sidbrytning med mera: `page`, `pageSize`, `count`, `totalPage`, etc.

---

## Resursnamn och datakälla

| Metod | Beskrivning |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Resursnamnet, t.ex. `'users'`, `'users.tags'` (associationsresurs). |
| `setSourceId(id)` / `getSourceId()` | Föräldrapostens ID för associationsresurser (t.ex. för `users.tags`, skicka med primärnyckeln för användaren). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifierare för datakälla (används i scenarier med flera datakällor). |

---

## Begärandeparametrar (Filter / Fält / Sortering)

| Metod | Beskrivning |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filtrera efter primärnyckel (för `get` av enstaka post, etc.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Filtervillkor, stöder operatorer som `$eq`, `$ne`, `$in`, etc. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Filtergrupper (för att kombinera flera villkor). |
| `setFields(fields)` / `getFields()` | Begärda fält (vitlista). |
| `setSort(sort)` / `getSort()` | Sortering, t.ex. `['-createdAt']` för fallande ordning efter skapad-tid. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Laddning av associationer (t.ex. `['user', 'tags']`). |

---

## Sidbrytning

| Metod | Beskrivning |
|------|------|
| `setPage(page)` / `getPage()` | Aktuell sida (börjar från 1). |
| `setPageSize(size)` / `getPageSize()` | Antal objekt per sida, standard är 20. |
| `getTotalPage()` | Totalt antal sidor. |
| `getCount()` | Totalt antal poster (från serverns meta). |
| `next()` / `previous()` / `goto(page)` | Byt sida och utlös `refresh`. |

---

## Markerade rader (tabellscenarier)

| Metod | Beskrivning |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Data för de rader som för närvarande är markerade, används för massradering och andra åtgärder. |

---

## CRUD och listoperationer

| Metod | Beskrivning |
|------|------|
| `refresh()` | Begär listan med aktuella parametrar, uppdaterar `getData()` och sidbrytnings-meta, samt utlöser händelsen `'refresh'`. |
| `get(filterByTk)` | Begär en enstaka post och returnerar den (skriver inte till `getData`). |
| `create(data, options?)` | Skapar en post. Valfritt `{ refresh: false }` förhindrar automatisk uppdatering. Utlöser `'saved'`. |
| `update(filterByTk, data, options?)` | Uppdaterar en post via dess primärnyckel. |
| `destroy(target)` | Raderar poster. `target` kan vara en primärnyckel, ett radobjekt eller en array av primärnycklar/radobjekt (massradering). |
| `destroySelectedRows()` | Raderar markerade rader (kastar ett fel om inga är markerade). |
| `setItem(index, item)` | Ersätter en specifik rad lokalt (initierar inte en begäran). |
| `runAction(actionName, options)` | Anropar valfri resursåtgärd (t.ex. anpassade åtgärder). |

---

## Konfiguration och händelser

| Metod | Beskrivning |
|------|------|
| `setRefreshAction(name)` | Åtgärden som anropas vid uppdatering, standard är `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Begärandekonfiguration för create/update. |
| `on('refresh', fn)` / `on('saved', fn)` | Utlöses efter att uppdatering slutförts eller efter sparande. |

---

## Exempel

### Grundläggande lista

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filtrering och sortering

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Laddning av associationer

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Skapa och sidbrytning

```js
await ctx.resource.create({ name: 'Erik Johansson', email: 'erik.johansson@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Massradera markerade rader

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Vänligen välj data först');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Raderad'));
```

### Lyssna på refresh-händelsen

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Associationsresurs (undertabell)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Meddelanden

- **setResourceName är obligatorisk**: Ni måste anropa `setResourceName('samlingsnamn')` före användning, annars kan begärandets URL inte konstrueras.
- **Associationsresurser**: När resursnamnet är i formatet `parent.child` (t.ex. `users.tags`), måste ni anropa `setSourceId(parentPrimaryKey)` först.
- **Refresh-debouncing**: Flera anrop till `refresh()` inom samma händelseloop kommer endast att köra det sista anropet för att undvika redundanta begäranden.
- **getData returnerar en array**: Den `data` som returneras av list-API:et är en array med poster, och `getData()` returnerar denna array direkt.

---

## Relaterat

- [ctx.resource](../context/resource.md) - Resursinstansen i det aktuella sammanhanget
- [ctx.initResource()](../context/init-resource.md) - Initialisera och binda till ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Skapa en ny resursinstans utan att binda den
- [APIResource](./api-resource.md) - Allmän API-resurs som anropas via URL
- [SingleRecordResource](./single-record-resource.md) - Orienterad mot en enstaka post