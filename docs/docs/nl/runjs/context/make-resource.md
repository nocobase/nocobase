:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/make-resource) voor nauwkeurige informatie.
:::

# ctx.makeResource()

**Maakt** een nieuwe resource-instantie aan en retourneert deze, **zonder** `ctx.resource` te overschrijven of te wijzigen. Dit is geschikt voor scenario's waarin u meerdere onafhankelijke resources nodig heeft of voor tijdelijk gebruik.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Meerdere resources** | Tegelijkertijd meerdere gegevensbronnen laden (bijv. gebruikerslijst + orderlijst), waarbij elke bron een onafhankelijke resource gebruikt. |
| **Tijdelijke zoekopdrachten** | Eenmalige zoekopdrachten die na gebruik worden weggegooid, zonder dat ze aan `ctx.resource` gekoppeld hoeven te worden. |
| **Aanvullende gegevens** | Gebruik `ctx.resource` voor primaire gegevens en `makeResource` om instanties voor aanvullende gegevens aan te maken. |

Als u slechts één resource nodig heeft en deze wilt koppelen aan `ctx.resource`, is het gebruik van [ctx.initResource()](./init-resource.md) geschikter.

## Type-definitie

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parameter | Type | Beschrijving |
|------|------|------|
| `resourceType` | `string` | Resourcetype: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Retourwaarde**: De nieuw aangemaakte resource-instantie.

## Verschil met ctx.initResource()

| Methode | Gedrag |
|------|------|
| `ctx.makeResource(type)` | Maakt alleen een nieuwe instantie aan en retourneert deze, zonder naar `ctx.resource` te schrijven. Kan meerdere keren worden aangeroepen om meerdere onafhankelijke resources te verkrijgen. |
| `ctx.initResource(type)` | Maakt aan en koppelt als `ctx.resource` niet bestaat; retourneert deze direct als deze al bestaat. Garandeert dat `ctx.resource` beschikbaar is. |

## Voorbeelden

### Enkele resource

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource behoudt de oorspronkelijke waarde (indien aanwezig)
```

### Meerdere resources

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Aantal gebruikers: {usersRes.getData().length}</p>
    <p>Aantal orders: {ordersRes.getData().length}</p>
  </div>
);
```

### Tijdelijke zoekopdracht

```ts
// Eenmalige zoekopdracht, vervuilt ctx.resource niet
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Belangrijke opmerkingen

- De nieuw aangemaakte resource moet `setResourceName(name)` aanroepen om de collectie te specificeren, en vervolgens de gegevens laden via `refresh()`.
- Elke resource-instantie is onafhankelijk en beïnvloedt andere niet; geschikt voor het parallel laden van meerdere gegevensbronnen.

## Gerelateerd

- [ctx.initResource()](./init-resource.md): Initialiseren en koppelen aan ctx.resource
- [ctx.resource](./resource.md): De resource-instantie in de huidige context
- [MultiRecordResource](../resource/multi-record-resource) — Meerdere records/Lijst
- [SingleRecordResource](../resource/single-record-resource) — Enkele record
- [APIResource](../resource/api-resource) — Algemene API-resource
- [SQLResource](../resource/sql-resource) — SQL-zoekopdrachtresource