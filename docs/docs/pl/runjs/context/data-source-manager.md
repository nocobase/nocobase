:::tip{title="Powiadomienie o tłumaczeniu AI"}
Ten dokument został przetłumaczony przez AI. Aby uzyskać dokładne informacje, zapoznaj się z [wersją angielską](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Menedżer źródeł danych (instancja `DataSourceManager`) służy do zarządzania wieloma źródłami danych i uzyskiwania do nich dostępu (np. główna baza danych `main`, baza logów `logging` itp.). Jest on używany w sytuacjach, gdy istnieje wiele źródeł danych lub gdy wymagany jest dostęp do metadanych między różnymi źródłami danych.

## Scenariusze użycia

| Scenariusz | Opis |
|------|------|
| **Wiele źródeł danych** | Wyliczanie wszystkich źródeł danych lub pobieranie konkretnego źródła danych za pomocą klucza (key). |
| **Dostęp między źródłami danych** | Dostęp do metadanych przy użyciu formatu „klucz źródła danych + nazwa kolekcji”, gdy źródło danych bieżącego kontekstu jest nieznane. |
| **Pobieranie pól za pomocą pełnej ścieżki** | Użycie formatu `dataSourceKey.collectionName.fieldPath` do pobierania definicji pól z różnych źródeł danych. |

> Uwaga: Jeśli operują Państwo tylko na bieżącym źródle danych, należy priorytetowo traktować użycie `ctx.dataSource`. Z `ctx.dataSourceManager` należy korzystać tylko wtedy, gdy konieczne jest wyliczenie lub przełączenie się między źródłami danych.

## Definicja typu

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Zarządzanie źródłami danych
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Odczyt źródeł danych
  getDataSources(): DataSource[];                     // Pobiera wszystkie źródła danych
  getDataSource(key: string): DataSource | undefined;  // Pobiera źródło danych za pomocą klucza

  // Bezpośredni dostęp do metadanych przez źródło danych + kolekcję
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relacja z ctx.dataSource

| Potrzeba | Zalecane użycie |
|------|----------|
| **Pojedyncze źródło danych powiązane z bieżącym kontekstem** | `ctx.dataSource` (np. źródło danych bieżącej strony/bloku) |
| **Punkt wejścia dla wszystkich źródeł danych** | `ctx.dataSourceManager` |
| **Listowanie lub przełączanie źródeł danych** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Pobieranie kolekcji w ramach bieżącego źródła danych** | `ctx.dataSource.getCollection(name)` |
| **Pobieranie kolekcji między źródłami danych** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Pobieranie pola w ramach bieżącego źródła danych** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Pobieranie pola między źródłami danych** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Przykłady

### Pobieranie konkretnego źródła danych

```ts
// Pobranie źródła danych o nazwie 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Pobranie wszystkich kolekcji w ramach tego źródła danych
const collections = mainDS?.getCollections();
```

### Dostęp do metadanych kolekcji między źródłami danych

```ts
// Pobranie kolekcji za pomocą dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Pobranie klucza głównego kolekcji
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Pobieranie definicji pola za pomocą pełnej ścieżki

```ts
// Format: dataSourceKey.collectionName.fieldPath
// Pobranie definicji pola za pomocą „klucz źródła danych.nazwa kolekcji.ścieżka pola”
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Obsługa ścieżek pól powiązań (association fields)
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Iteracja przez wszystkie źródła danych

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Źródło danych: ${ds.key}, Nazwa wyświetlana: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Kolekcja: ${col.name}`);
  }
}
```

### Dynamiczny wybór źródła danych na podstawie zmiennych

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Uwagi

- Format ścieżki dla `getCollectionField` to `dataSourceKey.collectionName.fieldPath`, gdzie pierwszy segment to klucz źródła danych, a następnie nazwa kolekcji i ścieżka pola.
- `getDataSource(key)` zwraca `undefined`, jeśli źródło danych nie istnieje; przed użyciem zaleca się sprawdzenie, czy wartość nie jest pusta.
- `addDataSource` zgłosi wyjątek, jeśli klucz już istnieje; `upsertDataSource` nadpisze istniejące źródło lub doda nowe.

## Powiązane

- [ctx.dataSource](./data-source.md): Bieżąca instancja źródła danych
- [ctx.collection](./collection.md): Kolekcja powiązana z bieżącym kontekstem
- [ctx.collectionField](./collection-field.md): Definicja pola kolekcji dla bieżącego pola