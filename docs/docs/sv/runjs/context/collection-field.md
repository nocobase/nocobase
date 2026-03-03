:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/collection-field).
:::

# ctx.collectionField

`CollectionField`-instansen som är associerad med den aktuella RunJS-exekveringskontexten. Den används för att få åtkomst till fältets metadata, typer, valideringsregler och associationsinformation. Den existerar endast när fältet är bundet till en definition av en samling (Collection); anpassade eller virtuella fält kan vara `null`.

## Användningsområden

| Scenario | Beskrivning |
|------|------|
| **JSField** | Utför länkning eller validering i formulärfält baserat på `interface`, `enum`, `targetCollection`, etc. |
| **JSItem** | Få tillgång till metadata för fältet som motsvarar den aktuella kolumnen i undertabeller (sub-table items). |
| **JSColumn** | Välj renderingsmetoder baserat på `collectionField.interface` eller få tillgång till `targetCollection` i tabellkolumner. |

> **Observera:** `ctx.collectionField` är endast tillgänglig när fältet är bundet till en definition av en samling (Collection). I scenarier som fristående JSBlock-block eller händelser utan fältbindning är den vanligtvis `undefined`. Det rekommenderas att Ni kontrollerar om värdet är tomt före användning.

## Typdefinition

```ts
collectionField: CollectionField | null | undefined;
```

## Vanliga egenskaper

| Egenskap | Typ | Beskrivning |
|------|------|------|
| `name` | `string` | Fältnamn (t.ex. `status`, `userId`) |
| `title` | `string` | Fälttitel (inklusive internationalisering) |
| `type` | `string` | Datatyp för fältet (`string`, `integer`, `belongsTo`, etc.) |
| `interface` | `string` | Gränssnittstyp för fältet (`input`, `select`, `m2o`, `o2m`, `m2m`, etc.) |
| `collection` | `Collection` | Samlingen som fältet tillhör |
| `targetCollection` | `Collection` | Målsamlingen för associationsfältet (endast för associationstyper) |
| `target` | `string` | Namn på målsamlingen (för associationsfält) |
| `enum` | `array` | Uppräkningsalternativ (select, radio, etc.) |
| `defaultValue` | `any` | Standardvärde |
| `collectionName` | `string` | Namnet på samlingen som fältet tillhör |
| `foreignKey` | `string` | Namn på fältet för främmande nyckel (belongsTo, etc.) |
| `sourceKey` | `string` | Källnyckel för association (hasMany, etc.) |
| `targetKey` | `string` | Målnyckel för association |
| `fullpath` | `string` | Fullständig sökväg (t.ex. `main.users.status`), används för API eller variabelreferenser |
| `resourceName` | `string` | Resursnamn (t.ex. `users.status`) |
| `readonly` | `boolean` | Om fältet är skrivskyddat |
| `titleable` | `boolean` | Om fältet kan visas som en titel |
| `validation` | `object` | Konfiguration av valideringsregler |
| `uiSchema` | `object` | UI-konfiguration |
| `targetCollectionTitleField` | `CollectionField` | Titelfältet för målsamlingen (för associationsfält) |

## Vanliga metoder

| Metod | Beskrivning |
|------|------|
| `isAssociationField(): boolean` | Returnerar om det är ett associationsfält (belongsTo, hasMany, hasOne, belongsToMany, etc.) |
| `isRelationshipField(): boolean` | Returnerar om det är ett relationsfält (inklusive o2o, m2o, o2m, m2m, etc.) |
| `getComponentProps(): object` | Hämtar standard-props för fältkomponenten |
| `getFields(): CollectionField[]` | Hämtar fältlistan för målsamlingen (endast för associationsfält) |
| `getFilterOperators(): object[]` | Hämtar filteroperatorer som stöds av detta fält (t.ex. `$eq`, `$ne`, etc.) |

## Exempel

### Villkorlig rendering baserat på fälttyp

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Associationsfält: visa associerade poster
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Kontrollera om det är ett associationsfält och få åtkomst till målsamlingen

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Bearbeta enligt målsamlingens struktur
}
```

### Hämta uppräkningsalternativ (enum)

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Villkorlig rendering baserat på skrivskydd/visningsläge

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Hämta titelfältet för målsamlingen

```ts
// Vid visning av ett associationsfält, använd targetCollectionTitleField för att få titelfältets namn
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Relation till ctx.collection

| Behov | Rekommenderad användning |
|------|----------|
| **Den aktuella samlingen som fältet tillhör** | `ctx.collectionField?.collection` eller `ctx.collection` |
| **Metadata för fältet (namn, typ, gränssnitt, enum, etc.)** | `ctx.collectionField` |
| **Målsamling för association** | `ctx.collectionField?.targetCollection` |

`ctx.collection` representerar vanligtvis den samling som är bunden till det aktuella blocket; `ctx.collectionField` representerar definitionen av det aktuella fältet i samlingen. I scenarier som undertabeller eller associationsfält kan dessa två skilja sig åt.

## Observera

- I scenarier som **JSBlock** eller **JSAction (utan fältbindning)** är `ctx.collectionField` vanligtvis `undefined`. Det rekommenderas att Ni använder valfri kedjning (optional chaining) före åtkomst.
- Om ett anpassat JS-fält inte är bundet till ett fält i en samling kan `ctx.collectionField` vara `null`.
- `targetCollection` existerar endast för fält av associationstyp (t.ex. m2o, o2m, m2m); `enum` existerar endast för fält med alternativ, såsom select eller radioGroup.

## Relaterat

- [ctx.collection](./collection.md): Samling associerad med den aktuella kontexten
- [ctx.model](./model.md): Modell där den aktuella exekveringskontexten finns
- [ctx.blockModel](./block-model.md): Överordnat block som bär den aktuella JS-koden
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Läsa och skriva det aktuella fältvärdet