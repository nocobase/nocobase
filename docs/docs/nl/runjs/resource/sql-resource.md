:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/resource/sql-resource) voor nauwkeurige informatie.
:::

# SQLResource

Een Resource voor het uitvoeren van query's op basis van **opgeslagen SQL-configuraties** of **dynamische SQL**, waarbij gegevens worden opgehaald via interfaces zoals `flowSql:run` / `flowSql:runById`. Dit is geschikt voor rapportages, statistieken, aangepaste SQL-lijsten en andere scenario's. In tegenstelling tot [MultiRecordResource](./multi-record-resource.md) is SQLResource niet afhankelijk van collecties; het voert SQL-query's rechtstreeks uit en ondersteunt paginering, parameterbinding, sjabloonvariabelen (`{{ctx.xxx}}`) en controle over het resultaattype.

**Overervingshiërarchie**: FlowResource → APIResource → BaseRecordResource → SQLResource.

**Aanmaakmethode**: `ctx.makeResource('SQLResource')` of `ctx.initResource('SQLResource')`. Gebruik `setFilterByTk(uid)` (de UID van het SQL-sjabloon) om uit te voeren op basis van een opgeslagen configuratie. Gebruik voor foutopsporing `setDebug(true)` + `setSQL(sql)` om SQL rechtstreeks uit te voeren. In RunJS wordt `ctx.api` geïnjecteerd door de runtime-omgeving.

---

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Rapportage / Statistieken** | Complexe aggregaties, query's over meerdere tabellen en aangepaste statistische meetwaarden. |
| **JSBlock aangepaste lijsten** | Implementatie van speciale filtering, sortering of associaties met behulp van SQL en aangepaste rendering. |
| **Grafiekblokken** | Het aansturen van gegevensbronnen voor grafieken met opgeslagen SQL-sjablonen, inclusief ondersteuning voor paginering. |
| **Keuze tussen SQLResource en ctx.sql** | Gebruik SQLResource wanneer paginering, gebeurtenissen of reactieve gegevens vereist zijn; gebruik `ctx.sql.run()` / `ctx.sql.runById()` voor eenvoudige eenmalige query's. |

---

## Gegevensformaat

- `getData()` retourneert verschillende formaten op basis van `setSQLType()`:
  - `selectRows` (standaard): **Array**, resultaten van meerdere rijen.
  - `selectRow`: **Enkel object**.
  - `selectVar`: **Scalaire waarde** (bijv. COUNT, SUM).
- `getMeta()` retourneert metagegevens zoals paginering: `page`, `pageSize`, `count`, `totalPage`, enz.

---

## SQL-configuratie en uitvoeringsmodi

| Methode | Beschrijving |
|------|------|
| `setFilterByTk(uid)` | Stelt de UID in van het uit te voeren SQL-sjabloon (komt overeen met `runById`; moet eerst in de beheerinterface zijn opgeslagen). |
| `setSQL(sql)` | Stelt de ruwe SQL in (alleen gebruikt voor `runBySQL` wanneer de debug-modus `setDebug(true)` is ingeschakeld). |
| `setSQLType(type)` | Resultaattype: `'selectVar'` / `'selectRow'` / `'selectRows'`. |
| `setDebug(enabled)` | Indien ingesteld op `true`, roept `refresh` de methode `runBySQL()` aan; anders wordt `runById()` aangeroepen. |
| `run()` | Roept `runBySQL()` of `runById()` aan op basis van de debug-status. |
| `runBySQL()` | Voert de SQL uit die is gedefinieerd in `setSQL` (vereist `setDebug(true)`). |
| `runById()` | Voert het opgeslagen SQL-sjabloon uit met de huidige UID. |

---

## Parameters en Context

| Methode | Beschrijving |
|------|------|
| `setBind(bind)` | Bindt variabelen. Gebruik een object voor `:name` placeholders of een array voor `?` placeholders. |
| `setLiquidContext(ctx)` | Sjablooncontext (Liquid), gebruikt om `{{ctx.xxx}}` te parsen. |
| `setFilter(filter)` | Aanvullende filtervoorwaarden (doorgegeven in de aanvraaggegevens). |
| `setDataSourceKey(key)` | Identificatie van de gegevensbron (gebruikt in omgevingen met meerdere gegevensbronnen). |

---

## Paginering

