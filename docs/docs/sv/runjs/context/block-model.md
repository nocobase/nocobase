:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/block-model).
:::

# ctx.blockModel

Den överordnade blockmodellen (BlockModel-instans) där det aktuella JS-fältet / JS-blocket finns. I scenarier som JSField, JSItem och JSColumn pekar `ctx.blockModel` på det formulärblock eller tabellblock som bär den aktuella JS-logiken. I ett fristående JSBlock kan det vara `null` eller samma som `ctx.model`.

## Tillämpliga scenarier

| Scenario | Beskrivning |
|------|------|
| **JSField** | Åtkomst till `form`, `samling` (collection) och `resurs` (resource) i det överordnade formulärblocket för att implementera länkning eller validering. |
| **JSItem** | Åtkomst till resurs- och samlingsinformation i det överordnade tabell-/formulärblocket i ett under-tabellobjekt. |
| **JSColumn** | Åtkomst till `resurs` (t.ex. `getSelectedRows`) och `samling` i det överordnade tabellblocket i en tabellkolumn. |
| **Formuläråtgärder / Arbetsflöde** | Åtkomst till `form` för validering före inskickning, `resurs` för uppdatering, etc. |

> Observera: `ctx.blockModel` är endast tillgänglig i RunJS-kontexter där ett överordnat block finns. I fristående JSBlocks (utan ett överordnat formulär/tabell) kan det vara `null`. Det rekommenderas att ni gör en kontroll för null-värden före användning.

## Typdefinition

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

Den specifika typen beror på den överordnade blocktypen: formulärblock är oftast `FormBlockModel` eller `EditFormModel`, medan tabellblock oftast är `TableBlockModel`.

## Vanliga egenskaper

| Egenskap | Typ | Beskrivning |
|------|------|------|
| `uid` | `string` | Unik identifierare för blockmodellen. |
| `collection` | `Collection` | Samlingen som är bunden till det aktuella blocket. |
| `resource` | `Resource` | Resursinstansen som används av blocket (`SingleRecordResource` / `MultiRecordResource`, etc.). |
| `form` | `FormInstance` | Formulärblock: Ant Design Form-instans, stöder `getFieldsValue`, `validateFields`, `setFieldsValue`, etc. |
| `emitter` | `EventEmitter` | Event-emitter, används för att lyssna på `formValuesChange`, `onFieldReset`, etc. |

## Relation till ctx.model och ctx.form

| Behov | Rekommenderad användning |
|------|----------|
| **Överordnat block för aktuellt JS** | `ctx.blockModel` |
| **Läsa/skriva formulärfält** | `ctx.form` (motsvarar `ctx.blockModel?.form`, smidigare i formulärblock) |
| **Modell för aktuell exekveringskontext** | `ctx.model` (fältmodell i JSField, blockmodell i JSBlock) |

I ett JSField är `ctx.model` fältmodellen, och `ctx.blockModel` är formulär- eller tabellblocket som bär fältet; `ctx.form` är vanligtvis `ctx.blockModel.form`.

## Exempel

### Tabell: Hämta valda rader och bearbeta

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('Vänligen välj data först');
  return;
}
```

### Formulärscenario: Validera och uppdatera

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### Lyssna på formulärändringar

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // Implementera länkning eller återrendering baserat på de senaste formulärvärdena
});
```

### Utlös återrendering av blocket

```ts
ctx.blockModel?.rerender?.();
```

## Observera

- I ett **fristående JSBlock** (utan ett överordnat formulär- eller tabellblock) kan `ctx.blockModel` vara `null`. Det rekommenderas att ni använder valfri kedja (optional chaining) när ni kommer åt dess egenskaper: `ctx.blockModel?.resource?.refresh?.()`.
- I **JSField / JSItem / JSColumn** refererar `ctx.blockModel` till formulär- eller tabellblocket som bär det aktuella fältet. I ett **JSBlock** kan det vara sig självt eller ett block på en högre nivå, beroende på den faktiska hierarkin.
- `resource` finns endast i datablock; `form` finns endast i formulärblock. Tabellblock har vanligtvis inte ett `form`.

## Relaterat

- [ctx.model](./model.md): Modellen för den aktuella exekveringskontexten.
- [ctx.form](./form.md): Formulärinstans, används ofta i formulärblock.
- [ctx.resource](./resource.md): Resursinstans (motsvarar `ctx.blockModel?.resource`, använd direkt om tillgänglig).
- [ctx.getModel()](./get-model.md): Hämta andra blockmodeller via UID.