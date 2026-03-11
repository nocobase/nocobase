:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/data-source-manager).
:::

# ctx.dataSourceManager

Il gestore delle fonti dati (istanza di `DataSourceManager`) viene utilizzato per gestire e accedere a più fonti dati (ad esempio, il database principale `main`, il database dei log `logging`, ecc.). Viene impiegato quando esistono più fonti dati o quando è necessario l'accesso ai metadati tra diverse fonti dati.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **Multi-fonte dati** | Elencare tutte le fonti dati o ottenere una specifica fonte dati tramite chiave (key). |
| **Accesso tra fonti dati** | Accedere ai metadati utilizzando il formato "chiave fonte dati + nome collezione" quando la fonte dati del contesto corrente è sconosciuta. |
| **Ottenere campi tramite percorso completo** | Utilizzare il formato `dataSourceKey.collectionName.fieldPath` per recuperare le definizioni dei campi tra diverse fonti dati. |

> Nota: Se opera solo sulla fonte dati corrente, dia la priorità all'uso di `ctx.dataSource`. Utilizzi `ctx.dataSourceManager` solo quando è necessario enumerare o passare da una fonte dati all'altra.

## Definizione del tipo

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Gestione delle fonti dati
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Lettura delle fonti dati
  getDataSources(): DataSource[];                     // Ottiene tutte le fonti dati
  getDataSource(key: string): DataSource | undefined;  // Ottiene la fonte dati tramite chiave

  // Accesso ai metadati direttamente tramite fonte dati + collezione
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relazione con ctx.dataSource

| Requisito | Utilizzo consigliato |
|------|----------|
| **Singola fonte dati legata al contesto corrente** | `ctx.dataSource` (es. la fonte dati della pagina/blocco corrente) |
| **Punto di ingresso per tutte le fonti dati** | `ctx.dataSourceManager` |
| **Elencare o cambiare fonti dati** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Ottenere una collezione nella fonte dati corrente** | `ctx.dataSource.getCollection(name)` |
| **Ottenere una collezione tra diverse fonti dati** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Ottenere un campo nella fonte dati corrente** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Ottenere un campo tra diverse fonti dati** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Esempi

### Ottenere una fonte dati specifica

```ts
// Ottiene la fonte dati denominata 'main'
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Ottiene tutte le collezioni di questa fonte dati
const collections = mainDS?.getCollections();
```

### Accedere ai metadati della collezione tra fonti dati

```ts
// Ottiene la collezione tramite dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Ottiene la chiave primaria della collezione
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Ottenere la definizione del campo tramite percorso completo

```ts
// Formato: dataSourceKey.collectionName.fieldPath
// Ottiene la definizione del campo tramite "chiave fonte dati.nome collezione.percorso campo"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Supporta i percorsi dei campi di associazione
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Iterare attraverso tutte le fonti dati

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Fonte dati: ${ds.key}, Nome visualizzato: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Collezione: ${col.name}`);
  }
}
```

### Selezionare dinamicamente la fonte dati in base alle variabili

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Note

- Il formato del percorso per `getCollectionField` è `dataSourceKey.collectionName.fieldPath`, dove il primo segmento è la chiave della fonte dati, seguito dal nome della collezione e dal percorso del campo.
- `getDataSource(key)` restituisce `undefined` se la fonte dati non esiste; si consiglia di eseguire un controllo di validità prima dell'uso.
- `addDataSource` solleverà un'eccezione se la chiave esiste già; `upsertDataSource` sovrascriverà quella esistente o ne aggiungerà una nuova.

## Correlati

- [ctx.dataSource](./data-source.md): Istanza della fonte dati corrente
- [ctx.collection](./collection.md): Collezione associata al contesto corrente
- [ctx.collectionField](./collection-field.md): Definizione del campo della collezione per il campo corrente