| Methode | Beschrijving |
|------|------|
| `setPage(page)` / `getPage()` | Huidige pagina (standaard is 1). |
| `setPageSize(size)` / `getPageSize()` | Aantal items per pagina (standaard is 20). |
| `next()` / `previous()` / `goto(page)` | Navigeert door pagina's en activeert `refresh`. |

In SQL kunt u `{{ctx.limit}}` en `{{ctx.offset}}` gebruiken om te verwijzen naar pagineringsparameters. SQLResource injecteert automatisch `limit` en `offset` in de context.

---

## Gegevens ophalen en gebeurtenissen

| Methode | Beschrijving |
|------|------|
| `refresh()` | Voert de SQL uit (`runById` of `runBySQL`), schrijft het resultaat naar `setData(data)`, werkt de meta bij en activeert de gebeurtenis `'refresh'`. |
| `runAction(actionName, options)` | Roept onderliggende acties aan (bijv. `getBind`, `run`, `runById`). |
| `on('refresh', fn)` / `on('loading', fn)` | Geactiveerd wanneer het verversen is voltooid of wanneer het laden begint. |

---

## Voorbeelden

### Uitvoeren via opgeslagen sjabloon (runById)

```js
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('active-users-report'); // UID van het opgeslagen SQL-sjabloon
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta(); // page, pageSize, count, enz.
```

### Debug-modus: SQL rechtstreeks uitvoeren (runBySQL)

```js
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE status = :status LIMIT {{ctx.limit}}');
res.setBind({ status: 'active' });
await res.refresh();
const data = res.getData();
```

### Paginering en navigatie

```js
ctx.resource.setFilterByTk('user-list-sql');
ctx.resource.setPageSize(20);
await ctx.resource.refresh();

// Navigatie
await ctx.resource.next();
await ctx.resource.previous();
await ctx.resource.goto(3);
```

### Resultaattypen

```js
// Meerdere rijen (standaard)
ctx.resource.setSQLType('selectRows');
const rows = ctx.resource.getData(); // [{...}, {...}]

// Enkele rij
ctx.resource.setSQLType('selectRow');
const row = ctx.resource.getData(); // {...}

// Enkele waarde (bijv. COUNT)
ctx.resource.setSQLType('selectVar');
const total = ctx.resource.getData(); // 42
```

### Sjabloonvariabelen gebruiken

```js
ctx.defineProperty('minId', { get: () => 10 });
const res = ctx.makeResource('SQLResource');
res.setDebug(true);
res.setSQL('SELECT * FROM users WHERE id > {{ctx.minId}} LIMIT {{ctx.limit}}');
await res.refresh();
```

### Luisteren naar de refresh-gebeurtenis

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<ul>{data?.map((r) => <li key={r.id}>{r.name}</li>)}</ul>);
});
await ctx.resource?.refresh?.();
```

---

## Opmerkingen

- **runById vereist dat het sjabloon eerst wordt opgeslagen**: De UID die wordt gebruikt in `setFilterByTk(uid)` moet een SQL-sjabloon-ID zijn die al in de beheerinterface is opgeslagen. U kunt dit opslaan via `ctx.sql.save({ uid, sql })`.
- **Debug-modus vereist machtigingen**: `setDebug(true)` maakt gebruik van `flowSql:run`, waarvoor de huidige rol machtigingen voor SQL-configuratie moet hebben. `runById` vereist alleen dat de gebruiker is ingelogd.
- **Refresh Debouncing**: Meerdere aanroepen naar `refresh()` binnen dezelfde event-loop zullen alleen de laatste uitvoeren om redundante aanvragen te voorkomen.
- **Parameterbinding ter voorkoming van injectie**: Gebruik `setBind()` met `:name` of `?` placeholders in plaats van tekenreeks-samenvoeging om SQL-injectie te voorkomen.

---

## Gerelateerd

- [ctx.sql](../context/sql.md) - SQL-uitvoering en beheer; `ctx.sql.runById` is geschikt voor eenvoudige eenmalige query's.
- [ctx.resource](../context/resource.md) - De resource-instantie in de huidige context.
- [ctx.initResource()](../context/init-resource.md) - Initialiseert en bindt aan `ctx.resource`.
- [ctx.makeResource()](../context/make-resource.md) - Maakt een nieuwe resource-instantie aan zonder binding.
- [APIResource](./api-resource.md) - Algemene API-resource.
- [MultiRecordResource](./multi-record-resource.md) - Ontworpen voor collecties en lijsten.