:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# Database

## Panoramica

`Database` è lo strumento di interazione con il database fornito da NocoBase, che offre funzionalità molto convenienti per le applicazioni no-code e low-code. Attualmente, i database supportati sono:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Connettersi al Database

Nel costruttore `Database`, è possibile configurare la connessione al database passando il parametro `options`.

```javascript
const { Database } = require('@nocobase/database');

// Parametri di configurazione per il database SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Parametri di configurazione per il database MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' o 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Per i parametri di configurazione dettagliati, La preghiamo di consultare [Costruttore](#costruttore).

### Definizione del Modello Dati

`Database` definisce la struttura del database tramite `collezione`. Un oggetto `collezione` rappresenta una tabella nel database.

```javascript
// Definisce una collezione
const UserCollection = database.collection({
  name: 'users',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'age',
      type: 'integer',
    },
  ],
});
```

Dopo aver definito la struttura del database, può utilizzare il metodo `sync()` per sincronizzarla.

```javascript
await database.sync();
```

Per un utilizzo più dettagliato delle `collezioni`, La preghiamo di fare riferimento a [Collection](/api/database/collection).

### Lettura e Scrittura dei Dati

`Database` opera sui dati tramite `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Crea
await UserRepository.create({
  name: 'John',
  age: 18,
});

// Esegue una query
const user = await UserRepository.findOne({
  filter: {
    name: 'John',
  },
});

// Aggiorna
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Elimina
await UserRepository.destroy(user.id);
```

Per un utilizzo più dettagliato delle operazioni CRUD sui dati, La preghiamo di fare riferimento a [Repository](/api/database/repository).

## Costruttore

**Firma**

- `constructor(options: DatabaseOptions)`

Crea un'istanza del database.

**Parametri**

| Parametro                 | Tipo           | Valore predefinito | Descrizione                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Host del database                                                                                                          |
| `options.port`         | `number`       | -             | Porta del servizio database, con una porta predefinita corrispondente al database utilizzato                        |
| `options.username`     | `string`       | -             | Nome utente del database                                                                                                        |
| `options.password`     | `string`       | -             | Password del database                                                                                                          |
| `options.database`     | `string`       | -             | Nome del database                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | Tipo di database                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | Modalità di archiviazione per SQLite                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | Se abilitare la registrazione dei log                                                                                                        |
| `options.define?`      | `Object`       | `{}`          | Parametri di definizione della tabella predefiniti                                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | Estensione NocoBase, prefisso del nome della tabella                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | Estensione NocoBase, parametri relativi al gestore delle migrazioni; La preghiamo di fare riferimento all'implementazione di [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Metodi relativi alle Migrazioni

### `addMigration()`

Aggiunge un singolo file di migrazione.

**Firma**

- `addMigration(options: MigrationItem)`

**Parametri**

| Parametro               | Tipo               | Valore predefinito | Descrizione                   |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name`       | `string`           | -      | Nome del file di migrazione           |
| `options.context?`   | `string`           | -      | Contesto del file di migrazione       |
| `options.migration?` | `typeof Migration` | -      | Classe personalizzata per il file di migrazione     |
| `options.up`         | `Function`         | -      | Metodo `up` del file di migrazione   |
| `options.down`       | `Function`         | -      | Metodo `down` del file di migrazione |

**Esempio**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* your migration sqls */);
  },
});
```

### `addMigrations()`

Aggiunge i file di migrazione da una directory specificata.

**Firma**

- `addMigrations(options: AddMigrationsOptions): void`

**Parametri**

| Parametro               | Tipo       | Valore predefinito | Descrizione             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | `''`           | Directory in cui si trovano i file di migrazione |
| `options.extensions` | `string[]` | `['js', 'ts']` | Estensioni dei file       |
| `options.namespace?` | `string`   | `''`           | Namespace         |
| `options.context?`   | `Object`   | `{ db }`       | Contesto del file di migrazione |

**Esempio**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Metodi di Utilità

### `inDialect()`

Verifica se il tipo di database attuale corrisponde a uno dei tipi specificati.

**Firma**

- `inDialect(dialect: string[]): boolean`

**Parametri**

| Parametro    | Tipo       | Valore predefinito | Descrizione                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | Tipo di database, i valori possibili sono `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Recupera il prefisso del nome della tabella dalla configurazione.

