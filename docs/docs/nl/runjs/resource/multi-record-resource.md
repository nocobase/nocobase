:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/resource/multi-record-resource) voor nauwkeurige informatie.
:::

# MultiRecordResource

Een op collecties gerichte Resource: verzoeken retourneren een array en ondersteunen paginering, filtering, sortering en CRUD-bewerkingen. Het is geschikt voor scenario's met "meerdere records", zoals tabellen en lijsten. In tegenstelling tot [APIResource](./api-resource.md) specificeert MultiRecordResource de resourcenaam via `setResourceName()`, bouwt het automatisch URL's zoals `users:list` en `users:create`, en bevat het ingebouwde mogelijkheden voor paginering, filtering en rijselectie.

**Overervingsrelatie**: FlowResource → APIResource → BaseRecordResource → MultiRecordResource.

**Aanmaakmethode**: `ctx.makeResource('MultiRecordResource')` of `ctx.initResource('MultiRecordResource')`. Voor gebruik moet u `setResourceName('collectienaam')` aanroepen (bijv. `'users'`); in RunJS wordt `ctx.api` geïnjecteerd door de runtime-omgeving.

---

## Gebruiksscenario's

| Scenario | Beschrijving |
|------|------|
| **Tabelblokken** | Tabel- en lijstblokken gebruiken standaard MultiRecordResource en ondersteunen paginering, filtering en sortering. |
| **JSBlock-lijsten** | Gegevens uit collecties zoals gebruikers of bestellingen laden in een JSBlock en aangepaste rendering uitvoeren. |
| **Batchbewerkingen** | Gebruik `getSelectedRows()` om geselecteerde rijen op te halen en `destroySelectedRows()` voor batchverwijdering. |
| **Geassocieerde resources** | Geassocieerde collecties laden met formaten zoals `users.tags`, waarvoor `setSourceId(parentRecordId)` vereist is. |

---

## Gegevensformaat

- `getData()` retourneert een **array van records**, wat het veld `data` is uit het antwoord van de list-API.
- `getMeta()` retourneert paginering en andere metadata: `page`, `pageSize`, `count`, `totalPage`, enz.

---

## Resourcenaam en gegevensbron

