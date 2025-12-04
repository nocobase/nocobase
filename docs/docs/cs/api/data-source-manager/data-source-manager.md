:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# DataSourceManager

`DataSourceManager` je třída pro správu více instancí `dataSource`.

## API

### add()
Přidá instanci `dataSource`.

#### Podpis

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Přidá globální middleware k instanci `dataSource`.

### middleware()

Získá middleware aktuální instance `DataSourceManager`, který lze použít pro zpracování HTTP požadavků.

### afterAddDataSource()

Funkce háčku (hook), která se volá po přidání nové instance `dataSource`.

#### Podpis

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registruje typ zdroje dat a jeho třídu.

#### Podpis

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Získá třídu zdroje dat.

#### Podpis

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Vytvoří instanci zdroje dat na základě registrovaného typu zdroje dat a konfiguračních možností instance.

#### Podpis

- `buildDataSourceByType(type: string, options: any): DataSource`