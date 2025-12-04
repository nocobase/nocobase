:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# DataSourceManager

`DataSourceManager` to klasa zarządzająca wieloma instancjami `dataSource`.

## API

### add()
Dodaje instancję `dataSource`.

#### Sygnatura

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Dodaje globalne oprogramowanie pośredniczące (middleware) do instancji `dataSource`.

### middleware()

Pobiera oprogramowanie pośredniczące (middleware) bieżącej instancji `dataSourceManager`, które może być używane do obsługi żądań HTTP.

### afterAddDataSource()

Funkcja haka (hook), która jest wywoływana po dodaniu nowej instancji `dataSource`.

#### Sygnatura

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Rejestruje typ źródła danych (data source) oraz jego klasę.

#### Sygnatura

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Pobiera klasę źródła danych (data source).

#### Sygnatura

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Tworzy instancję źródła danych (data source) na podstawie zarejestrowanego typu źródła danych i opcji instancji.

#### Sygnatura

- `buildDataSourceByType(type: string, options: any): DataSource`