:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/data-source).
:::

# ctx.dataSource

L'istanza della fonte dati (`DataSource`) associata al contesto di esecuzione RunJS corrente, utilizzata per accedere alle collezioni, ai metadati dei campi e per gestire le configurazioni delle collezioni **all'interno della fonte dati corrente**. Solitamente corrisponde alla fonte dati selezionata per la pagina o il blocco corrente (ad esempio, il database principale `main`).

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **Operazioni su singola fonte dati** | Ottenere metadati di collezioni e campi quando la fonte dati corrente è nota. |
| **Gestione delle collezioni** | Ottenere, aggiungere, aggiornare o eliminare collezioni sotto la fonte dati corrente. |
| **Ottenere campi tramite percorso** | Utilizzare il formato `nomeCollezione.percorsoCampo` per ottenere le definizioni dei campi (supporta i percorsi di associazione). |

> Nota: `ctx.dataSource` rappresenta una singola fonte dati per il contesto corrente. Per enumerare o accedere ad altre fonti dati, utilizzi [ctx.dataSourceManager](./data-source-manager.md).

## Definizione del tipo

```ts
dataSource: DataSource;

class DataSource {
  constructor(options?: Record<string, any>);

  // Proprietà in sola lettura
  get flowEngine(): FlowEngine;   // Istanza corrente di FlowEngine
  get displayName(): string;      // Nome visualizzato (supporta i18n)
  get key(): string;              // Chiave della fonte dati, es. 'main'
  get name(): string;             // Uguale alla chiave

  // Lettura delle collezioni
  getCollections(): Collection[];                      // Ottiene tutte le collezioni
  getCollection(name: string): Collection | undefined; // Ottiene una collezione per nome
  getAssociation(associationName: string): CollectionField | undefined; // Ottiene un campo di associazione (es. users.roles)

  // Gestione delle collezioni
  addCollection(collection: Collection | CollectionOptions): void;
  updateCollection(newOptions: CollectionOptions): void;
  upsertCollection(options: CollectionOptions): Collection | undefined;
  upsertCollections(collections: CollectionOptions[], options?: { clearFields?: boolean }): void;
  removeCollection(name: string): void;
  clearCollections(): void;

  // Metadati dei campi
  getCollectionField(fieldPath: string): CollectionField | undefined;
}
```

## Proprietà comuni

| Proprietà | Tipo | Descrizione |
|------|------|------|
| `key` | `string` | Chiave della fonte dati, es. `'main'` |
| `name` | `string` | Uguale alla chiave |
| `displayName` | `string` | Nome visualizzato (supporta i18n) |
| `flowEngine` | `FlowEngine` | Istanza corrente di FlowEngine |

## Metodi comuni

| Metodo | Descrizione |
|------|------|
| `getCollections()` | Ottiene tutte le collezioni sotto la fonte dati corrente (ordinate, con quelle nascoste filtrate). |
| `getCollection(name)` | Ottiene una collezione per nome; `name` può essere `nomeCollezione.nomeCampo` per ottenere la collezione di destinazione di un'associazione. |
| `getAssociation(associationName)` | Ottiene la definizione di un campo di associazione tramite `nomeCollezione.nomeCampo`. |
| `getCollectionField(fieldPath)` | Ottiene la definizione di un campo tramite `nomeCollezione.percorsoCampo`, supportando percorsi di associazione come `users.profile.avatar`. |

## Relazione con ctx.dataSourceManager

| Esigenza | Utilizzo raccomandato |
|------|----------|
| **Singola fonte dati legata al contesto corrente** | `ctx.dataSource` |
| **Punto di ingresso per tutte le fonti dati** | `ctx.dataSourceManager` |
| **Ottenere una collezione nella fonte dati corrente** | `ctx.dataSource.getCollection(name)` |
| **Ottenere una collezione tra diverse fonti dati** | `ctx.dataSourceManager.getCollection(dataSourceKey, collectionName)` |
| **Ottenere un campo nella fonte dati corrente** | `ctx.dataSource.getCollectionField('users.profile.avatar')` |
| **Ottenere un campo tra diverse fonti dati** | `ctx.dataSourceManager.getCollectionField('main.users.profile.avatar')` |

## Esempio

### Ottenere collezioni e campi

```ts
// Ottiene tutte le collezioni
const collections = ctx.dataSource.getCollections();

// Ottiene una collezione per nome
const users = ctx.dataSource.getCollection('users');
const primaryKey = users?.filterTargetKey ?? 'id';

// Ottiene la definizione del campo tramite "nomeCollezione.percorsoCampo" (supporta associazioni)
const field = ctx.dataSource.getCollectionField('users.profile.avatar');
const userNameField = ctx.dataSource.getCollectionField('orders.createdBy.name');
```

### Ottenere campi di associazione

```ts
// Ottiene la definizione del campo di associazione tramite nomeCollezione.nomeCampo
const rolesField = ctx.dataSource.getAssociation('users.roles');
if (rolesField?.isAssociationField()) {
  const targetCol = rolesField.targetCollection;
  // Elaborazione basata sulla struttura della collezione di destinazione
}
```

### Iterare attraverso le collezioni per l'elaborazione dinamica

```ts
const collections = ctx.dataSource.getCollections();
for (const col of collections) {
  const fields = col.getFields();
  const requiredFields = fields.filter((f) => f.options?.required);
  // ...
}
```

### Eseguire validazioni o UI dinamica basata sui metadati dei campi

```ts
const field = ctx.dataSource.getCollectionField('users.status');
if (field) {
  const options = field.enum ?? [];
  const operators = field.getFilterOperators();
  // Esegue la logica UI o la validazione basata su interface, enum, validation, ecc.
}
```

## Note

- Il formato del percorso per `getCollectionField(fieldPath)` è `nomeCollezione.percorsoCampo`, dove il primo segmento è il nome della collezione e i segmenti successivi sono il percorso del campo (supporta le associazioni, es. `user.name`).
- `getCollection(name)` supporta il formato `nomeCollezione.nomeCampo`, restituendo la collezione di destinazione del campo di associazione.
- Nel contesto RunJS, `ctx.dataSource` è solitamente determinato dalla fonte dati del blocco o della pagina corrente. Se nessuna fonte dati è legata al contesto, potrebbe essere `undefined`; si consiglia di eseguire un controllo di nullità prima dell'uso.

## Correlati

- [ctx.dataSourceManager](./data-source-manager.md): Gestore delle fonti dati, gestisce tutte le fonti dati.
- [ctx.collection](./collection.md): La collezione associata al contesto corrente.
- [ctx.collectionField](./collection-field.md): La definizione del campo della collezione per il campo corrente.