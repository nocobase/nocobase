:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Datenbank

## Übersicht

Die Datenbank ist ein von NocoBase bereitgestelltes Tool zur Datenbankinteraktion, das No-Code- und Low-Code-Anwendungen sehr komfortable Funktionen für die Datenbankinteraktion bietet. Derzeit werden folgende Datenbanken unterstützt:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Datenbank verbinden

Im `Database`-Konstruktor können Sie die Datenbankverbindung konfigurieren, indem Sie den Parameter `options` übergeben.

```javascript
const { Database } = require('@nocobase/database');

// Konfigurationsparameter für SQLite-Datenbank
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Konfigurationsparameter für MySQL- \ PostgreSQL-Datenbank
const database = new Database({
  dialect: /* 'postgres' oder 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Detaillierte Konfigurationsparameter finden Sie unter [Konstruktor](#constructor).

### Datenmodell-Definition

`Database` definiert die Datenbankstruktur über `Sammlung` (Collection). Ein `Sammlung`-Objekt repräsentiert eine Tabelle in der Datenbank.

```javascript
// Sammlung definieren
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

Nachdem die Datenbankstruktur definiert wurde, können Sie die Methode `sync()` verwenden, um die Datenbankstruktur zu synchronisieren.

```javascript
await database.sync();
```

Eine detailliertere Verwendung von `Sammlung` finden Sie unter [Sammlung](/api/database/collection).

### Daten lesen/schreiben

`Database` führt Datenoperationen über `Repository` aus.

```javascript
const UserRepository = UserCollection.repository();

// Erstellen
await UserRepository.create({
  name: '张三',
  age: 18,
});

// Abfragen
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// Aktualisieren
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Löschen
await UserRepository.destroy(user.id);
```

Eine detailliertere Verwendung von Daten-CRUD finden Sie unter [Repository](/api/database/repository).

## Konstruktor

**Signatur**

- `constructor(options: DatabaseOptions)`

Erstellt eine Datenbankinstanz.

**Parameter**

| Parametername          | Typ            | Standardwert  | Beschreibung                                                                                                                |
| :--------------------- | :------------- | :------------ | :-------------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Datenbank-Host                                                                                                              |
| `options.port`         | `number`       | -             | Datenbank-Service-Port, mit einem entsprechenden Standard-Port je nach verwendeter Datenbank                                |
| `options.username`     | `string`       | -             | Datenbank-Benutzername                                                                                                      |
| `options.password`     | `string`       | -             | Datenbank-Passwort                                                                                                          |
| `options.database`     | `string`       | -             | Datenbankname                                                                                                               |
| `options.dialect`      | `string`       | `'mysql'`     | Datenbanktyp                                                                                                                |
| `options.storage?`     | `string`       | `':memory:'`  | Speichermodus für SQLite                                                                                                    |
| `options.logging?`     | `boolean`      | `false`       | Ob die Protokollierung aktiviert werden soll                                                                                |
| `options.define?`      | `Object`       | `{}`          | Standardparameter für die Tabellendefinition                                                                                |
| `options.tablePrefix?` | `string`       | `''`          | NocoBase-Erweiterung, Tabellenpräfix                                                                                        |
| `options.migrator?`    | `UmzugOptions` | `{}`          | NocoBase-Erweiterung, Parameter für den Migrationsmanager, siehe [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) Implementierung |

## Migrationsbezogene Methoden

### `addMigration()`

Fügt eine einzelne Migrationsdatei hinzu.

**Signatur**

- `addMigration(options: MigrationItem)`

**Parameter**

| Parametername        | Typ                | Standardwert | Beschreibung                               |
| :------------------- | :----------------- | :----------- | :----------------------------------------- |
| `options.name`       | `string`           | -            | Name der Migrationsdatei                   |
| `options.context?`   | `string`           | -            | Kontext der Migrationsdatei                |
| `options.migration?` | `typeof Migration` | -            | Benutzerdefinierte Klasse für die Migrationsdatei |
| `options.up`         | `Function`         | -            | `up`-Methode der Migrationsdatei           |
| `options.down`       | `Function`         | -            | `down`-Methode der Migrationsdatei         |

