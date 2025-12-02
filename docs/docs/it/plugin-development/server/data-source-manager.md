:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# DataSourceManager Gestione delle Fonti Dati

NocoBase offre `DataSourceManager` per la gestione di più fonti dati. Ogni `DataSource` ha le proprie istanze di `Database`, `ResourceManager` e `ACL`, facilitando agli sviluppatori la gestione flessibile e l'estensione di più fonti dati.

## Concetti Base

Ogni istanza di `DataSource` include quanto segue:

-   **`dataSource.collectionManager`**: Utilizzato per gestire collezioni e campi.
-   **`dataSource.resourceManager`**: Gestisce le operazioni relative alle risorse (ad esempio, creazione, lettura, aggiornamento, eliminazione, ecc.).
-   **`dataSource.acl`**: Controllo degli accessi (ACL) per le operazioni sulle risorse.

Per un accesso più comodo, sono forniti alias rapidi per i membri della fonte dati principale:

-   `app.db` è equivalente a `dataSourceManager.get('main').collectionManager.db`
-   `app.acl` è equivalente a `dataSourceManager.get('main').acl`
-   `app.resourceManager` è equivalente a `dataSourceManager.get('main').resourceManager`

## Metodi Comuni

### dataSourceManager.get(dataSourceKey)

Questo metodo restituisce l'istanza `DataSource` specificata.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Registra un middleware per tutte le fonti dati. Questo influenzerà le operazioni su tutte le fonti dati.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('Questo middleware si applica a tutte le fonti dati.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Esegue prima del caricamento della fonte dati. È comunemente usato per la registrazione di classi statiche, come classi di modello e tipi di campo:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Tipo di campo personalizzato
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Esegue dopo il caricamento della fonte dati. È comunemente usato per registrare operazioni, impostare il controllo degli accessi, ecc.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Imposta i permessi di accesso
});
```

## Estensione delle Fonti Dati

Per un'estensione completa delle fonti dati, si prega di fare riferimento al capitolo sull'estensione delle fonti dati.