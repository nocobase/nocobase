:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/collection-field).
:::

# ctx.collectionField

Instance pole kolekce (`CollectionField`) přidružená k aktuálnímu kontextu provádění RunJS. Slouží k přístupu k metadatům pole, typům, pravidlům validace a informacím o asociacích. Existuje pouze tehdy, když je pole vázáno na definici kolekce; u vlastních nebo virtuálních polí může být `null`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSField** | Provádění propojení nebo validace ve formulářových polích na základě `interface`, `enum`, `targetCollection` atd. |
| **JSItem** | Přístup k metadatům pole odpovídajícího aktuálnímu sloupci v položkách podtabulky. |
| **JSColumn** | Výběr způsobu vykreslování na základě `collectionField.interface` nebo přístup k `targetCollection` ve sloupcích tabulky. |

> **Poznámka:** `ctx.collectionField` je k dispozici pouze tehdy, když je pole vázáno na definici kolekce (Collection). V případech, jako jsou nezávislé bloky JSBlock nebo události akcí bez vazby na pole, je obvykle `undefined`. Před použitím doporučujeme provést kontrolu na prázdnou hodnotu.

## Definice typu

```ts
collectionField: CollectionField | null | undefined;
```

## Běžné vlastnosti

| Vlastnost | Typ | Popis |
|------|------|------|
| `name` | `string` | Název pole (např. `status`, `userId`) |
| `title` | `string` | Titulek pole (včetně internacionalizace) |
| `type` | `string` | Datový typ pole (`string`, `integer`, `belongsTo` atd.) |
| `interface` | `string` | Typ rozhraní pole (`input`, `select`, `m2o`, `o2m`, `m2m` atd.) |
| `collection` | `Collection` | Kolekce, ke které pole patří |
| `targetCollection` | `Collection` | Cílová kolekce asociačního pole (pouze pro typy asociací) |
| `target` | `string` | Název cílové kolekce (pro asociační pole) |
| `enum` | `array` | Možnosti výčtu (select, radio atd.) |
| `defaultValue` | `any` | Výchozí hodnota |
| `collectionName` | `string` | Název kolekce, ke které pole patří |
| `foreignKey` | `string` | Název pole cizího klíče (belongsTo atd.) |
| `sourceKey` | `string` | Zdrojový klíč asociace (hasMany atd.) |
| `targetKey` | `string` | Cílový klíč asociace |
| `fullpath` | `string` | Úplná cesta (např. `main.users.status`), používá se pro API nebo reference proměnných |
| `resourceName` | `string` | Název zdroje (např. `users.status`) |
| `readonly` | `boolean` | Zda je pole pouze pro čtení |
| `titleable` | `boolean` | Zda může být pole zobrazeno jako titulek |
| `validation` | `object` | Konfigurace pravidel validace |
| `uiSchema` | `object` | Konfigurace UI |
| `targetCollectionTitleField` | `CollectionField` | Titulkové pole cílové kolekce (pro asociační pole) |

## Běžné metody

| Metoda | Popis |
|------|------|
| `isAssociationField(): boolean` | Zda se jedná o asociační pole (belongsTo, hasMany, hasOne, belongsToMany atd.) |
| `isRelationshipField(): boolean` | Zda se jedná o vztahové pole (včetně o2o, m2o, o2m, m2m atd.) |
| `getComponentProps(): object` | Získání výchozích props komponenty pole |
| `getFields(): CollectionField[]` | Získání seznamu polí cílové kolekce (pouze asociační pole) |
| `getFilterOperators(): object[]` | Získání operátorů filtrů podporovaných tímto polem (např. `$eq`, `$ne` atd.) |

## Příklady

### Větvené vykreslování na základě typu pole

```ts
if (!ctx.collectionField) return null;
const { interface: iface } = ctx.collectionField;
if (['m2o', 'o2m', 'm2m'].includes(iface)) {
  // Asociační pole: zobrazení souvisejících záznamů
  const target = ctx.collectionField.targetCollection;
  // ...
} else if (iface === 'select' || iface === 'radioGroup') {
  const options = ctx.collectionField.enum || [];
  // ...
}
```

### Určení, zda se jedná o asociační pole, a přístup k cílové kolekci

```ts
if (ctx.collectionField?.isAssociationField()) {
  const targetCol = ctx.collectionField.targetCollection;
  const titleField = targetCol?.titleCollectionField?.name;
  // Zpracování podle struktury cílové kolekce
}
```

### Získání možností výčtu

```ts
const options = ctx.collectionField?.enum ?? [];
const labels = options.map((o) => (typeof o === 'object' ? o.label : o));
```

### Podmíněné vykreslování na základě režimu pouze pro čtení / zobrazení

```ts
const { Input } = ctx.libs.antd;
if (ctx.collectionField?.readonly) {
  ctx.render(<span>{ctx.getValue?.() ?? '-'}</span>);
} else {
  ctx.render(<Input onChange={(e) => ctx.setValue?.(e.target.value)} />);
}
```

### Získání titulkového pole cílové kolekce

```ts
// Při zobrazování asociačního pole lze použít targetCollectionTitleField k získání názvu titulkového pole
const titleField = ctx.collectionField?.targetCollectionTitleField;
const titleKey = titleField?.name ?? 'title';
const assocValue = ctx.getValue?.() ?? ctx.record?.[ctx.collectionField?.name];
const label = assocValue?.[titleKey];
```

## Vztah k ctx.collection

| Požadavek | Doporučené použití |
|------|----------|
| **Kolekce aktuálního pole** | `ctx.collectionField?.collection` nebo `ctx.collection` |
| **Metadata pole (název, typ, rozhraní, výčet atd.)** | `ctx.collectionField` |
| **Cílová kolekce asociace** | `ctx.collectionField?.targetCollection` |

`ctx.collection` obvykle představuje kolekci vázanou na aktuální blok; `ctx.collectionField` představuje definici aktuálního pole v kolekci. V případech, jako jsou podtabulky nebo asociační pole, se tyto dvě hodnoty mohou lišit.

## Důležitá upozornění

- V případech, jako jsou **JSBlock** nebo **JSAction (bez vazby na pole)**, je `ctx.collectionField` obvykle `undefined`. Před přístupem doporučujeme použít volitelné řetězení (optional chaining).
- Pokud vlastní JS pole není vázáno na pole kolekce, může být `ctx.collectionField` rovno `null`.
- `targetCollection` existuje pouze u polí typu asociace (např. m2o, o2m, m2m); `enum` existuje pouze u polí s možnostmi, jako je select nebo radioGroup.

## Související

- [ctx.collection](./collection.md): Kolekce přidružená k aktuálnímu kontextu
- [ctx.model](./model.md): Model, ve kterém se nachází aktuální kontext provádění
- [ctx.blockModel](./block-model.md): Nadřazený blok obsahující aktuální JS
- [ctx.getValue()](./get-value.md), [ctx.setValue()](./set-value.md): Čtení a zápis hodnoty aktuálního pole