**Beispiel**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* Ihre Migrations-SQLs */);
  },
});
```

### `addMigrations()`

Fügt Migrationsdateien aus einem angegebenen Verzeichnis hinzu.

**Signatur**

- `addMigrations(options: AddMigrationsOptions): void`

**Parameter**

| Parametername        | Typ        | Standardwert   | Beschreibung                      |
| :------------------- | :--------- | :------------- | :-------------------------------- |
| `options.directory`  | `string`   | `''`           | Verzeichnis der Migrationsdateien |
| `options.extensions` | `string[]` | `['js', 'ts']` | Dateierweiterungen                |
| `options.namespace?` | `string`   | `''`           | Namespace                         |
| `options.context?`   | `Object`   | `{ db }`       | Kontext der Migrationsdatei       |

**Beispiel**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Hilfsmethoden

### `inDialect()`

Prüft, ob der aktuelle Datenbanktyp einem der angegebenen Typen entspricht.

**Signatur**

- `inDialect(dialect: string[]): boolean`

**Parameter**

| Parametername | Typ        | Standardwert | Beschreibung                                             |
| :------------ | :--------- | :----------- | :------------------------------------------------------- |
| `dialect`     | `string[]` | -            | Datenbanktyp, mögliche Werte sind `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Ruft das Tabellenpräfix aus der Konfiguration ab.

**Signatur**

- `getTablePrefix(): string`

## Sammlungs-Konfiguration

### `collection()`

Definiert eine Sammlung. Dieser Aufruf ähnelt der `define`-Methode von Sequelize und erstellt die Tabellenstruktur nur im Speicher. Um sie in der Datenbank zu persistieren, müssen Sie die `sync`-Methode aufrufen.

**Signatur**

- `collection(options: CollectionOptions): Collection`

**Parameter**