**Firma**

- `getTablePrefix(): string`

## Configurazione delle collezioni

### `collection()`

Definisce una collezione. Questa chiamata è simile al metodo `define` di Sequelize, creando la struttura della tabella solo in memoria. Per renderla persistente nel database, è necessario richiamare il metodo `sync`.

**Firma**

- `collection(options: CollectionOptions): Collection`

**Parametri**

Tutti i parametri di configurazione di `options` sono coerenti con il costruttore della classe `collezione`; La preghiamo di fare riferimento a [Collection](/api/database/collection#costruttore).

**Eventi**

- `'beforeDefineCollection'`: Attivato prima di definire una collezione.
- `'afterDefineCollection'`: Attivato dopo aver definito una collezione.

**Esempio**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'float',
      name: 'price',
    },
  ],
});

// sincronizza la collezione come tabella nel db
await db.sync();
```

### `getCollection()`

Recupera una collezione definita.

**Firma**

- `getCollection(name: string): Collection`

**Parametri**

| Parametro | Tipo     | Valore predefinito | Descrizione |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nome della collezione |

**Esempio**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Verifica se una collezione specificata è stata definita.

**Firma**

- `hasCollection(name: string): boolean`

**Parametri**

| Parametro | Tipo     | Valore predefinito | Descrizione |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nome della collezione |

**Esempio**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Rimuove una collezione definita. Viene rimossa solo dalla memoria; per rendere persistente la modifica, è necessario richiamare il metodo `sync`.

**Firma**

- `removeCollection(name: string): void`

**Parametri**

| Parametro | Tipo     | Valore predefinito | Descrizione |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | Nome della collezione |

**Eventi**

- `'beforeRemoveCollection'`: Attivato prima di rimuovere una collezione.
- `'afterRemoveCollection'`: Attivato dopo aver rimosso una collezione.

**Esempio**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importa tutti i file di una directory come configurazioni di collezione in memoria.

**Firma**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parametri**

| Parametro               | Tipo       | Valore predefinito | Descrizione             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | -              | Percorso della directory da importare |
| `options.extensions` | `string[]` | `['ts', 'js']` | Scansiona per suffissi specifici     |

**Esempio**

La collezione definita nel file `./collections/books.ts` è la seguente:

```ts
export default {
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
};
```

Importi la configurazione pertinente al caricamento del plugin:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Registrazione e Recupero delle Estensioni

### `registerFieldTypes()`

Registra tipi di campo personalizzati.

**Firma**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parametri**

`fieldTypes` è una coppia chiave-valore in cui la chiave è il nome del tipo di campo e il valore è la classe del tipo di campo.

**Esempio**

```ts
import { Field } from '@nocobase/database';

class MyField extends Field {
  // ...
}

db.registerFieldTypes({
  myField: MyField,
});
```

### `registerModels()`

Registra classi di modelli dati personalizzati.

**Firma**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parametri**

`models` è una coppia chiave-valore in cui la chiave è il nome del modello e il valore è la classe del modello.

**Esempio**

```ts
import { Model } from '@nocobase/database';

class MyModel extends Model {
  // ...
}

db.registerModels({
  myModel: MyModel,
});

db.collection({
  name: 'myCollection',
  model: 'myModel',
});
```

### `registerRepositories()`

Registra classi di repository personalizzati.

**Firma**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parametri**

`repositories` è una coppia chiave-valore in cui la chiave è il nome del repository e il valore è la classe del repository.

**Esempio**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  // ...
}

db.registerRepositories({
  myRepository: MyRepository,
});

db.collection({
  name: 'myCollection',
  repository: 'myRepository',
});
```

### `registerOperators()`

Registra operatori di query dati personalizzati.

