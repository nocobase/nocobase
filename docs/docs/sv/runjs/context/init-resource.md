:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/init-resource).
:::

# ctx.initResource()

**Initierar** resursen för den aktuella kontexten: Om `ctx.resource` inte redan finns, skapas en av den angivna typen och binds till kontexten; om den redan finns används den direkt. Därefter kan den nås via `ctx.resource`.

## Användningsområden

Används vanligtvis i **JSBlock**-scenarier (fristående block). De flesta block, popup-fönster och andra komponenter har `ctx.resource` förbundet i förväg och kräver inga manuella anrop. JSBlock har ingen resurs som standard, så ni måste anropa `ctx.initResource(type)` innan ni laddar data via `ctx.resource`.

## Typdefinition

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parameter | Typ | Beskrivning |
|-----------|------|-------------|
| `type` | `string` | Resurstyp: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Returvärde**: Resursinstansen i den aktuella kontexten (dvs. `ctx.resource`).

## Skillnad från ctx.makeResource()

| Metod | Beteende |
|--------|----------|
| `ctx.initResource(type)` | Skapar och binder om `ctx.resource` inte finns; returnerar den befintliga om den gör det. Säkerställer att `ctx.resource` är tillgänglig. |
| `ctx.makeResource(type)` | Skapar och returnerar endast en ny instans, skriver **inte** till `ctx.resource`. Lämplig för scenarier som kräver flera oberoende resurser eller tillfällig användning. |

## Exempel

### Listdata (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Enskild post (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Ange primärnyckel
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Ange datakälla

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Observera

- I de flesta blockscenarier (formulär, tabeller, detaljer, etc.) och popup-fönster är `ctx.resource` redan förbundet av körtidsmiljön, så det är inte nödvändigt att anropa `ctx.initResource`.
- Manuell initiering krävs endast i kontexter som JSBlock där det inte finns någon standardresurs.
- Efter initiering måste ni anropa `setResourceName(name)` för att ange en samling, och sedan anropa `refresh()` för att ladda data.

## Relaterat

- [ctx.resource](./resource.md) — Resursinstansen i den aktuella kontexten
- [ctx.makeResource()](./make-resource.md) — Skapar en ny resursinstans utan att binda den till `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Flera poster/Lista
- [SingleRecordResource](../resource/single-record-resource.md) — Enskild post
- [APIResource](../resource/api-resource.md) — Allmän API-resurs
- [SQLResource](../resource/sql-resource.md) — SQL-frågeresurs