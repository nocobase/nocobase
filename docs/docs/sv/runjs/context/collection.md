:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/collection).
:::

# ctx.collection

Instansen för den samling (Collection) som är associerad med den aktuella RunJS-körningskontexten. Den används för att komma åt metadata, fältdefinitioner, primärnycklar och andra konfigurationer för samlingen. Den kommer vanligtvis från `ctx.blockModel.collection` eller `ctx.collectionField?.collection`.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock** | Samlingen bunden till blocket; kan komma åt `name`, `getFields`, `filterTargetKey`, etc. |
| **JSField / JSItem / JSColumn** | Samlingen som det aktuella fältet tillhör (eller föräldrablockets samling), används för att hämta fältlistor, primärnycklar, etc. |
| **Tabellkolumn / Detaljblock** | Används för rendering baserat på samlingens struktur eller för att skicka `filterByTk` när popup-fönster öppnas. |

> Observera: `ctx.collection` är tillgänglig i scenarier där ett datablock, formulärblock eller tabellblock är bundet till en samling. I ett fristående JSBlock som inte är bundet till en samling kan den vara `null`. Det rekommenderas att ni gör en kontroll för null-värden före användning.

## Typdefinition

```ts
collection: Collection | null | undefined;
```

## Vanliga egenskaper

| Egenskap | Typ | Beskrivning |
|------|------|------|
| `name` | `string` | Samlingens namn (t.ex. `users`, `orders`) |
| `title` | `string` | Samlingens titel (inkluderar internationalisering) |
| `filterTargetKey` | `string \| string[]` | Fältnamn för primärnyckel, används för `filterByTk` och `getFilterByTK` |
| `dataSourceKey` | `string` | Nyckel för datakälla (t.ex. `main`) |
| `dataSource` | `DataSource` | Instansen för den datakälla den tillhör |
| `template` | `string` | Mall för samlingen (t.ex. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Lista över fält som kan visas som titlar |
| `titleCollectionField` | `CollectionField` | Instansen för titelfältet |

## Vanliga metoder

| Metod | Beskrivning |
|------|------|
| `getFields(): CollectionField[]` | Hämta alla fält (inklusive ärvda) |
| `getField(name: string): CollectionField \| undefined` | Hämta ett enskilt fält via fältnamn |
| `getFieldByPath(path: string): CollectionField \| undefined` | Hämta ett fält via sökväg (stöder associationer, t.ex. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Hämta associationsfält; `types` kan vara `['one']`, `['many']`, etc. |
| `getFilterByTK(record): any` | Extrahera primärnyckelvärdet från en post, används för API:ets `filterByTk` |

## Relation till ctx.collectionField och ctx.blockModel

| Behov | Rekommenderad användning |
|------|----------|
| **Samling associerad med aktuell kontext** | `ctx.collection` (motsvarar `ctx.blockModel?.collection` eller `ctx.collectionField?.collection`) |
| **Samlingsdefinition för det aktuella fältet** | `ctx.collectionField?.collection` (samlingen som fältet tillhör) |
| **Målsamling för association** | `ctx.collectionField?.targetCollection` (målsamlingen för ett associationsfält) |

I scenarier som undertabeller kan `ctx.collection` vara målsamlingen för associationen; i vanliga formulär/tabeller är det vanligtvis den samling som är bunden till blocket.

## Exempel

### Hämta primärnyckel och öppna popup

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Iterera genom fält för validering eller länkning

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} är obligatoriskt`);
    return;
  }
}
```

### Hämta associationsfält

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Används för att bygga undertabeller, associerade resurser etc.
```

## Observera

- `filterTargetKey` är fältnamnet för samlingens primärnyckel. Vissa samlingar kan använda `string[]` för sammansatta primärnycklar. Om inget är konfigurerat används ofta `'id'` som reservalternativ.
- I scenarier som **undertabeller eller associationsfält** kan `ctx.collection` peka på målsamlingen för associationen, vilket skiljer sig från `ctx.blockModel.collection`.
- `getFields()` slår samman fält från ärvda samlingar; lokala fält åsidosätter ärvda fält med samma namn.

## Relaterat

- [ctx.collectionField](./collection-field.md): Samlingsfältsdefinitionen för det aktuella fältet
- [ctx.blockModel](./block-model.md): Föräldrablocket som hyser aktuell JS, innehåller `collection`
- [ctx.model](./model.md): Den aktuella modellen, som kan innehålla `collection`