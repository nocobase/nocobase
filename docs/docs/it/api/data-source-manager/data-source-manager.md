:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# DataSourceManager

`DataSourceManager` è la classe di gestione per le istanze multiple di `dataSource`.

## API

### add()
Aggiunge un'istanza di `dataSource`.

#### Firma

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Aggiunge un middleware globale all'istanza di `dataSource`.

### middleware()

Recupera il middleware dell'istanza `dataSourceManager` corrente, utilizzabile per rispondere alle richieste HTTP.

### afterAddDataSource()

Una funzione hook che viene richiamata dopo l'aggiunta di un nuovo `dataSource`.

#### Firma

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registra un tipo di fonte dati e la sua classe.

#### Firma

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Recupera la classe della fonte dati.

#### Firma

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Crea un'istanza di fonte dati basata sul tipo di fonte dati registrato e sulle opzioni dell'istanza.

#### Firma

- `buildDataSourceByType(type: string, options: any): DataSource`