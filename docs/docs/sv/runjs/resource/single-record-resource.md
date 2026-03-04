:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

En resurs inriktad på en **enskild post**: data är ett enskilt objekt som stöder hämtning via primärnyckel, skapande/uppdatering (save) och borttagning. Den är lämplig för scenarier med "enskilda poster" såsom detaljvyer och formulär. Till skillnad från [MultiRecordResource](./multi-record-resource.md) returnerar `getData()` i `SingleRecordResource` ett enskilt objekt. Ni anger primärnyckeln via `setFilterByTk(id)`, och `save()` anropar automatiskt `create` eller `update` baserat på tillståndet för `isNewRecord`.

**Arvshierarki**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Skapande**: `ctx.makeResource('SingleRecordResource')` eller `ctx.initResource('SingleRecordResource')`. Ni måste anropa `setResourceName('samlingsnamn')` före användning. Vid åtgärder via primärnyckel, anropa `setFilterByTk(id)`. I RunJS injiceras `ctx.api` av exekveringsmiljön.

---

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **Detaljblock** | Detaljblock använder `SingleRecordResource` som standard för att ladda en enskild post via dess primärnyckel. |
| **Formulärblock** | Formulär för att skapa/redigera använder `SingleRecordResource`, där `save()` automatiskt skiljer mellan `create` och `update`. |
| **JSBlock-detaljer** | Ladda en enskild användare, order etc. i ett JSBlock och anpassa visningen. |
| **Associerade resurser** | Ladda associerade enskilda poster med formatet `users.profile`, vilket kräver `setSourceId(överordnadPostID)`. |

---

## Dataformat

- `getData()` returnerar ett **enskilt postobjekt**, vilket motsvarar fältet `data` i get-gränssnittets svar.
- `getMeta()` returnerar元-information (om tillgänglig).

---

## Resursnamn och primärnyckel

| Metod | Beskrivning |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Resursnamn, t.ex. `'users'`, `'users.profile'` (associerad resurs). |
| `setSourceId(id)` / `getSourceId()` | ID för överordnad post vid associerade resurser (t.ex. kräver `users.profile` primärnyckeln för `users`-posten). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifierare för datakälla (används vid flera datakällor). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Primärnyckel för den aktuella posten; när denna har satts blir `isNewRecord` falskt. |

---

## Tillstånd

| Egenskap/Metod | Beskrivning |
|----------|------|
| `isNewRecord` | Huruvida den är i ett "nytt" tillstånd (sant om `filterByTk` inte är satt eller om den precis har skapats). |

---

## Begäransparametrar (Filter / Fält)

| Metod | Beskrivning |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filtrering (tillgänglig när det inte är en ny post). |
| `setFields(fields)` / `getFields()` | Begärda fält. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Laddning av relationer (appends). |

---

## CRUD

| Metod | Beskrivning |
|------|------|
| `refresh()` | Begär `get` baserat på nuvarande `filterByTk` och uppdaterar `getData()`; gör ingenting i "nytt" tillstånd. |
| `save(data, options?)` | Anropar `create` i "nytt" tillstånd, annars `update`; tillvalet `{ refresh: false }` förhindrar automatisk uppdatering. |
| `destroy(options?)` | Tar bort posten baserat på nuvarande `filterByTk` och rensar lokal data. |
| `runAction(actionName, options)` | Anropar valfri resursåtgärd (action). |

---

## Konfiguration och händelser

| Metod | Beskrivning |
|------|------|
| `setSaveActionOptions(options)` | Konfiguration för begäran vid `save`-åtgärden. |
| `on('refresh', fn)` / `on('saved', fn)` | Utlöses när uppdateringen är klar eller efter att ha sparat. |

---

## Exempel

### Grundläggande hämtning och uppdatering

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Uppdatera
await ctx.resource.save({ name: 'Erik Johansson' });
```

### Skapa ny post

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Anna Svensson', email: 'anna.svensson@example.com' });
```

### Ta bort post

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Efter destroy är getData() null
```

### Laddning av relationer och fält

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Associerade resurser (t.ex. users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Överordnad posts primärnyckel
res.setFilterByTk(profileId);    // filterByTk kan utelämnas om profile är en hasOne-relation
await res.refresh();
const profile = res.getData();
```

### Spara utan automatisk uppdatering

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// Efter sparande utlöses inte refresh, getData() behåller det gamla värdet
```

### Lyssna på refresh / saved-händelser

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Användare: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Sparandet lyckades');
});
await ctx.resource?.refresh?.();
```

---

## Observera

- **setResourceName är obligatorisk**: Ni måste anropa `setResourceName('samlingsnamn')` före användning, annars kan URL:en för begäran inte konstrueras.
- **filterByTk och isNewRecord**: Om `setFilterByTk` inte anropas är `isNewRecord` sant, och `refresh()` kommer inte att initiera en begäran; `save()` kommer att utföra en `create`-åtgärd.
- **Associerade resurser**: När resursnamnet är i formatet `parent.child` (t.ex. `users.profile`), måste ni först anropa `setSourceId(överordnadPrimärnyckel)`.
- **getData returnerar ett objekt**: Den `data` som returneras av gränssnitt för enskilda poster är ett postobjekt; `getData()` returnerar detta objekt direkt. Det blir `null` efter `destroy()`.

---

## Relaterat

- [ctx.resource](../context/resource.md) - Resursinstansen i den nuvarande kontexten
- [ctx.initResource()](../context/init-resource.md) - Initiera och binda till `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Skapa en ny resursinstans utan att binda den
- [APIResource](./api-resource.md) - Allmän API-resurs som anropas via URL
- [MultiRecordResource](./multi-record-resource.md) - Inriktad på samlingar/listor, stöder CRUD och paginering