:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/make-resource).
:::

# ctx.makeResource()

**Skapar** och returnerar en ny resursinstans **utan** att skriva till eller ändra `ctx.resource`. Den är lämplig för scenarier som kräver flera oberoende resurser eller tillfällig användning.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **Flera resurser** | Ladda flera datakällor samtidigt (t.ex. användarlista + orderlista), där varje använder en oberoende resurs. |
| **Tillfälliga frågor** | Engångsfrågor som kasseras efter användning, utan behov av att binda till `ctx.resource`. |
| **Hjälpdata** | Använd `ctx.resource` för primärdata och `makeResource` för att skapa instanser för ytterligare data. |

Om ni bara behöver en enstaka resurs och vill binda den till `ctx.resource`, är det mer lämpligt att använda [ctx.initResource()](./init-resource.md).

## Typdefinition

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parameter | Typ | Beskrivning |
|------|------|------|
| `resourceType` | `string` | Resurstyp: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Returvärde**: Den nyskapade resursinstansen.

## Skillnad från ctx.initResource()

| Metod | Beteende |
|------|------|
| `ctx.makeResource(type)` | Skapar och returnerar endast en ny instans, **utan** att skriva till `ctx.resource`. Kan anropas flera gånger för att erhålla flera oberoende resurser. |
| `ctx.initResource(type)` | Skapar och binder om `ctx.resource` inte existerar; returnerar den direkt om den redan finns. Säkerställer att `ctx.resource` är tillgänglig. |

## Exempel

### Enstaka resurs

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource behåller sitt ursprungliga värde (om sådant finns)
```

### Flera resurser

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Antal användare: {usersRes.getData().length}</p>
    <p>Antal ordrar: {ordersRes.getData().length}</p>
  </div>
);
```

### Tillfällig fråga

```ts
// Engångsfråga, förorenar inte ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Observera

- Den nyskapade resursen måste anropa `setResourceName(name)` för att ange en samling, och sedan ladda data via `refresh()`.
- Varje resursinstans är oberoende och påverkar inte andra; lämplig för att ladda flera datakällor parallellt.

## Relaterat

- [ctx.initResource()](./init-resource.md): Initiera och bind till `ctx.resource`
- [ctx.resource](./resource.md): Resursinstansen i den aktuella kontexten
- [MultiRecordResource](../resource/multi-record-resource) — Flera poster/Lista
- [SingleRecordResource](../resource/single-record-resource) — Enstaka post
- [APIResource](../resource/api-resource) — Allmän API-resurs
- [SQLResource](../resource/sql-resource) — SQL-frågeresurs