**Firma**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parametri**

`operators` è una coppia chiave-valore in cui la chiave è il nome dell'operatore e il valore è la funzione che genera l'istruzione di confronto.

**Esempio**

```ts
db.registerOperators({
  $dateOn(value) {
    return {
      [Op.and]: [
        { [Op.gte]: stringToDate(value) },
        { [Op.lt]: getNextDay(value) },
      ],
    };
  },
});

db.getRepository('books').count({
  filter: {
    createdAt: {
      // operatore registrato
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Recupera una classe di modello dati definita. Se nessuna classe di modello personalizzata è stata precedentemente registrata, verrà restituita la classe di modello predefinita di Sequelize. Il nome predefinito è lo stesso del nome della collezione.

**Firma**

- `getModel(name: string): Model`

**Parametri**

| Parametro | Tipo     | Valore predefinito | Descrizione           |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | Nome del modello registrato |

**Esempio**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Nota: La classe del modello ottenuta da una collezione non è strettamente uguale alla classe del modello registrata, ma ne eredita le proprietà. Poiché le proprietà della classe del modello di Sequelize vengono modificate durante l'inizializzazione, NocoBase gestisce automaticamente questa relazione di ereditarietà. Ad eccezione della disuguaglianza di classe, tutte le altre definizioni possono essere utilizzate normalmente.

### `getRepository()`

Recupera una classe di repository personalizzata. Se nessuna classe di repository personalizzata è stata precedentemente registrata, verrà restituita la classe di repository predefinita di NocoBase. Il nome predefinito è lo stesso del nome della collezione.

Le classi Repository sono utilizzate principalmente per le operazioni CRUD basate sui modelli dati; La preghiamo di fare riferimento a [Repository](/api/database/repository).

**Firma**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parametri**

| Parametro       | Tipo                 | Valore predefinito | Descrizione               |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | Nome del repository registrato |
| `relationId` | `string` \| `number` | -      | Valore della chiave esterna per i dati relazionali   |

Quando il nome è un nome di associazione come `'tables.relations'`, verrà restituita la classe di repository associata. Se viene fornito il secondo parametro, il repository si baserà sul valore della chiave esterna dei dati relazionali quando utilizzato (per query, aggiornamenti, ecc.).

**Esempio**

Supponiamo che ci siano due collezioni, *articoli* e *autori*, e che la collezione degli articoli abbia una chiave esterna che punta alla collezione degli autori:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Eventi del Database

### `on()`

Si mette in ascolto degli eventi del database.

**Firma**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parametri**

| Parametro   | Tipo     | Valore predefinito | Descrizione       |
| -------- | -------- | ------ | ---------- |
| event    | string   | -      | Nome dell'evento   |
| listener | Function | -      | Listener dell'evento |

I nomi degli eventi supportano per impostazione predefinita gli eventi Model di Sequelize. Per gli eventi globali, si metta in ascolto utilizzando il formato `<sequelize_model_global_event>`, mentre per gli eventi di un singolo Model, utilizzi il formato `<model_name>.<sequelize_model_event>`.

Per le descrizioni dei parametri e gli esempi dettagliati di tutti i tipi di eventi integrati, La preghiamo di fare riferimento alla sezione [Eventi Integrati](#eventi-integrati).

### `off()`

Rimuove una funzione listener di evento.

**Firma**

- `off(name: string, listener: Function)`

**Parametri**

| Parametro   | Tipo     | Valore predefinito | Descrizione       |
| -------- | -------- | ------ | ---------- |
| name     | string   | -      | Nome dell'evento   |
| listener | Function | -      | Listener dell'evento |

**Esempio**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Operazioni sul Database

### `auth()`

Autenticazione della connessione al database. Può essere utilizzata per assicurarsi che l'applicazione abbia stabilito una connessione con i dati.

**Firma**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parametri**

| Parametro                 | Tipo                  | Valore predefinito | Descrizione               |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | Opzioni di autenticazione           |
| `options.retry?`       | `number`              | `10`    | Numero di tentativi in caso di fallimento dell'autenticazione |
| `options.transaction?` | `Transaction`         | -       | Oggetto transazione           |
| `options.logging?`     | `boolean \| Function` | `false` | Se abilitare la stampa dei log       |

**Esempio**

```ts
await db.auth();
```

### `reconnect()`

Riconnette al database.

**Esempio**

```ts
await db.reconnect();
```

### `closed()`

Verifica se la connessione al database è chiusa.

**Firma**

- `closed(): boolean`

### `close()`

Chiude la connessione al database. Equivalente a `sequelize.close()`.

### `sync()`

Sincronizza la struttura della collezione del database. Equivalente a `sequelize.sync()`; per i parametri, La preghiamo di fare riferimento alla [documentazione di Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Pulisce il database, eliminando tutte le collezioni.

**Firma**

- `clean(options: CleanOptions): Promise<void>`

**Parametri**

| Parametro                | Tipo          | Valore predefinito | Descrizione               |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | Se eliminare tutte le collezioni |
| `options.skip`        | `string[]`    | -       | Configurazione dei nomi delle collezioni da saltare     |
| `options.transaction` | `Transaction` | -       | Oggetto transazione           |

**Esempio**

Rimuove tutte le collezioni ad eccezione della collezione `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Esportazioni a livello di Pacchetto

