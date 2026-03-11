:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Der Datenquellen-Manager (`DataSourceManager`-Instanz) wird verwendet, um mehrere Datenquellen zu verwalten und darauf zuzugreifen (z. B. die Hauptdatenbank `main`, die Protokoll-Datenbank `logging` usw.). Er kommt zum Einsatz, wenn mehrere Datenquellen vorhanden sind oder ein Zugriff auf Metadaten über verschiedene Datenquellen hinweg erforderlich ist.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **Mehrere Datenquellen** | Alle Datenquellen aufzählen oder eine bestimmte Datenquelle anhand des Keys abrufen. |
| **Datenquellenübergreifender Zugriff** | Zugriff auf Metadaten im Format „Datenquellen-Key + Sammlungsname“, wenn die Datenquelle des aktuellen Kontexts unbekannt ist. |
| **Felder über den vollständigen Pfad abrufen** | Verwendung des Formats `dataSourceKey.collectionName.fieldPath`, um Felddefinitionen über verschiedene Datenquellen hinweg abzurufen. |

> Hinweis: Wenn Sie nur mit der aktuellen Datenquelle arbeiten, verwenden Sie vorrangig `ctx.dataSource`. Nutzen Sie `ctx.dataSourceManager` nur dann, wenn Sie Datenquellen aufzählen oder zwischen ihnen wechseln müssen.

## Typdefinition

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Datenquellen-Verwaltung
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Datenquellen lesen
  getDataSources(): DataSource[];                     // Alle Datenquellen abrufen
  getDataSource(key: string): DataSource | undefined;  // Datenquelle anhand des Keys abrufen

  // Direkter Zugriff auf Metadaten über Datenquelle + Sammlung
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Beziehung zu ctx.dataSource

| Anforderung | Empfohlene Verwendung |
|------|----------|
| **Einzelne Datenquelle, die an den aktuellen Kontext gebunden ist** | `ctx.dataSource` (z. B. die Datenquelle der aktuellen Seite/des aktuellen Blocks) |
| **Einstiegspunkt für alle Datenquellen** | `ctx.dataSourceManager` |
| **Datenquellen auflisten oder wechseln** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Sammlung innerhalb der aktuellen Datenquelle abrufen** | `ctx.dataSource.getCollection(name)` |
| **Sammlung über Datenquellen hinweg abrufen** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Feld innerhalb der aktuellen Datenquelle abrufen** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Feld über Datenquellen hinweg abrufen** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Beispiele

### Eine bestimmte Datenquelle abrufen

```ts
// Die Datenquelle mit dem Namen 'main' abrufen
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Alle Sammlungen unter dieser Datenquelle abrufen
const collections = mainDS?.getCollections();
```

### Sammlungs-Metadaten über Datenquellen hinweg abrufen

```ts
// Sammlung über dataSourceKey + collectionName abrufen
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Primärschlüssel der Sammlung abrufen
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Felddefinition über den vollständigen Pfad abrufen

```ts
// Format: dataSourceKey.collectionName.fieldPath
// Felddefinition über „Datenquellen-Key.Sammlungsname.Feldpfad“ abrufen
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Unterstützt Pfade für Verknüpfungsfelder
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Alle Datenquellen durchlaufen

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Datenquelle: ${ds.key}, Anzeigename: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Sammlung: ${col.name}`);
  }
}
```

### Datenquelle basierend auf Variablen dynamisch auswählen

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Hinweise

- Das Pfadformat für `getCollectionField` ist `dataSourceKey.collectionName.fieldPath`, wobei das erste Segment der Datenquellen-Key ist, gefolgt vom Sammlungsnamen und dem Feldpfad.
- `getDataSource(key)` gibt `undefined` zurück, falls die Datenquelle nicht existiert; es wird empfohlen, vor der Verwendung eine Prüfung auf Nullwerte durchzuführen.
- `addDataSource` löst eine Ausnahme aus, wenn der Key bereits existiert; `upsertDataSource` überschreibt entweder die bestehende Datenquelle oder fügt eine neue hinzu.

## Verwandte Themen

- [ctx.dataSource](./data-source.md): Aktuelle Datenquellen-Instanz
- [ctx.collection](./collection.md): Mit dem aktuellen Kontext verknüpfte Sammlung
- [ctx.collectionField](./collection-field.md): Sammlungsfeld-Definition für das aktuelle Feld