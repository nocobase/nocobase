:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevensbronbeheer

NocoBase biedt de `DataSourceManager` voor het beheren van meerdere gegevensbronnen. Elke `DataSource` heeft zijn eigen `Database`-, `ResourceManager`- en `ACL`-instanties, wat ontwikkelaars de flexibiliteit geeft om meerdere gegevensbronnen te beheren en uit te breiden.

## Basisconcepten

Elke `DataSource`-instantie bevat het volgende:

- **`dataSource.collectionManager`**: Wordt gebruikt voor het beheren van collecties en velden.
- **`dataSource.resourceManager`**: Verwerkt resource-gerelateerde bewerkingen (zoals CRUD, enz.).
- **`dataSource.acl`**: Toegangscontrole (ACL) voor resourcebewerkingen.

Voor gemakkelijke toegang zijn er aliassen beschikbaar voor de leden van de hoofdgegevensbron:

- `app.db` is equivalent aan `dataSourceManager.get('main').collectionManager.db`
- `app.acl` is equivalent aan `dataSourceManager.get('main').acl`
- `app.resourceManager` is equivalent aan `dataSourceManager.get('main').resourceManager`

## Veelgebruikte methoden

### dataSourceManager.get(dataSourceKey)

Deze methode retourneert de opgegeven `DataSource`-instantie.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Registreer middleware voor alle gegevensbronnen. Dit heeft invloed op de bewerkingen van alle gegevensbronnen.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Wordt uitgevoerd voordat een gegevensbron wordt geladen. Vaak gebruikt voor de registratie van statische klassen, zoals modelklassen en veldtypen:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Aangepast veldtype
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Wordt uitgevoerd nadat een gegevensbron is geladen. Vaak gebruikt voor het registreren van bewerkingen, het instellen van toegangscontrole, enz.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Stel toegangsrechten in
});
```

## Gegevensbronuitbreiding

Voor een volledige gegevensbronuitbreiding verwijzen wij u naar het hoofdstuk over gegevensbronuitbreiding.