### `defineCollection()`

Crea il contenuto di configurazione per una collezione.

**Firma**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parametri**

| Parametro              | Tipo                | Valore predefinito | Descrizione                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Uguale a tutti i parametri di `db.collection()` |

**Esempio**

Per un file di configurazione di collezione da importare tramite `db.import()`:

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'users',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
});
```

### `extendCollection()`

Estende il contenuto di configurazione di una collezione già in memoria, principalmente per i contenuti di file importati tramite il metodo `import()`. Questo metodo è un metodo di alto livello esportato dal pacchetto `@nocobase/database` e non viene chiamato tramite un'istanza del database. Può essere utilizzato anche l'alias `extend`.

**Firma**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parametri**

| Parametro              | Tipo                | Valore predefinito | Descrizione                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Uguale a tutti i parametri di `db.collection()`                            |
| `mergeOptions?`     | `MergeOptions`      | -      | Parametri per il pacchetto npm [deepmerge](https://npmjs.com/package/deepmerge) |

**Esempio**

Definizione originale della collezione di libri (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Definizione estesa della collezione di libri (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// estende nuovamente
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Se i due file sopra vengono importati richiamando `import()`, dopo essere stati nuovamente estesi con `extend()`, la collezione dei libri avrà entrambi i campi `title` e `price`.

Questo metodo è molto utile per estendere le strutture delle collezioni già definite dai plugin esistenti.

## Eventi Integrati

Il database attiva i seguenti eventi corrispondenti in diverse fasi del suo ciclo di vita. Iscrivendosi ad essi con il metodo `on()` è possibile effettuare elaborazioni specifiche per soddisfare determinate esigenze aziendali.

### `'beforeSync'` / `'afterSync'`

Attivato prima e dopo che una nuova configurazione della struttura della collezione (campi, indici, ecc.) viene sincronizzata con il database. Di solito viene attivato quando viene eseguito `collection.sync()` (chiamata interna) ed è generalmente utilizzato per gestire la logica di estensioni speciali dei campi.

**Firma**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Tipo**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Esempio**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // esegue qualcosa
});

db.on('users.afterSync', async (options) => {
  // esegue qualcosa
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Prima di creare o aggiornare i dati, avviene un processo di validazione basato sulle regole definite nella collezione. Gli eventi corrispondenti vengono attivati prima e dopo la validazione. Questo viene attivato quando viene richiamato `repository.create()` o `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Tipo**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Esempio**

