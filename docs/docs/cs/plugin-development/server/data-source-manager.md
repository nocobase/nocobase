:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# DataSourceManager Správa zdrojů dat

NocoBase poskytuje `DataSourceManager` pro správu více zdrojů dat. Každý `DataSource` má vlastní instance `Database`, `ResourceManager` a `ACL`, což vývojářům umožňuje flexibilně spravovat a rozšiřovat více zdrojů dat.

## Základní koncepty

Každá instance `DataSource` obsahuje následující:

- **`dataSource.collectionManager`**: Slouží ke správě kolekcí a polí.
- **`dataSource.resourceManager`**: Zpracovává operace související se zdroji (například CRUD apod.).
- **`dataSource.acl`**: Řízení přístupu (ACL) pro operace se zdroji.

Pro pohodlný přístup jsou k dispozici zkratky (aliasy) pro členy hlavního zdroje dat:

- `app.db` je ekvivalentní `dataSourceManager.get('main').collectionManager.db`
- `app.acl` je ekvivalentní `dataSourceManager.get('main').acl`
- `app.resourceManager` je ekvivalentní `dataSourceManager.get('main').resourceManager`

## Běžné metody

### dataSourceManager.get(dataSourceKey)

Tato metoda vrací specifikovanou instanci `DataSource`.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Registruje middleware pro všechny zdroje dat. To ovlivní operace na všech zdrojích dat.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Spouští se před načtením zdroje dat. Běžně se používá pro registraci statických tříd, například tříd modelů a typů polí:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Vlastní typ pole
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Spouští se po načtení zdroje dat. Běžně se používá pro registraci operací, nastavení řízení přístupu apod.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Nastavení přístupových oprávnění
});
```

## Rozšíření zdroje dat

Kompletní rozšíření zdroje dat naleznete v kapitole o rozšíření zdroje dat.