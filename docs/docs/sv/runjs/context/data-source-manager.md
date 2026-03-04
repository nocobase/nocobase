:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Datakällshanteraren (`DataSourceManager`-instans) används för att hantera och få åtkomst till flera datakällor (t.ex. huvuddatabasen `main`, loggdatabasen `logging` osv.). Den används när det finns flera datakällor eller när åtkomst till metadata krävs mellan olika datakällor.

## Tillämpningsområden

| Scenario | Beskrivning |
|------|------|
| **Flerdatakällor** | Lista alla datakällor eller hämta en specifik datakälla via nyckel. |
| **Åtkomst mellan datakällor** | Få åtkomst till metadata med formatet "datakällans nyckel + samlingsnamn" när datakällan i den aktuella kontexten är okänd. |
| **Hämta fält via fullständig sökväg** | Använd formatet `dataSourceKey.collectionName.fieldPath` för att hämta fältdefinitioner mellan olika datakällor. |

> **Observera:** Om ni endast arbetar med den aktuella datakällan bör ni prioritera att använda `ctx.dataSource`. Använd `ctx.dataSourceManager` endast när ni behöver lista eller växla mellan datakällor.

## Typdefinition

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Hantering av datakällor
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Läs datakällor
  getDataSources(): DataSource[];                     // Hämta alla datakällor
  getDataSource(key: string): DataSource | undefined;  // Hämta datakälla via nyckel

  // Få åtkomst till metadata direkt via datakälla + samling
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relation till ctx.dataSource

| Behov | Rekommenderad användning |
|------|----------|
| **Enskild datakälla bunden till den aktuella kontexten** | `ctx.dataSource` (t.ex. datakällan för den aktuella sidan/blocket) |
| **Ingångspunkt för alla datakällor** | `ctx.dataSourceManager` |
| **Lista eller växla datakällor** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Hämta samling inom den aktuella datakällan** | `ctx.dataSource.getCollection(name)` |
| **Hämta samling mellan datakällor** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Hämta fält inom den aktuella datakällan** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Hämta fält mellan datakällor** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Exempel

### Hämta en specifik datakälla

```ts
// Hämta datakällan med namnet 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Hämta alla samlingar under denna datakälla
const collections = mainDS?.getCollections();
```

### Åtkomst till metadata för samlingar mellan datakällor

```ts
// Hämta samling via dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Hämta samlingens primärnyckel
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Hämta fältdefinition via fullständig sökväg

```ts
// Format: dataSourceKey.collectionName.fieldPath
// Hämta fältdefinition via "datakällans nyckel.samlingsnamn.fältsökväg"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Stöder sökvägar för associationsfält
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Iterera genom alla datakällor

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Datakälla: ${ds.key}, Visningsnamn: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Samling: ${col.name}`);
  }
}
```

### Välj datakälla dynamiskt baserat på variabler

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Observera

- Sökvägsformatet för `getCollectionField` är `dataSourceKey.collectionName.fieldPath`, där det första segmentet är datakällans nyckel, följt av samlingsnamnet och fältsökvägen.
- `getDataSource(key)` returnerar `undefined` om datakällan inte finns; det rekommenderas att göra en kontroll för null-värden före användning.
- `addDataSource` kastar ett undantag om nyckeln redan finns; `upsertDataSource` skriver antingen över den befintliga eller lägger till en ny.

## Relaterat

- [ctx.dataSource](./data-source.md): Aktuell datakällsinstans
- [ctx.collection](./collection.md): Samling associerad med den aktuella kontexten
- [ctx.collectionField](./collection-field.md): Samlingsfältsdefinition för det aktuella fältet