:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/get-model) voor nauwkeurige informatie.
:::

# ctx.getModel()

Haalt een modelinstantie op (zoals `BlockModel`, `PageModel`, `ActionModel`, enz.) uit de huidige engine of weergavestack op basis van de model-`uid`. Dit wordt in RunJS gebruikt om toegang te krijgen tot andere modellen over blokken, pagina's of pop-ups heen.

Als u alleen het model of blok nodig heeft waarin de huidige uitvoeringscontext zich bevindt, gebruik dan bij voorkeur `ctx.model` of `ctx.blockModel` in plaats van `ctx.getModel`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock / JSAction** | Haal modellen van andere blokken op op basis van een bekende `uid` om hun `resource`, `form`, `setProps`, enz. te lezen of te schrijven. |
| **RunJS in pop-ups** | Wanneer u toegang moet hebben tot een model op de pagina die de pop-up heeft geopend, geeft u `searchInPreviousEngines: true` mee. |
| **Aangepaste acties** | Lokaliseer formulieren of submodellen in het configuratiepaneel via `uid` over weergavestacks heen om hun configuratie of status te lezen. |

## Type-definitie

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## Parameters

| Parameter | Type | Beschrijving |
|------|------|------|
| `uid` | `string` | De unieke identificatie van de doelmodelinstantie, opgegeven tijdens de configuratie of creatie (bijv. `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | Optioneel, standaard `false`. Indien `true`, wordt er gezocht vanaf de huidige engine tot aan de root in de "weergavestack", waardoor toegang tot modellen in bovenliggende engines mogelijk is (bijv. de pagina die een pop-up heeft geopend). |

## Retourwaarde

- Retourneert de bijbehorende `FlowModel` subklasse-instantie (bijv. `BlockModel`, `FormBlockModel`, `ActionModel`) indien gevonden.
- Retourneert `undefined` indien niet gevonden.

## Zoekbereik

- **Standaard (`searchInPreviousEngines: false`)**: Zoekt alleen binnen de **huidige engine** op `uid`. In pop-ups of weergaven met meerdere niveaus heeft elke weergave een onafhankelijke engine; standaard wordt er alleen gezocht naar modellen binnen de huidige weergave.
- **`searchInPreviousEngines: true`**: Zoekt naar boven langs de `previousEngine`-keten vanaf de huidige engine en retourneert de eerste overeenkomst. Dit is handig voor toegang tot een model op de pagina die de huidige pop-up heeft geopend.

## Voorbeelden

### Een ander blok ophalen en vernieuwen

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### Toegang tot een model op de pagina vanuit een pop-up

```ts
// Toegang tot een blok op de pagina die de huidige pop-up heeft geopend
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### Lezen/schrijven over modellen heen en rerender triggeren

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### Veiligheidscontrole

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('Doelmodel bestaat niet');
  return;
}
```

## Gerelateerd

- [ctx.model](./model.md): Het model waarin de huidige uitvoeringscontext zich bevindt.
- [ctx.blockModel](./block-model.md): Het bovenliggende blokmodel waar de huidige JS zich bevindt; meestal toegankelijk zonder `getModel` te hoeven gebruiken.