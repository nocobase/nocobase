:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# DataSourceManager

`DataSourceManager` är hanteringsklassen för flera `dataSource`-instanser.

## API

### add()
Lägger till en `dataSource`-instans.

#### Signatur

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Lägger till globala middleware till `dataSource`-instansen.

### middleware()

Hämtar middleware för den aktuella `dataSourceManager`-instansen, som kan användas för att svara på HTTP-förfrågningar.

### afterAddDataSource()

En hook-funktion som anropas efter att en ny `dataSource` har lagts till.

#### Signatur

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registrerar en datakällstyp och dess klass.

#### Signatur

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Hämtar datakällsklassen.

#### Signatur

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Skapar en datakälleinstans baserat på den registrerade datakällstypen och instansalternativen.

#### Signatur

- `buildDataSourceByType(type: string, options: any): DataSource`