:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# DataSourceManager

`DataSourceManager` is de beheerklasse voor meerdere `gegevensbron`-instanties.

## API

### add()
Voegt een `gegevensbron`-instantie toe.

#### Signatuur

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Voegt globale middleware toe aan de `gegevensbron`-instantie.

### middleware()

Haalt de middleware op van de huidige `dataSourceManager`-instantie, die kan worden gebruikt om op HTTP-verzoeken te reageren.

### afterAddDataSource()

Een hook-functie die wordt aangeroepen nadat een nieuwe `gegevensbron` is toegevoegd.

#### Signatuur

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registreert een gegevensbrontype en de bijbehorende klasse.

#### Signatuur

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Haalt de gegevensbronklasse op.

#### Signatuur

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Creëert een gegevensbron-instantie op basis van het geregistreerde gegevensbrontype en de instantie-opties.

#### Signatuur

- `buildDataSourceByType(type: string, options: any): DataSource`