:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Správce zdrojů dat (instance `DataSourceManager`) slouží ke správě a přístupu k více zdrojům dat (např. hlavní databáze `main`, logovací databáze `logging` atd.). Používá se v případech, kdy existuje více zdrojů dat nebo když je vyžadován přístup k metadatům napříč různými zdroji dat.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Více zdrojů dat** | Výčet všech zdrojů dat nebo získání konkrétního zdroje dat podle klíče (key). |
| **Přístup napříč zdroji dat** | Přístup k metadatům pomocí formátu „klíč zdroje dat + název kolekce“, pokud není znám zdroj dat aktuálního kontextu. |
| **Získání pole podle úplné cesty** | Použití formátu `dataSourceKey.collectionName.fieldPath` pro získání definic polí napříč různými zdroji dat. |

> Poznámka: Pokud pracujete pouze s aktuálním zdrojem dat, upřednostněte použití `ctx.dataSource`. `ctx.dataSourceManager` použijte pouze tehdy, když potřebujete vypsat nebo přepínat mezi zdroji dat.

## Definice typů

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Správa zdrojů dat
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Čtení zdrojů dat
  getDataSources(): DataSource[];                     // Získání všech zdrojů dat
  getDataSource(key: string): DataSource | undefined;  // Získání zdroje dat podle klíče

  // Přímý přístup k metadatům podle zdroje dat + kolekce
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Vztah k ctx.dataSource

| Požadavek | Doporučené použití |
|------|----------|
| **Jeden zdroj dat vázaný na aktuální kontext** | `ctx.dataSource` (např. zdroj dat aktuální stránky/bloku) |
| **Vstupní bod pro všechny zdroje dat** | `ctx.dataSourceManager` |
| **Výpis nebo přepínání zdrojů dat** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Získání kolekce v rámci aktuálního zdroje dat** | `ctx.dataSource.getCollection(name)` |
| **Získání kolekce napříč zdroji dat** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Získání pole v rámci aktuálního zdroje dat** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Získání pole napříč zdroji dat** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Příklady

### Získání konkrétního zdroje dat

```ts
// Získání zdroje dat s názvem 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Získání všech kolekcí v tomto zdroji dat
const collections = mainDS?.getCollections();
```

### Přístup k metadatům kolekce napříč zdroji dat

```ts
// Získání kolekce pomocí dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Získání primárního klíče kolekce
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Získání definice pole podle úplné cesty

```ts
// Formát: dataSourceKey.collectionName.fieldPath
// Získání definice pole podle „klíč zdroje dat.název kolekce.cesta k poli“
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Podpora cest k asociovaným polím
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Procházení všech zdrojů dat

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Zdroj dat: ${ds.key}, Zobrazované jméno: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Kolekce: ${col.name}`);
  }
}
```

### Dynamický výběr zdroje dat na základě proměnných

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Poznámky

- Formát cesty pro `getCollectionField` je `dataSourceKey.collectionName.fieldPath`, kde první segment je klíč zdroje dat, následovaný názvem kolekce a cestou k poli.
- `getDataSource(key)` vrací `undefined`, pokud zdroj dat neexistuje; před použitím doporučujeme provést kontrolu na prázdnou hodnotu.
- `addDataSource` vyvolá výjimku, pokud klíč již existuje; `upsertDataSource` buď přepíše stávající, nebo přidá nový.

## Související

- [ctx.dataSource](./data-source.md): Instance aktuálního zdroje dat
- [ctx.collection](./collection.md): Kolekce spojená s aktuálním kontextem
- [ctx.collectionField](./collection-field.md): Definice pole kolekce pro aktuální pole