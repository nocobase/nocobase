:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/init-resource) voor nauwkeurige informatie.
:::

# ctx.initResource()

**Initialiseert** de resource voor de huidige context. Als `ctx.resource` nog niet bestaat, wordt er een aangemaakt van het opgegeven type en aan de context gekoppeld; als deze al bestaat, wordt deze direct gebruikt. Daarna is deze toegankelijk via `ctx.resource`.

## Toepassingsscenario's

Over het algemeen alleen gebruikt in **JSBlock** (onafhankelijk blok) scenario's. De meeste blokken, pop-ups en andere componenten hebben `ctx.resource` vooraf gekoppeld en vereisen geen handmatige aanroepen. JSBlock heeft standaard geen resource, dus u moet `ctx.initResource(type)` aanroepen voordat u gegevens laadt via `ctx.resource`.

## Type-definitie

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parameter | Type | Beschrijving |
|-----------|------|-------------|
| `type` | `string` | Resourcetype: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Retourwaarde**: De resource-instantie in de huidige context (d.w.z. `ctx.resource`).

## Verschil met ctx.makeResource()

| Methode | Gedrag |
|--------|----------|
| `ctx.initResource(type)` | Maakt aan en koppelt als `ctx.resource` niet bestaat; retourneert de bestaande als deze wel bestaat. Garandeert dat `ctx.resource` beschikbaar is. |
| `ctx.makeResource(type)` | Maakt alleen een nieuwe instantie aan en retourneert deze, maar schrijft **niet** naar `ctx.resource`. Geschikt voor scenario's die meerdere onafhankelijke resources of tijdelijk gebruik vereisen. |

## Voorbeelden

### Lijstgegevens (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Enkele record (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Specificeer primaire sleutel
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Gegevensbron specificeren

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Opmerkingen

- In de meeste blokscenario's (formulieren, tabellen, details, enz.) en pop-ups is `ctx.resource` al vooraf gekoppeld door de runtime-omgeving, waardoor het aanroepen van `ctx.initResource` onnodig is.
- Handmatige initialisatie is alleen vereist in contexten zoals JSBlock waar geen standaard resource is.
- Na initialisatie moet u `setResourceName(name)` aanroepen om de collectie te specificeren, en vervolgens `refresh()` aanroepen om de gegevens te laden.

## Gerelateerd

- [ctx.resource](./resource.md) — De resource-instantie in de huidige context
- [ctx.makeResource()](./make-resource.md) — Maakt een nieuwe resource-instantie aan zonder deze aan `ctx.resource` te koppelen
- [MultiRecordResource](../resource/multi-record-resource.md) — Meerdere records/Lijst
- [SingleRecordResource](../resource/single-record-resource.md) — Enkele record
- [APIResource](../resource/api-resource.md) — Algemene API-resource
- [SQLResource](../resource/sql-resource.md) — SQL-queryresource