```ts
db.collection({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'email',
      validate: {
        isEmail: true,
      },
    },
  ],
});

// tutti i modelli
db.on('beforeValidate', async (model, options) => {
  // esegue qualcosa
});
// modello tests
db.on('tests.beforeValidate', async (model, options) => {
  // esegue qualcosa
});

// tutti i modelli
db.on('afterValidate', async (model, options) => {
  // esegue qualcosa
});
// modello tests
db.on('tests.afterValidate', async (model, options) => {
  // esegue qualcosa
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // verifica il formato dell'email
  },
});
// oppure
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // verifica il formato dell'email
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Gli eventi corrispondenti vengono attivati prima e dopo la creazione di un record. Questo viene attivato quando viene richiamato `repository.create()`.

**Firma**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Tipo**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } = '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Esempio**

```ts
db.on('beforeCreate', async (model, options) => {
  // esegue qualcosa
});

db.on('books.afterCreate', async (model, options) => {
  const { transaction } = options;
  const result = await model.constructor.findByPk(model.id, {
    transaction,
  });
  console.log(result);
});
```

### `'beforeUpdate'` / `'afterUpdate'`

Gli eventi corrispondenti vengono attivati prima e dopo l'aggiornamento di un record. Questo viene attivato quando viene richiamato `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Tipo**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } = '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Esempio**

```ts
db.on('beforeUpdate', async (model, options) => {
  // esegue qualcosa
});

db.on('books.afterUpdate', async (model, options) => {
  // esegue qualcosa
});
```

### `'beforeSave'` / `'afterSave'`

Gli eventi corrispondenti vengono attivati prima e dopo la creazione o l'aggiornamento di un record. Questo viene attivato quando viene richiamato `repository.create()` o `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Tipo**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } = '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Esempio**

```ts
db.on('beforeSave', async (model, options) => {
  // esegue qualcosa
});

db.on('books.afterSave', async (model, options) => {
  // esegue qualcosa
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Gli eventi corrispondenti vengono attivati prima e dopo l'eliminazione di un record. Questo viene attivato quando viene richiamato `repository.destroy()`.

**Firma**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Tipo**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } = '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Esempio**

```ts
db.on('beforeDestroy', async (model, options) => {
  // esegue qualcosa
});

db.on('books.afterDestroy', async (model, options) => {
  // esegue qualcosa
});
```

### `'afterCreateWithAssociations'`

Questo evento viene attivato dopo la creazione di un record con dati di associazione gerarchica. Viene attivato quando viene richiamato `repository.create()`.

**Firma**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipo**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } = '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Esempio**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // esegue qualcosa
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // esegue qualcosa
});
```

### `'afterUpdateWithAssociations'`

Questo evento viene attivato dopo l'aggiornamento di un record con dati di associazione gerarchica. Viene attivato quando viene richiamato `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tipo**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } = '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Esempio**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // esegue qualcosa
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // esegue qualcosa
});
```

### `'afterSaveWithAssociations'`

Questo evento viene attivato dopo la creazione o l'aggiornamento di un record con dati di associazione gerarchica. Viene attivato quando viene richiamato `repository.create()` o `repository.update()`.

**Firma**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Tipo**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } = '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Esempio**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // esegue qualcosa
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // esegue qualcosa
});
```

### `'beforeDefineCollection'`

Attivato prima che una collezione venga definita, ad esempio quando viene richiamato `db.collection()`.

Nota: Questo è un evento sincrono.

**Firma**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Tipo**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Esempio**

```ts
db.on('beforeDefineCollection', (options) => {
  // esegue qualcosa
});
```

### `'afterDefineCollection'`

Attivato dopo che una collezione viene definita, ad esempio quando viene richiamato `db.collection()`.

Nota: Questo è un evento sincrono.

**Firma**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Tipo**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Esempio**

```ts
db.on('afterDefineCollection', (collection) => {
  // esegue qualcosa
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Attivato prima e dopo che una collezione viene rimossa dalla memoria, ad esempio quando viene richiamato `db.removeCollection()`.

Nota: Questo è un evento sincrono.

**Firma**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Tipo**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Esempio**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // esegue qualcosa
});

db.on('afterRemoveCollection', (collection) => {
  // esegue qualcosa
});
```