:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/resource).
:::

# ctx.resource

**FlowResource**-instansen i den aktuella kontexten, som används för att komma åt och hantera data. I de flesta block (formulär, tabeller, detaljer, etc.) och popup-scenarier binder körtidsmiljön i förväg `ctx.resource`. I scenarier som JSBlock, där det inte finns någon resurs som standard, måste ni först anropa [ctx.initResource()](./init-resource.md) för att initiera den innan ni använder den via `ctx.resource`.

## Tillämpliga scenarier

`ctx.resource` kan användas i alla RunJS-scenarier som kräver åtkomst till strukturerad data (listor, enskilda poster, anpassade API:er, SQL). Formulär-, tabell-, detaljblock och popup-fönster är vanligtvis förbundna i förväg. För JSBlock, JSField, JSItem, JSColumn, etc., om dataladdning krävs, kan ni först anropa `ctx.initResource(type)` och sedan använda `ctx.resource`.

## Typdefinition

```ts
resource: FlowResource | undefined;
```

- I kontexter med förbindning är `ctx.resource` den motsvarande resursinstansen.
- I scenarier som JSBlock, där det inte finns någon resurs som standard, är den `undefined` tills `ctx.initResource(type)` anropas.

## Vanliga metoder

Metoder som exponeras av olika resurstyper (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) varierar något. Nedan visas de universella eller vanligaste metoderna:

| Metod | Beskrivning |
|------|------|
| `getData()` | Hämta aktuell data (lista eller enskild post) |
| `setData(value)` | Ställ in lokal data |
| `refresh()` | Initiera en begäran med aktuella parametrar för att uppdatera data |
| `setResourceName(name)` | Ange resursnamn (t.ex. `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Ange primärnyckelfilter (för enskild post `get`, etc.) |
| `runAction(actionName, options)` | Anropa valfri resursåtgärd (t.ex. `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Prenumerera/avbryt prenumeration på händelser (t.ex. `refresh`, `saved`) |

**Specifikt för MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, etc.

## Exempel

### Listdata (kräver initResource först)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Tabellscenario (förbundet i förväg)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Borttagen'));
```

### Enskild post

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Anropa en anpassad åtgärd

```js
await ctx.resource.runAction('create', { data: { name: 'Erik Andersson' } });
```

## Relation till ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: Om `ctx.resource` inte finns skapas och binds en; om den redan finns returneras den befintliga instansen. Detta säkerställer att `ctx.resource` är tillgänglig.
- **ctx.makeResource(type)**: Skapar en ny resursinstans och returnerar den, men skriver **inte** till `ctx.resource`. Detta är lämpligt för scenarier som kräver flera oberoende resurser eller tillfällig användning.
- **ctx.resource**: Ger åtkomst till den resurs som redan är bunden till den aktuella kontexten. De flesta block/popup-fönster är förbundna; annars är den `undefined` och kräver `ctx.initResource`.

## Observera

- Det rekommenderas att göra en kontroll för null-värden före användning: `ctx.resource?.refresh()`, särskilt i scenarier som JSBlock där förbindning kanske inte finns.
- Efter initiering måste ni anropa `setResourceName(name)` för att ange en **samling** innan data laddas via `refresh()`.
- För fullständigt API för varje resurstyp, se länkarna nedan.

## Relaterat

- [ctx.initResource()](./init-resource.md) - Initiera och bind en resurs till den aktuella kontexten
- [ctx.makeResource()](./make-resource.md) - Skapa en ny resursinstans utan att binda den till `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Flera poster/listor
- [SingleRecordResource](../resource/single-record-resource.md) - Enskild post
- [APIResource](../resource/api-resource.md) - Allmän API-resurs
- [SQLResource](../resource/sql-resource.md) - SQL-frågeresurs