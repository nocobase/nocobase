:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/resource) voor nauwkeurige informatie.
:::

# ctx.resource

De **FlowResource**-instantie in de huidige context, gebruikt om gegevens te openen en te bewerken. In de meeste blokken (formulieren, tabellen, details, enz.) en pop-upscenario's is `ctx.resource` vooraf gekoppeld door de runtime-omgeving. In scenario's zoals JSBlock, waar standaard geen resource aanwezig is, moet u eerst [ctx.initResource()](./init-resource.md) aanroepen om deze te initialiseren voordat u deze via `ctx.resource` kunt gebruiken.

## Toepassingsscenario's

`ctx.resource` kan worden gebruikt in elk RunJS-scenario waarin toegang tot gestructureerde gegevens (lijsten, enkele records, aangepaste API's, SQL) vereist is. Formulieren, tabellen, detailblokken en pop-ups zijn doorgaans vooraf gekoppeld. Voor JSBlock, JSField, JSItem, JSColumn, enz., kunt u, indien het laden van gegevens vereist is, eerst `ctx.initResource(type)` aanroepen en vervolgens `ctx.resource` gebruiken.

## Type-definitie

```ts
resource: FlowResource | undefined;
```

- In contexten met voorafgaande koppeling is `ctx.resource` de bijbehorende resource-instantie.
- In scenario's zoals JSBlock waar standaard geen resource is, is deze `undefined` totdat `ctx.initResource(type)` wordt aangeroepen.

## Veelvoorkomende methoden

De methoden die door verschillende resourcetypen (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) worden aangeboden, variëren enigszins. Hieronder staan de universele of veelgebruikte methoden:

| Methode | Beschrijving |
|------|------|
| `getData()` | Huidige gegevens ophalen (lijst of enkele record) |
| `setData(value)` | Lokale gegevens instellen |
| `refresh()` | Een verzoek starten met de huidige parameters om gegevens te vernieuwen |
| `setResourceName(name)` | Resourcenaam instellen (bijv. `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Primaire sleutelfilter instellen (voor enkele record `get`, enz.) |
| `runAction(actionName, options)` | Een willekeurige resource-actie aanroepen (bijv. `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Abonneren op/afmelden voor gebeurtenissen (bijv. `refresh`, `saved`) |

**Specifiek voor MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, enz.

## Voorbeelden

### Lijstgegevens (vereist eerst initResource)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Tabelscenario (vooraf gekoppeld)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Verwijderd'));
```

### Enkele record

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Een aangepaste actie aanroepen

```js
await ctx.resource.runAction('create', { data: { name: 'Jan Jansen' } });
```

## Relatie met ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Als `ctx.resource` niet bestaat, wordt er een gemaakt en gekoppeld; als deze al bestaat, wordt de bestaande instantie geretourneerd. Dit garandeert dat `ctx.resource` beschikbaar is.
- **ctx.makeResource(type)**: Maakt een nieuwe resource-instantie aan en retourneert deze, maar schrijft deze **niet** naar `ctx.resource`. Dit is geschikt voor scenario's die meerdere onafhankelijke resources of tijdelijk gebruik vereisen.
- **ctx.resource**: Geeft toegang tot de resource die al aan de huidige context is gekoppeld. De meeste blokken/pop-ups zijn vooraf gekoppeld; anders is het `undefined` en is `ctx.initResource` vereist.

## Opmerkingen

- Het wordt aanbevolen om voor gebruik een controle op null-waarden uit te voeren: `ctx.resource?.refresh()`, vooral in scenario's zoals JSBlock waar voorafgaande koppeling mogelijk niet bestaat.
- Na initialisatie moet u `setResourceName(name)` aanroepen om de collectie te specificeren voordat u gegevens laadt via `refresh()`.
- Zie de onderstaande links voor de volledige API van elk resourcetype.

## Gerelateerd

- [ctx.initResource()](./init-resource.md) - Initialiseer en koppel een resource aan de huidige context
- [ctx.makeResource()](./make-resource.md) - Maak een nieuwe resource-instantie aan zonder deze aan `ctx.resource` te koppelen
- [MultiRecordResource](../resource/multi-record-resource.md) - Meerdere records/Lijsten
- [SingleRecordResource](../resource/single-record-resource.md) - Enkele record
- [APIResource](../resource/api-resource.md) - Algemene API-resource
- [SQLResource](../resource/sql-resource.md) - SQL-queryresource