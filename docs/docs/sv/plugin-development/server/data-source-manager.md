:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# DataSourceManager – Hantering av datakällor

NocoBase erbjuder `DataSourceManager` för hantering av flera datakällor. Varje `DataSource` har sina egna instanser av `Database`, `ResourceManager` och `ACL`, vilket gör det enkelt för utvecklare att flexibelt hantera och utöka flera datakällor.

## Grundläggande koncept

Varje `DataSource`-instans innehåller följande:

- **`dataSource.collectionManager`**: Används för att hantera samlingar och fält.
- **`dataSource.resourceManager`**: Hanterar resursrelaterade operationer (t.ex. CRUD).
- **`dataSource.acl`**: Åtkomstkontroll (ACL) för resursoperationer.

För enklare åtkomst tillhandahålls snabbalias för huvuddatakällans medlemmar:

- `app.db` motsvarar `dataSourceManager.get('main').collectionManager.db`
- `app.acl` motsvarar `dataSourceManager.get('main').acl`
- `app.resourceManager` motsvarar `dataSourceManager.get('main').resourceManager`

## Vanliga metoder

### dataSourceManager.get(dataSourceKey)

Denna metod returnerar den angivna `DataSource`-instansen.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Registrerar middleware för alla datakällor. Detta kommer att påverka operationer på samtliga datakällor.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('Detta middleware gäller för alla datakällor.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Körs innan en datakälla laddas. Används ofta för registrering av statiska klasser, som modellklasser och fälttyper:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Anpassad fälttyp
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Körs efter att en datakälla har laddats. Används ofta för att registrera operationer, ställa in åtkomstkontroll med mera.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Ställ in åtkomstbehörighet
});
```

## Utökning av datakällor

För en fullständig beskrivning av datakälleutökning, se kapitlet om [datakälleutökning](#).