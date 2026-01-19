:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# DataSourceManager – Zarządzanie źródłami danych

NocoBase udostępnia `DataSourceManager` do zarządzania wieloma źródłami danych. Każde `źródło danych` (DataSource) ma swoje własne instancje `Database`, `ResourceManager` i `ACL`, co ułatwia deweloperom elastyczne zarządzanie i rozszerzanie wielu źródeł danych.

## Podstawowe koncepcje

Każda instancja `DataSource` zawiera następujące elementy:

- **`dataSource.collectionManager`**: Służy do zarządzania kolekcjami i polami.
- **`dataSource.resourceManager`**: Obsługuje operacje związane z zasobami (takie jak tworzenie, odczytywanie, aktualizowanie, usuwanie – CRUD itp.).
- **`dataSource.acl`**: Kontrola dostępu (ACL) dla operacji na zasobach.

Dla wygodnego dostępu dostępne są aliasy dla głównych członków źródła danych:

- `app.db` jest równoważne z `dataSourceManager.get('main').collectionManager.db`
- `app.acl` jest równoważne z `dataSourceManager.get('main').acl`
- `app.resourceManager` jest równoważne z `dataSourceManager.get('main').resourceManager`

## Popularne metody

### dataSourceManager.get(dataSourceKey)

Ta metoda zwraca określoną instancję `DataSource`.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Rejestruje oprogramowanie pośredniczące (middleware) dla wszystkich źródeł danych. Będzie to miało wpływ na operacje wykonywane na wszystkich źródłach danych.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Wykonuje się przed załadowaniem źródła danych. Często używane do rejestracji klas statycznych, takich jak klasy modeli i rejestracja typów pól:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Niestandardowy typ pola
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Wykonuje się po załadowaniu źródła danych. Często używane do rejestracji operacji, ustawiania kontroli dostępu itp.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Ustawianie uprawnień dostępu
});
```

## Rozszerzanie źródeł danych

Aby uzyskać pełne informacje na temat rozszerzania źródeł danych, proszę zapoznać się z [rozdziałem poświęconym rozszerzaniu źródeł danych](#).