| Methode | Beschrijving |
|------|------|
| `setResourceName(name)` / `getResourceName()` | De resourcenaam, bijv. `'users'`, `'users.tags'` (geassocieerde resource). |
| `setSourceId(id)` / `getSourceId()` | De ID van het bovenliggende record voor geassocieerde resources (bijv. voor `users.tags`, geef de primaire sleutel van de gebruiker door). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identificatie van de gegevensbron (gebruikt in scenario's met meerdere gegevensbronnen). |

---

## Verzoekparameters (Filter / Velden / Sortering)

| Methode | Beschrijving |
|------|------|
| `setFilterByTk(tk)` / `getFilterByTk()` | Filteren op primaire sleutel (voor `get` van een enkel record, enz.). |
| `setFilter(filter)` / `getFilter()` / `resetFilter()` | Filtervoorwaarden, ondersteunt operatoren zoals `$eq`, `$ne`, `$in`, enz. |
| `addFilterGroup(key, filter)` / `removeFilterGroup(key)` | Filtergroepen (voor het combineren van meerdere voorwaarden). |
| `setFields(fields)` / `getFields()` | Opgevraagde velden (whitelist). |
| `setSort(sort)` / `getSort()` | Sortering, bijv. `['-createdAt']` voor aflopende volgorde op aanmaaktijd. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Laden van associaties (bijv. `['user', 'tags']`). |

---

## Paginering

| Methode | Beschrijving |
|------|------|
| `setPage(page)` / `getPage()` | Huidige pagina (beginnend bij 1). |
| `setPageSize(size)` / `getPageSize()` | Aantal items per pagina, standaard is 20. |
| `getTotalPage()` | Totaal aantal pagina's. |
| `getCount()` | Totaal aantal records (vanuit de server-side meta). |
| `next()` / `previous()` / `goto(page)` | Pagina wijzigen en `refresh` activeren. |

---

## Geselecteerde rijen (Tabelscenario's)

| Methode | Beschrijving |
|------|------|
| `setSelectedRows(rows)` / `getSelectedRows()` | Gegevens van de momenteel geselecteerde rijen, gebruikt voor batchverwijdering en andere bewerkingen. |

---

## CRUD- en lijstbewerkingen

| Methode | Beschrijving |
|------|------|
| `refresh()` | Vraagt de lijst op met de huidige parameters, werkt `getData()` en paginerings-meta bij, en activeert de gebeurtenis `'refresh'`. |
| `get(filterByTk)` | Vraagt een enkel record op en retourneert dit (schrijft niet naar `getData`). |
| `create(data, options?)` | Maakt een record aan. Optioneel voorkomt `{ refresh: false }` automatische verversing. Activeert `'saved'`. |
| `update(filterByTk, data, options?)` | Werkt een record bij op basis van de primaire sleutel. |
| `destroy(target)` | Verwijdert records; `target` kan een primaire sleutel, een rij-object of een array van primaire sleutels/rij-objecten zijn (batchverwijdering). |
| `destroySelectedRows()` | Verwijdert de momenteel geselecteerde rijen (gooit een foutmelding als er geen zijn geselecteerd). |
| `setItem(index, item)` | Vervangt lokaal een specifieke rij met gegevens (start geen verzoek). |
| `runAction(actionName, options)` | Roept een willekeurige resource-actie aan (bijv. aangepaste acties). |

---

## Configuratie en gebeurtenissen

| Methode | Beschrijving |
|------|------|
| `setRefreshAction(name)` | De actie die wordt aangeroepen tijdens het verversen, standaard is `'list'`. |
| `setCreateActionOptions(options)` / `setUpdateActionOptions(options)` | Verzoekconfiguratie voor aanmaken/bijwerken. |
| `on('refresh', fn)` / `on('saved', fn)` | Geactiveerd na voltooiing van het verversen of na het opslaan. |

---

## Voorbeelden

### Basislijst

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();
const rows = ctx.resource.getData();
const total = ctx.resource.getCount();
```

### Filteren en sorteren

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilter({ status: 'active' });
ctx.resource.setSort(['-createdAt']);
ctx.resource.setFields(['id', 'nickname', 'email']);
await ctx.resource.refresh();
```

### Laden van associaties

```js
ctx.resource.setResourceName('orders');
ctx.resource.setAppends(['user', 'items']);
await ctx.resource.refresh();
const orders = ctx.resource.getData();
```

### Aanmaken en paginering

```js
await ctx.resource.create({ name: 'Jan Jansen', email: 'jan.jansen@example.com' });

await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Geselecteerde rijen batchgewijs verwijderen

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Selecteer eerst gegevens');
  return;
}
await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Verwijderd'));
```

### Luisteren naar de refresh-gebeurtenis

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

### Geassocieerde resource (subtabel)

```js
const res = ctx.makeResource('MultiRecordResource');
res.setResourceName('users.roles');
res.setSourceId(ctx.record?.id);
await res.refresh();
const roles = res.getData();
```

---

## Belangrijke opmerkingen

- **setResourceName is verplicht**: U moet `setResourceName('collectienaam')` aanroepen voor gebruik, anders kan de verzoek-URL niet worden opgebouwd.
- **Geassocieerde resources**: Wanneer de resourcenaam het formaat `parent.child` heeft (bijv. `users.tags`), moet u eerst `setSourceId(parentPrimaryKey)` aanroepen.
- **Refresh debouncing**: Meerdere aanroepen naar `refresh()` binnen dezelfde event loop zullen alleen de laatste uitvoeren om redundante verzoeken te voorkomen.
- **getData retourneert een array**: De `data` die door de list-API wordt geretourneerd is een array van records, en `getData()` retourneert deze array rechtstreeks.

---

## Gerelateerd

- [ctx.resource](../context/resource.md) - De resource-instantie in de huidige context
- [ctx.initResource()](../context/init-resource.md) - Initialiseren en binden aan ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Een nieuwe resource-instantie maken zonder te binden
- [APIResource](./api-resource.md) - Algemene API-resource opgevraagd via URL
- [SingleRecordResource](./single-record-resource.md) - Gericht op een enkel record