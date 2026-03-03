:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/get-model).
:::

# ctx.getModel()

Hämtar en modellinstans (såsom `BlockModel`, `PageModel`, `ActionModel`, etc.) från den aktuella motorn eller vy-stacken baserat på modellens `uid`. Detta används i RunJS för att komma åt andra modeller över block, sidor eller popup-fönster.

Om ni endast behöver den modell eller det block där den aktuella körningskontexten finns, bör ni prioritera att använda `ctx.model` eller `ctx.blockModel` istället för `ctx.getModel`.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSBlock / JSAction** | Hämta modeller för andra block baserat på ett känt `uid` för att läsa eller skriva till deras `resource`, `form`, `setProps`, etc. |
| **RunJS i popup-fönster** | När ni behöver komma åt en modell på sidan som öppnade popup-fönstret, skicka med `searchInPreviousEngines: true`. |
| **Anpassade åtgärder** | Lokalisera formulär eller undermodeller i inställningspanelen via `uid` över vy-stackar för att läsa deras konfiguration eller status. |

## Typdefinition

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parametrar

| Parameter | Typ | Beskrivning |
|------|------|------|
| `uid` | `string` | Den unika identifieraren för målmodellinstansen, angiven vid konfiguration eller skapande (t.ex. `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Valfri, standardvärde är `false`. När den är `true` söks det från den aktuella motorn upp till roten i "vy-stacken", vilket möjliggör åtkomst till modeller i överordnade motorer (t.ex. sidan som öppnade ett popup-fönster). |

## Returvärde

- Returnerar motsvarande instans av en `FlowModel`-underklass (t.ex. `BlockModel`, `FormBlockModel`, `ActionModel`) om den hittas.
- Returnerar `undefined` om den inte hittas.

## Sökomfång

- **Standard (`searchInPreviousEngines: false`)**: Söker endast inom den **aktuella motorn** efter `uid`. I popup-fönster eller vyer i flera nivåer har varje vy en oberoende motor; som standard söks det endast efter modeller inom den aktuella vyn.
- **`searchInPreviousEngines: true`**: Söker uppåt längs `previousEngine`-kedjan med början från den aktuella motorn och returnerar den första matchningen. Detta är användbart för att komma åt en modell på sidan som öppnade det aktuella popup-fönstret.

## Exempel

### Hämta ett annat block och uppdatera

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Komma åt en modell på sidan från ett popup-fönster

```ts
// Kom åt ett block på sidan som öppnade det aktuella popup-fönstret
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Läsa/skriva över modeller och utlösa omrendering

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Säkerhetskontroll

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Målmodellen existerar inte');
  return;
}
```

## Relaterat

- [ctx.model](./model.md): Modellen där den aktuella körningskontexten finns.
- [ctx.blockModel](./block-model.md): Föräldrablocksmodellen där den aktuella JS-koden finns; vanligtvis tillgänglig utan att behöva använda `getModel`.