Alle `options`-Konfigurationsparameter stimmen mit dem Konstruktor der `Sammlung`-Klasse überein, siehe [Sammlung](/api/database/collection#构造函数).

**Ereignisse**

- `'beforeDefineCollection'`: Wird vor der Definition einer Sammlung ausgelöst.
- `'afterDefineCollection'`: Wird nach der Definition einer Sammlung ausgelöst.

**Beispiel**

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

// Sammlung als Tabelle mit der Datenbank synchronisieren
await db.sync();
```

### `getCollection()`

Ruft eine definierte Sammlung ab.

**Signatur**

- `getCollection(name: string): Collection`

**Parameter**

| Parametername | Typ      | Standardwert | Beschreibung  |
| :------------ | :------- | :----------- | :------------ |
| `name`        | `string` | -            | Sammlungsname |

**Beispiel**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Prüft, ob eine bestimmte Sammlung definiert wurde.

**Signatur**

- `hasCollection(name: string): boolean`

**Parameter**

| Parametername | Typ      | Standardwert | Beschreibung  |
| :------------ | :------- | :----------- | :------------ |
| `name`        | `string` | -            | Sammlungsname |

**Beispiel**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Entfernt eine definierte Sammlung. Sie wird nur aus dem Speicher entfernt; um die Änderung zu persistieren, müssen Sie die `sync`-Methode aufrufen.

**Signatur**

- `removeCollection(name: string): void`

**Parameter**

| Parametername | Typ      | Standardwert | Beschreibung  |
| :------------ | :------- | :----------- | :------------ |
| `name`        | `string` | -            | Sammlungsname |

**Ereignisse**

- `'beforeRemoveCollection'`: Wird vor dem Entfernen einer Sammlung ausgelöst.
- `'afterRemoveCollection'`: Wird nach dem Entfernen einer Sammlung ausgelöst.

**Beispiel**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importiert alle Dateien in einem Verzeichnis als Sammlungs-Konfigurationen in den Speicher.

**Signatur**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parameter**

| Parametername        | Typ        | Standardwert   | Beschreibung                            |
| :------------------- | :--------- | :------------- | :-------------------------------------- |
| `options.directory`  | `string`   | -              | Pfad des zu importierenden Verzeichnisses |
| `options.extensions` | `string[]` | `['ts', 'js']` | Nach bestimmten Dateiendungen suchen    |

**Beispiel**

Die in der Datei `./collections/books.ts` definierte Sammlung sieht wie folgt aus:

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

Importieren Sie die entsprechende Konfiguration, wenn das Plugin geladen wird:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Erweiterungsregistrierung und -abruf

### `registerFieldTypes()`

Registriert benutzerdefinierte Feldtypen.

**Signatur**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parameter**

`fieldTypes` ist ein Schlüssel-Wert-Paar, wobei der Schlüssel der Feldtypname und der Wert die Feldtypklasse ist.

**Beispiel**

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

Registriert benutzerdefinierte Datenmodellklassen.

**Signatur**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parameter**

`models` ist ein Schlüssel-Wert-Paar, wobei der Schlüssel der Modellname und der Wert die Modellklasse ist.

**Beispiel**

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

Registriert benutzerdefinierte Repository-Klassen.

**Signatur**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parameter**

`repositories` ist ein Schlüssel-Wert-Paar, wobei der Schlüssel der Repository-Name und der Wert die Repository-Klasse ist.

**Beispiel**

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

Registriert benutzerdefinierte Datenabfrage-Operatoren.

**Signatur**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parameter**

`operators` ist ein Schlüssel-Wert-Paar, wobei der Schlüssel der Operatorname und der Wert die Funktion ist, die die Vergleichsanweisung generiert.

**Beispiel**

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
      // registrierter Operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Ruft eine definierte Datenmodellklasse ab. Wenn zuvor keine benutzerdefinierte Modellklasse registriert wurde, wird die Standard-Modellklasse von Sequelize zurückgegeben. Der Standardname ist derselbe wie der Name der Sammlung.

**Signatur**

- `getModel(name: string): Model`

**Parameter**

| Parametername | Typ      | Standardwert | Beschreibung          |
| :------------ | :------- | :----------- | :-------------------- |
| `name`        | `string` | -            | Registrierter Modellname |

**Beispiel**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Hinweis: Die aus einer Sammlung abgerufene Modellklasse ist nicht streng identisch mit der registrierten Modellklasse, sondern erbt von dieser. Da die Eigenschaften der Sequelize-Modellklasse während der Initialisierung geändert werden, handhabt NocoBase diese Vererbungsbeziehung automatisch. Abgesehen von der Ungleichheit der Klassen können alle anderen Definitionen normal verwendet werden.

### `getRepository()`

Ruft eine benutzerdefinierte Repository-Klasse ab. Wenn zuvor keine benutzerdefinierte Repository-Klasse registriert wurde, wird die Standard-Repository-Klasse von NocoBase zurückgegeben. Der Standardname ist derselbe wie der Name der Sammlung.

Repository-Klassen werden hauptsächlich für CRUD-Operationen basierend auf Datenmodellen verwendet, siehe [Repository](/api/database/repository).

**Signatur**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parameter**

| Parametername | Typ                  | Standardwert | Beschreibung              |
| :------------ | :------------------- | :----------- | :------------------------ |
| `name`        | `string`             | -            | Registrierter Repository-Name |
| `relationId`  | `string` \| `number` | -            | Fremdschlüsselwert für relationale Daten |

Wenn der Name ein assoziierter Name wie `'tables.relations'` ist, wird die zugehörige Repository-Klasse zurückgegeben. Wenn der zweite Parameter angegeben wird, basiert das Repository bei der Verwendung (Abfragen, Aktualisieren usw.) auf dem Fremdschlüsselwert der relationalen Daten.

**Beispiel**

Angenommen, es gibt zwei Sammlungen, *Beiträge* und *Autoren*, und die Beitragssammlung hat einen Fremdschlüssel, der auf die Autorensammlung verweist:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Datenbank-Ereignisse

### `on()`

Lauscht auf Datenbank-Ereignisse.

**Signatur**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parameter**

| Parametername | Typ      | Standardwert | Beschreibung    |
| :------------ | :------- | :----------- | :-------------- |
| event         | string   | -            | Ereignisname    |
| listener      | Function | -            | Ereignis-Listener |

Die Ereignisnamen unterstützen standardmäßig die Model-Ereignisse von Sequelize. Für globale Ereignisse lauschen Sie im Format `<sequelize_model_global_event>`, und für einzelne Model-Ereignisse im Format `<model_name>.<sequelize_model_event>`.

Parameterbeschreibungen und detaillierte Beispiele für alle integrierten Ereignistypen finden Sie im Abschnitt [Integrierte Ereignisse](#内置事件).

### `off()`

Entfernt eine Ereignis-Listener-Funktion.

**Signatur**

- `off(name: string, listener: Function)`

**Parameter**

| Parametername | Typ      | Standardwert | Beschreibung    |
| :------------ | :------- | :----------- | :-------------- |
| name          | string   | -            | Ereignisname    |
| listener      | Function | -            | Ereignis-Listener |

**Beispiel**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Datenbankoperationen

### `auth()`

Datenbankverbindungsauthentifizierung. Kann verwendet werden, um sicherzustellen, dass die Anwendung eine Verbindung zu den Daten hergestellt hat.

**Signatur**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parameter**

| Parametername          | Typ                   | Standardwert | Beschreibung                 |
| :--------------------- | :-------------------- | :----------- | :--------------------------- |
| `options?`             | `Object`              | -            | Authentifizierungsoptionen   |
| `options.retry?`       | `number`              | `10`         | Anzahl der Wiederholungsversuche bei fehlgeschlagener Authentifizierung |
| `options.transaction?` | `Transaction`         | -            | Transaktionsobjekt           |
| `options.logging?`     | `boolean \| Function` | `false`      | Ob Protokolle ausgegeben werden sollen |

**Beispiel**

```ts
await db.auth();
```

### `reconnect()`

Stellt die Verbindung zur Datenbank wieder her.

**Beispiel**

```ts
await db.reconnect();
```

### `closed()`

Prüft, ob die Datenbankverbindung geschlossen ist.

**Signatur**

- `closed(): boolean`

### `close()`

Schließt die Datenbankverbindung. Entspricht `sequelize.close()`.

### `sync()`

Synchronisiert die Datenbanktabellenstruktur. Entspricht `sequelize.sync()`, Parameter finden Sie in der [Sequelize-Dokumentation](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Bereinigt die Datenbank und löscht alle Sammlungen.

**Signatur**

- `clean(options: CleanOptions): Promise<void>`

**Parameter**

| Parametername         | Typ           | Standardwert | Beschreibung                           |
| :-------------------- | :------------ | :----------- | :------------------------------------- |
| `options.drop`        | `boolean`     | `false`      | Ob alle Sammlungen gelöscht werden sollen |
| `options.skip`        | `string[]`    | -            | Konfiguration der zu überspringenden Sammlungsnamen |
| `options.transaction` | `Transaction` | -            | Transaktionsobjekt                     |

**Beispiel**

Entfernt alle Sammlungen außer der `users`-Sammlung.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Paketweite Exporte

### `defineCollection()`

Erstellt den Konfigurationsinhalt für eine Sammlung.

**Signatur**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parameter**

| Parametername       | Typ               | Standardwert | Beschreibung                                |
| :------------------ | :---------------- | :----------- | :------------------------------------------ |
| `collectionOptions` | `CollectionOptions` | -            | Identisch mit allen Parametern von `db.collection()` |

**Beispiel**

Für eine Sammlungs-Konfigurationsdatei, die von `db.import()` importiert werden soll:

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

Erweitert den Konfigurationsinhalt einer bereits im Speicher befindlichen Sammlungsstruktur, hauptsächlich für Dateiinhalte, die von der `import()`-Methode importiert wurden. Diese Methode ist eine Top-Level-Methode, die vom `@nocobase/database`-Paket exportiert wird und nicht über eine Datenbankinstanz aufgerufen wird. Der Alias `extend` kann ebenfalls verwendet werden.

**Signatur**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parameter**

| Parametername       | Typ               | Standardwert | Beschreibung                                |
| :------------------ | :---------------- | :----------- | :------------------------------------------ |
| `collectionOptions` | `CollectionOptions` | -            | Identisch mit allen Parametern von `db.collection()` |
| `mergeOptions?`     | `MergeOptions`    | -            | Parameter für das npm-Paket [deepmerge](https://npmjs.com/package/deepmerge) |

**Beispiel**

Ursprüngliche Definition der `books`-Sammlung (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Erweiterte Definition der `books`-Sammlung (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// erneut erweitern
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Wenn die beiden oben genannten Dateien beim Aufruf von `import()` importiert und anschließend mit `extend()` erneut erweitert werden, verfügt die `books`-Sammlung über die Felder `title` und `price`.

Diese Methode ist sehr nützlich, um Sammlungsstrukturen zu erweitern, die bereits von bestehenden Plugins definiert wurden.

## Integrierte Ereignisse

Die Datenbank löst in den entsprechenden Lebenszyklen die folgenden Ereignisse aus. Durch das Abonnieren dieser Ereignisse mit der `on()`-Methode können spezifische Verarbeitungen vorgenommen werden, um bestimmte Geschäftsanforderungen zu erfüllen.

### `'beforeSync'` / `'afterSync'`

Wird vor und nach der Synchronisierung einer neuen Sammlungsstrukturkonfiguration (Felder, Indizes usw.) mit der Datenbank ausgelöst. Dies geschieht normalerweise bei der Ausführung von `collection.sync()` (interner Aufruf) und wird im Allgemeinen zur logischen Verarbeitung spezieller Felderweiterungen verwendet.

**Signatur**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Typ**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Beispiel**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // etwas tun
});

db.on('users.afterSync', async (options) => {
  // etwas tun
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Vor dem Erstellen oder Aktualisieren von Daten findet ein Validierungsprozess statt, der auf den in der Sammlung definierten Regeln basiert. Entsprechende Ereignisse werden vor und nach der Validierung ausgelöst. Dies geschieht beim Aufruf von `repository.create()` oder `repository.update()`.

**Signatur**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Typ**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Beispiel**

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

// alle Modelle
db.on('beforeValidate', async (model, options) => {
  // etwas tun
});
// tests-Modell
db.on('tests.beforeValidate', async (model, options) => {
  // etwas tun
});

// alle Modelle
db.on('afterValidate', async (model, options) => {
  // etwas tun
});
// tests-Modell
db.on('tests.afterValidate', async (model, options) => {
  // etwas tun
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // prüft auf E-Mail-Format
  },
});
// oder
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // prüft auf E-Mail-Format
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Entsprechende Ereignisse werden vor und nach dem Erstellen eines Datensatzes ausgelöst. Dies geschieht beim Aufruf von `repository.create()`.

**Signatur**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Typ**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Beispiel**

```ts
db.on('beforeCreate', async (model, options) => {
  // etwas tun
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

Entsprechende Ereignisse werden vor und nach dem Aktualisieren eines Datensatzes ausgelöst. Dies geschieht beim Aufruf von `repository.update()`.

**Signatur**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Typ**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Beispiel**

```ts
db.on('beforeUpdate', async (model, options) => {
  // etwas tun
});

db.on('books.afterUpdate', async (model, options) => {
  // etwas tun
});
```

### `'beforeSave'` / `'afterSave'`

Entsprechende Ereignisse werden vor und nach dem Erstellen oder Aktualisieren eines Datensatzes ausgelöst. Dies geschieht beim Aufruf von `repository.create()` oder `repository.update()`.

**Signatur**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Typ**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Beispiel**

```ts
db.on('beforeSave', async (model, options) => {
  // etwas tun
});

db.on('books.afterSave', async (model, options) => {
  // etwas tun
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Entsprechende Ereignisse werden vor und nach dem Löschen eines Datensatzes ausgelöst. Dies geschieht beim Aufruf von `repository.destroy()`.

**Signatur**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Typ**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Beispiel**

```ts
db.on('beforeDestroy', async (model, options) => {
  // etwas tun
});

db.on('books.afterDestroy', async (model, options) => {
  // etwas tun
});
```

### `'afterCreateWithAssociations'`

Dieses Ereignis wird nach dem Erstellen eines Datensatzes mit hierarchischen Assoziationsdaten ausgelöst. Dies geschieht beim Aufruf von `repository.create()`.

**Signatur**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Typ**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Beispiel**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // etwas tun
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // etwas tun
});
```

### `'afterUpdateWithAssociations'`

Dieses Ereignis wird nach dem Aktualisieren eines Datensatzes mit hierarchischen Assoziationsdaten ausgelöst. Dies geschieht beim Aufruf von `repository.update()`.

**Signatur**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Typ**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Beispiel**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // etwas tun
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // etwas tun
});
```

### `'afterSaveWithAssociations'`

Dieses Ereignis wird nach dem Erstellen oder Aktualisieren eines Datensatzes mit hierarchischen Assoziationsdaten ausgelöst. Dies geschieht beim Aufruf von `repository.create()` oder `repository.update()`.

**Signatur**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Typ**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Beispiel**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // etwas tun
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // etwas tun
});
```

### `'beforeDefineCollection'`

Wird ausgelöst, bevor eine Sammlung definiert wird, z. B. beim Aufruf von `db.collection()`.

Hinweis: Dies ist ein synchrones Ereignis.

**Signatur**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Typ**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Beispiel**

```ts
db.on('beforeDefineCollection', (options) => {
  // etwas tun
});
```

### `'afterDefineCollection'`

Wird ausgelöst, nachdem eine Sammlung definiert wurde, z. B. beim Aufruf von `db.collection()`.

Hinweis: Dies ist ein synchrones Ereignis.

**Signatur**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Beispiel**

```ts
db.on('afterDefineCollection', (collection) => {
  // etwas tun
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Wird ausgelöst, bevor und nachdem eine Sammlung aus dem Speicher entfernt wird, z. B. beim Aufruf von `db.removeCollection()`.

Hinweis: Dies ist ein synchrones Ereignis.

**Signatur**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Beispiel**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // etwas tun
});

db.on('afterRemoveCollection', (collection) => {
  // etwas tun
});
```