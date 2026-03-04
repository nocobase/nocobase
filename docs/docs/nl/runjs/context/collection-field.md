:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/collection-field) voor nauwkeurige informatie.
:::

# ctx.collectionField

De `CollectionField`-instantie die is gekoppeld aan de huidige RunJS-uitvoeringscontext, gebruikt om toegang te krijgen tot veld-metadata, types, validatieregels en relatie-informatie. Deze is alleen aanwezig wanneer het veld is gekoppeld aan een definitie van een collectie; aangepaste/virtuele velden kunnen `null` zijn.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSField** | Koppelingen of validaties in formuliervelden uitvoeren op basis van `interface`, `enum`, `targetCollection`, etc. |
| **JSItem** | Toegang krijgen tot metadata van het veld dat overeenkomt met de huidige kolom in sub-tabelitems. |
| **JSColumn** | Renderingsmethoden selecteren op basis van `collectionField.interface` of toegang krijgen tot `targetCollection` in tabelkolommen. |

> Let op: `ctx.collectionField` is alleen beschikbaar wanneer het veld is gekoppeld aan een definitie van een collectie; in scenario's zoals onafhankelijke JSBlock-blokken of actie-gebeurtenissen zonder veldbinding is deze meestal `undefined`. Het wordt aanbevolen om te controleren op null-waarden voor gebruik.

## Type-definitie

```ts
collectionField: CollectionField | null | undefined;
```

## Veelvoorkomende eigenschappen

| Eigenschap | Type | Beschrijving |
|------|------|------|
| `name` | `string` | Veldnaam (bijv. `status`, `userId`) |
| `title` | `string` | Veldtitel (inclusief internationalisering) |
| `type` | `string` | Gegevenstype van het veld (`string`, `integer`, `belongsTo`, etc.) |
| `interface` | `string` | Interface-type van het veld (`input`, `select`, `m2o`, `o2m`, `m2m`, etc.) |
| `collection` | `Collection` | De collectie waartoe het veld behoort |
| `targetCollection` | `Collection` | De doelcollectie van het relatieveld (alleen voor relatietypes) |
| `target` | `string` | Naam van de doelcollectie (voor relatievelden) |
| `enum` | `array` | Opsommingsopties (select, radio, etc.) |
| `defaultValue` | `any` | Standaardwaarde |
| `collectionName` | `string` | Naam van de collectie waartoe het veld behoort |
| `foreignKey` | `string` | Naam van het vreemde-sleutelveld (belongsTo, etc.) |
| `sourceKey` | `string` | Bron-sleutel van de relatie (hasMany, etc.) |
| `targetKey` | `string` | Doel-sleutel van de relatie |
| `fullpath` | `string` | Volledig pad (bijv. `main.users.status`), gebruikt voor API- of variabeleverwijzingen |
| `resourceName` | `string` | Resourcenaam (bijv. `users.status`) |
| `readonly` | `boolean` | Of het veld alleen-lezen is |
| `titleable` | `boolean` | Of het veld als titel kan worden weergegeven |
| `validation` | `object` | Configuratie van validatieregels |
| `uiSchema` | `object` | UI-configuratie |
| `targetCollectionTitleField` | `CollectionField` | Het titelveld van de doelcollectie (voor relatievelden) |

## Veelvoorkomende methoden

| Methode | Beschrijving |
|------|------|
| `isAssociationField(): boolean` | Of het een relatieveld is (belongsTo, hasMany, hasOne, belongsToMany, etc.) |
| `isRelationshipField(): boolean` | Of het een relationeel veld is (inclusief o2o, m2o, o2m, m2m, etc.) |
| `getComponentProps(): object` | Haalt de standaard props van de veldcomponent op |
| `getFields(): CollectionField[]` | Haalt de veldenlijst van de doelcollectie op (alleen voor relatievelden) |
| `getFilterOperators(): object[]` | Haalt de filteroperatoren op die door dit veld worden ondersteund (bijv. `$eq`, `$ne`, etc.) |

## Voorbeelden

### Rendering op basis van veldtype

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Relatieveld: toon gekoppelde records
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Controleren of het een relatieveld is en toegang krijgen tot de doelcollectie

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Verwerken volgens de structuur van de doelcollectie
}
```

### Opsommingsopties ophalen

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Voorwaardelijke rendering op basis van alleen-lezen/weergavemodus

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Het titelveld van de doelcollectie ophalen

```ts
// Gebruik bij het weergeven van een relatieveld targetCollectionTitleField om de naam van het titelveld op te halen
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relatie met ctx.collection

| Behoefte | Aanbevolen gebruik |
|------|----------|
| **Collectie van het huidige veld** | `ctx.collectionField?.collection` of `ctx.collection` |
| **Veld-metadata (naam, type, interface, enum, etc.)** | `ctx.collectionField` |
| **Doelcollectie** | `ctx.collectionField?.targetCollection` |

`ctx.collection` vertegenwoordigt meestal de collectie die aan het huidige blok is gekoppeld; `ctx.collectionField` vertegenwoordigt de definitie van het huidige veld in de collectie. In scenario's zoals sub-tabellen of relatievelden kunnen deze twee verschillen.

## Opmerkingen

- In scenario's zoals **JSBlock** of **JSAction (zonder veldbinding)** is `ctx.collectionField` meestal `undefined`. Het wordt aanbevolen om optionele chaining te gebruiken voor toegang.
- Als een aangepast JS-veld niet is gekoppeld aan een collectieveld, kan `ctx.collectionField` `null` zijn.
- `targetCollection` bestaat alleen voor velden van het relatietype (bijv. m2o, o2m, m2m); `enum` bestaat alleen voor velden met opties zoals select of radioGroup.

## Gerelateerd

- [ctx.collection](./collection.md): Collectie gekoppeld aan de huidige context
- [ctx.model](./model.md): Model waarin de huidige uitvoeringscontext zich bevindt
- [ctx.blockModel](./block-model.md): Bovenliggend blok dat de huidige JS bevat
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): De huidige veldwaarde lezen en schrijven