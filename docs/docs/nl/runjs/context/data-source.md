:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/data-source) voor nauwkeurige informatie.
:::

# ctx.dataSource

De `DataSource`-instantie die is gekoppeld aan de huidige RunJS-uitvoeringscontext, gebruikt om toegang te krijgen tot collecties, veld-metadata en om collectieconfiguraties te beheren **binnen de huidige gegevensbron**. Dit komt meestal overeen met de gegevensbron die is geselecteerd voor de huidige pagina of het huidige blok (bijv. de hoofddatabase `main`).

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **Bewerkingen op een enkele gegevensbron** | Haal metadata van collecties en velden op wanneer de huidige gegevensbron bekend is. |
| **Collectiebeheer** | Collecties ophalen, toevoegen, bijwerken of verwijderen onder de huidige gegevensbron. |
| **Velden ophalen via pad** | Gebruik het formaat `collectieNaam.veldPad` om velddefinities op te halen (ondersteunt associatiepaden). |

> Let op: `ctx.dataSource` vertegenwoordigt een enkele gegevensbron voor de huidige context. Om andere gegevensbronnen op te sommen of te openen, gebruikt u [ctx.dataSourceManager](./data-source-manager.md).

## Type-definitie

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Alleen-lezen eigenschappen
  get flowEngine(): FlowEngine;   // Huidige FlowEngine-instantie
  get displayName(): string;      // Weergavenaam (ondersteunt i18n)
  get key(): string;              // Gegevensbron-key, bijv. 'main'
  get name(): string;             // Zelfde als key

  // Collecties lezen
  getCollections(): Collection[];                      // Haal alle collecties op
  getCollection(name: string): Collection | undefined; // Haal collectie op per naam
  getAssociation(associationName: string): CollectionField | undefined; // Haal associatieveld op (bijv. users.roles)

  // Collectiebeheer
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Veld-metadata
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Veelvoorkomende eigenschappen

| Eigenschap | Type | Beschrijving |
|------|------|------|
| `key` | `string` | Gegevensbron-key, bijv. `'main'` |
| `name` | `string` | Zelfde als key |
| `displayName` | `string` | Weergavenaam (ondersteunt i18n) |
| `flowEngine` | `FlowEngine` | Huidige FlowEngine-instantie |

## Veelvoorkomende methoden

| Methode | Beschrijving |
|------|------|
| `getCollections()` | Haalt alle collecties op onder de huidige gegevensbron (gesorteerd, verborgen collecties zijn gefilterd). |
| `getCollection(name)` | Haalt een collectie op per naam; `name` kan `collectieNaam.veldNaam` zijn om de doelcollectie van een associatie op te halen. |
| `getAssociation(associationName)` | Haalt een associatievelddefinitie op via `collectieNaam.veldNaam`. |
| `getCollectionField(fieldPath)` | Haalt een velddefinitie op via `collectieNaam.veldPad`, ondersteunt associatiepaden zoals `users.profile.avatar`. |

## Relatie met ctx.dataSourceManager

| Behoefte | Aanbevolen gebruik |
|------|----------|
| **Enkele gegevensbron gekoppeld aan de huidige context** | `ctx.dataSource` |
| **Toegangspunt voor alle gegevensbronnen** | `ctx.dataSourceManager` |
| **Collectie ophalen binnen de huidige gegevensbron** | `ctx.dataSource.getCollection(name)` |
| **Collectie ophalen over verschillende gegevensbronnen heen** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Veld ophalen binnen de huidige gegevensbron** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Veld ophalen over verschillende gegevensbronnen heen** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Voorbeeld

### Collecties en velden ophalen

```ts
// Haal alle collecties op
const collections = ctx.dataSource.getCollections();

// Haal collectie op per naam
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Haal velddefinitie op via "collectieNaam.veldPad" (ondersteunt associaties)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Associatievelden ophalen

```ts
// Haal associatievelddefinitie op via collectieNaam.veldNaam
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Verwerken op basis van de structuur van de doelcollectie
}
```

### Door collecties itereren voor dynamische verwerking

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Validatie of dynamische UI uitvoeren op basis van veld-metadata

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Voer UI-logica of validatie uit op basis van interface, enum, validatie, etc.
}
```

## Opmerkingen

- Het padformaat voor `getCollectionField(fieldPath)` is `collectieNaam.veldPad`, waarbij het eerste segment de collectienaam is en de volgende segmenten het veldpad vormen (ondersteunt associaties, bijv. `user.name`).
- `getCollection(name)` ondersteunt het formaat `collectieNaam.veldNaam`, waarbij de doelcollectie van het associatieveld wordt geretourneerd.
- In de RunJS-context wordt `ctx.dataSource` meestal bepaald door de gegevensbron van het huidige blok of de huidige pagina. Als er geen gegevensbron aan de context is gekoppeld, kan deze `undefined` zijn; het wordt aanbevolen om een controle op nulwaarden (null check) uit te voeren voor gebruik.

## Gerelateerd

- [ctx.dataSourceManager](./data-source-manager.md): Gegevensbronbeheerder, beheert alle gegevensbronnen.
- [ctx.collection](./collection.md): De collectie die is gekoppeld aan de huidige context.
- [ctx.collectionField](./collection-field.md): De collectievelddefinitie voor het huidige veld.