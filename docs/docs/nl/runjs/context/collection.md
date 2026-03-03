:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/collection) voor nauwkeurige informatie.
:::

# ctx.collection

De instantie van de collectie (Collection) die is gekoppeld aan de huidige RunJS-uitvoeringscontext. Deze wordt gebruikt om toegang te krijgen tot metadata van de collectie, velddefinities, primaire sleutels en andere configuraties. Meestal is deze afkomstig van `ctx.blockModel.collection` of `ctx.collectionField?.collection`.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock** | De collectie die aan het blok is gekoppeld; biedt toegang tot `name`, `getFields`, `filterTargetKey`, etc. |
| **JSField / JSItem / JSColumn** | De collectie waartoe het huidige veld behoort (of de collectie van het bovenliggende blok), gebruikt voor het ophalen van veldlijsten, primaire sleutels, etc. |
| **Tabelkolom / Detailblok** | Gebruikt voor rendering op basis van de collectiestructuur of het doorgeven van `filterByTk` bij het openen van pop-ups. |

> Let op: `ctx.collection` is beschikbaar in scenario's waarin een gegevensblok, formulierblok of tabelblok aan een collectie is gekoppeld. In een onafhankelijke JSBlock die niet aan een collectie is gekoppeld, kan dit `null` zijn. Het wordt aanbevolen om een controle op null-waarden uit te voeren voor gebruik.

## Type-definitie

```ts
collection: Collection | null | undefined;
```

## Veelvoorkomende eigenschappen

| Eigenschap | Type | Beschrijving |
|------|------|------|
| `name` | `string` | Collectienaam (bijv. `users`, `orders`) |
| `title` | `string` | Collectietitel (inclusief internationalisering) |
| `filterTargetKey` | `string \| string[]` | Naam van het primaire-sleutelveld, gebruikt voor `filterByTk` en `getFilterByTK` |
| `dataSourceKey` | `string` | Sleutel van de gegevensbron (bijv. `main`) |
| `dataSource` | `DataSource` | De instantie van de gegevensbron waartoe deze behoort |
| `template` | `string` | Collectiesjabloon (bijv. `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | Lijst met velden die als titel kunnen worden weergegeven |
| `titleCollectionField` | `CollectionField` | De instantie van het titelveld |

## Veelvoorkomende methoden

| Methode | Beschrijving |
|------|------|
| `getFields(): CollectionField[]` | Haal alle velden op (inclusief overgeërfde velden) |
| `getField(name: string): CollectionField \| undefined` | Haal een specifiek veld op basis van de veldnaam op |
| `getFieldByPath(path: string): CollectionField \| undefined` | Haal een veld op via een pad (ondersteunt associaties, bijv. `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | Haal associatievelden op; `types` kan `['one']`, `['many']`, etc. zijn. |
| `getFilterByTK(record): any` | Extraheer de waarde van de primaire sleutel uit een record, gebruikt voor de `filterByTk` van de API. |

## Relatie met ctx.collectionField en ctx.blockModel

| Behoefte | Aanbevolen gebruik |
|------|----------|
| **Collectie gekoppeld aan de huidige context** | `ctx.collection` (equivalent aan `ctx.blockModel?.collection` of `ctx.collectionField?.collection`) |
| **Collectiedefinitie van het huidige veld** | `ctx.collectionField?.collection` (de collectie waartoe het veld behoort) |
| **Doelcollectie van een associatie** | `ctx.collectionField?.targetCollection` (de doelcollectie van een associatieveld) |

In scenario's zoals subtabellen kan `ctx.collection` de doelcollectie van de associatie zijn; in standaard formulieren/tabellen is het meestal de collectie die aan het blok is gekoppeld.

## Voorbeelden

### Primaire sleutel ophalen en pop-up openen

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

### Velden doorlopen voor validatie of koppeling

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title} is verplicht`);
    return;
  }
}
```

### Associatievelden ophalen

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// Gebruikt voor het opbouwen van subtabellen, gekoppelde bronnen, etc.
```

## Aandachtspunten

- `filterTargetKey` is de veldnaam van de primaire sleutel van de collectie. Sommige collecties kunnen een `string[]` gebruiken voor samengestelde primaire sleutels. Indien niet geconfigureerd, wordt `'id'` vaak als terugvaloptie gebruikt.
- In scenario's zoals **subtabellen of associatievelden** kan `ctx.collection` verwijzen naar de doelcollectie van de associatie, wat verschilt van `ctx.blockModel.collection`.
- `getFields()` voegt velden van overgeërfde collecties samen; lokale velden overschrijven overgeërfde velden met dezelfde naam.

## Gerelateerd

- [ctx.collectionField](./collection-field.md): De velddefinitie van het huidige collectieveld
- [ctx.blockModel](./block-model.md): Het bovenliggende blok dat de huidige JS bevat, inclusief `collection`
- [ctx.model](./model.md): Het huidige model, dat `collection` kan bevatten