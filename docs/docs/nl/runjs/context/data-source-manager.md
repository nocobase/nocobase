:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/data-source-manager) voor nauwkeurige informatie.
:::

# ctx.dataSourceManager

De gegevensbronbeheerder (`DataSourceManager`-instantie) wordt gebruikt voor het beheren en openen van meerdere gegevensbronnen (bijv. de hoofddatabase `main`, de logdatabase `logging`, enz.). Deze wordt gebruikt wanneer er meerdere gegevensbronnen aanwezig zijn of wanneer toegang tot metadata over verschillende gegevensbronnen heen vereist is.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Meerdere gegevensbronnen** | Alle gegevensbronnen opsommen of een specifieke gegevensbron ophalen via de sleutel (key). |
| **Toegang over gegevensbronnen heen** | Metadata benaderen met de indeling "gegevensbron-key + collectienaam" wanneer de gegevensbron van de huidige context onbekend is. |
| **Velden ophalen via volledig pad** | Gebruik de indeling `dataSourceKey.collectieNaam.veldPad` om velddefinities uit verschillende gegevensbronnen op te halen. |

> Let op: Als u alleen op de huidige gegevensbron werkt, geef dan de voorkeur aan `ctx.dataSource`. Gebruik `ctx.dataSourceManager` alleen wanneer u gegevensbronnen wilt opsommen of ertussen wilt schakelen.

## Type-definitie

```ts
dataSourceManager: DataSourceManager;

class DataSourceManager {
  constructor();

  // Beheer van gegevensbronnen
  addDataSource(ds: DataSource | DataSourceOptions): void;
  upsertDataSource(ds: DataSource | DataSourceOptions): void;
  removeDataSource(key: string): void;
  clearDataSources(): void;

  // Gegevensbronnen lezen
  getDataSources(): DataSource[];                     // Haal alle gegevensbronnen op
  getDataSource(key: string): DataSource | undefined;  // Haal gegevensbron op via key

  // Directe toegang tot metadata via gegevensbron + collectie
  getCollection(dataSourceKey: string, collectionName: string): Collection | undefined;
  getCollectionField(fieldPathWithDataSource: string): CollectionField | undefined;
}
```

## Relatie met ctx.dataSource

| Behoefte | Aanbevolen gebruik |
|------|----------|
| **Enkele gegevensbron gekoppeld aan de huidige context** | `ctx.dataSource` (bijv. de gegevensbron van de huidige pagina/het huidige blok) |
| **Toegangspunt voor alle gegevensbronnen** | `ctx.dataSourceManager` |
| **Gegevensbronnen weergeven of wisselen** | `ctx.dataSourceManager.getDataSources()` / `getDataSource(key)` |
| **Collectie ophalen binnen de huidige gegevensbron** | `ctx.dataSource.getCollection(name)` |
| **Collectie ophalen over verschillende gegevensbronnen heen** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Veld ophalen binnen de huidige gegevensbron** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Veld ophalen over verschillende gegevensbronnen heen** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Voorbeelden

### Een specifieke gegevensbron ophalen

```ts
// Haal de gegevensbron genaamd 'main' op
const mainDS = ctx.dataSourceManager.getDataSource('main');

// Haal alle collecties onder deze gegevensbron op
const collections = mainDS?.getCollections();
```

### Metadata van collecties benaderen over verschillende gegevensbronnen heen

```ts
// Haal collectie op via dataSourceKey + collectionName
const users = ctx.dataSourceManager.getCollection('main', 'users');
const orders = ctx.dataSourceManager.getCollection('main', 'orders');

// Haal de primaire sleutel van de collectie op
const primaryKey = users?.filterTargetKey ?? 'id';
```

### Velddefinitie ophalen via het volledige pad

```ts
// Indeling: dataSourceKey.collectionName.fieldPath
// Haal velddefinitie op via "gegevensbron-key.collectienaam.veldpad"
const field = ctx.dataSourceManager.getCollectionField('main.users.profile.avatar');

// Ondersteunt paden voor associatievelden
const userNameField = ctx.dataSourceManager.getCollectionField('main.orders.createdBy.name');
```

### Door alle gegevensbronnen itereren

```ts
const dataSources = ctx.dataSourceManager.getDataSources();
for (const ds of dataSources) {
  ctx.logger.info(`Gegevensbron: ${ds.key}, Weergavenaam: ${ds.displayName}`);
  const collections = ds.getCollections();
  for (const col of collections) {
    ctx.logger.info(`  - Collectie: ${col.name}`);
  }
}
```

### Dynamisch een gegevensbron selecteren op basis van variabelen

```ts
const dsKey = ctx.getVar('dataSourceKey') ?? 'main';
const collectionName = ctx.getVar('collectionName') ?? 'users';
const col = ctx.dataSourceManager.getCollection(dsKey, collectionName);
if (col) {
  const fields = col.getFields();
  // ...
}
```

## Opmerkingen

- De padindeling voor `getCollectionField` is `dataSourceKey.collectionName.fieldPath`, waarbij het eerste segment de key van de gegevensbron is, gevolgd door de collectienaam en het veldpad.
- `getDataSource(key)` retourneert `undefined` als de gegevensbron niet bestaat; het wordt aanbevolen om een controle op null-waarden uit te voeren voor gebruik.
- `addDataSource` werpt een uitzondering als de key al bestaat; `upsertDataSource` overschrijft de bestaande bron of voegt een nieuwe toe.

## Gerelateerd

- [ctx.dataSource](./data-source.md): Huidige instantie van de gegevensbron
- [ctx.collection](./collection.md): Collectie gekoppeld aan de huidige context
- [ctx.collectionField](./collection-field.md): Velddefinitie van de collectie voor het huidige veld