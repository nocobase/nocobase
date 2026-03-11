:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/data-source).
:::

# ctx.dataSource

`DataSource`-instansen bunden till den aktuella RunJS-exekveringskontexten, som används för att komma åt samlingar, fältmetadata och hantera samlingskonfigurationer **inom den aktuella datakällan**. Den motsvarar vanligtvis den datakälla som valts för den aktuella sidan eller blocket (t.ex. huvuddatabasen `main`).

##适用场景 (Användningsområden)

| Scenario | Beskrivning |
|------|------|
| **Operationer för enskild datakälla** | Hämta metadata för samlingar och fält när den aktuella datakällan är känd. |
| **Hantering av samlingar** | Hämta, lägg till, uppdatera eller ta bort samlingar under den aktuella datakällan. |
| **Hämta fält via sökväg** | Använd formatet `samlingsnamn.fältsökväg` för att hämta fältdefinitioner (stöder associationssökvägar). |

> Observera: `ctx.dataSource` representerar en enskild datakälla för den aktuella kontexten; för att räkna upp eller komma åt andra datakällor, vänligen använd [ctx.dataSourceManager](./data-source-manager.md).

## Typdefinition

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Skrivskyddade egenskaper
  get flowEngine(): FlowEngine;   // Aktuell FlowEngine-instans
  get displayName(): string;      // Visningsnamn (stöder i18n)
  get key(): string;              // Datakällans nyckel, t.ex. 'main'
  get name(): string;             // Samma som key

  // Läsning av samlingar
  getCollections(): Collection[];                      // Hämta alla samlingar
  getCollection(name: string): Collection | undefined; // Hämta samling efter namn
  getAssociation(associationName: string): CollectionField | undefined; // Hämta associationsfält (t.ex. users.roles)

  // Hantering av samlingar
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadata för fält
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Vanliga egenskaper

| Egenskap | Typ | Beskrivning |
|------|------|------|
| `key` | `string` | Datakällans nyckel, t.ex. `'main'` |
| `name` | `string` | Samma som key |
| `displayName` | `string` | Visningsnamn (stöder i18n) |
| `flowEngine` | `FlowEngine` | Aktuell FlowEngine-instans |

## Vanliga metoder

| Metod | Beskrivning |
|------|------|
| `getCollections()` | Hämtar alla samlingar under den aktuella datakällan (sorterade, med dolda bortfiltrerade). |
| `getCollection(name)` | Hämtar en samling efter namn; `name` kan vara `samlingsnamn.fältnamn` för att hämta målsamlingen för en association. |
| `getAssociation(associationName)` | Hämtar en definition för ett associationsfält via `samlingsnamn.fältnamn`. |
| `getCollectionField(fieldPath)` | Hämtar en fältdefinition via `samlingsnamn.fältsökväg`, stöder associationssökvägar som `users.profile.avatar`. |

## Relation till ctx.dataSourceManager

| Behov | Rekommenderad användning |
|------|----------|
| **Enskild datakälla bunden till aktuell kontext** | `ctx.dataSource` |
| **Ingångspunkt för alla datakällor** | `ctx.dataSourceManager` |
| **Hämta samling inom aktuell datakälla** | `ctx.dataSource.getCollection(name)` |
| **Hämta samling mellan olika datakällor** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Hämta fält inom aktuell datakälla** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Hämta fält mellan olika datakällor** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Exempel

### Hämta samlingar och fält

```ts
// Hämta alla samlingar
const collections = ctx.dataSource.getCollections();

// Hämta samling efter namn
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Hämta fältdefinition via "samlingsnamn.fältsökväg" (stöder associationer)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Hämta associationsfält

```ts
// Hämta definition för associationsfält via samlingsnamn.fältnamn
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Bearbeta baserat på målsamlingens struktur
}
```

### Iterera genom samlingar för dynamisk bearbetning

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Utför validering eller dynamiskt användargränssnitt baserat på fältmetadata

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Utför UI-logik eller validering baserat på interface, enum, validering etc.
}
```

## Observera

- Sökvägsformatet för `getCollectionField(fieldPath)` är `samlingsnamn.fältsökväg`, där det första segmentet är samlingsnamnet och de efterföljande segmenten är fältsökvägen (stöder associationer, t.ex. `user.name`).
- `getCollection(name)` stöder formatet `samlingsnamn.fältnamn` och returnerar målsamlingen för associationsfältet.
- I RunJS-kontexten bestäms `ctx.dataSource` vanligtvis av datakällan för det aktuella blocket eller sidan. Om ingen datakälla är bunden till kontexten kan den vara `undefined`; det rekommenderas att ni gör en kontroll för null-värden före användning.

## Relaterat

- [ctx.dataSourceManager](./data-source-manager.md): Datakällshanterare, hanterar alla datakällor.
- [ctx.collection](./collection.md): Samlingen associerad med den aktuella kontexten.
- [ctx.collectionField](./collection-field.md): Samlingsfältets definition för det aktuella fältet.