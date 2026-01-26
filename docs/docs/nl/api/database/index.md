:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Database

## Overzicht

Database is de database-interactietool van NocoBase, die zeer handige database-interactiemogelijkheden biedt voor no-code en low-code applicaties. Momenteel worden de volgende databases ondersteund:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Verbinding maken met de database

In de `Database` constructor configureert u de databaseverbinding door de `options` parameter mee te geven.

```javascript
const { Database } = require('@nocobase/database');

// SQLite database configuratieparameters
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// MySQL \ PostgreSQL database configuratieparameters
const database = new Database({
  dialect: /* 'postgres' of 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Voor gedetailleerde configuratieparameters verwijzen we u naar [Constructor](#constructor).

### Definitie van datamodellen

`Database` definieert de databasestructuur via `collectie`. Een `collectie`-object vertegenwoordigt een tabel in de database.

```javascript
// Definieer collectie
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

Nadat de databasestructuur is gedefinieerd, kunt u de `sync()` methode gebruiken om de databasestructuur te synchroniseren.

```javascript
await database.sync();
```

Voor een gedetailleerder gebruik van `collectie` verwijzen we u naar [Collectie](/api/database/collection).

### Gegevens lezen en schrijven

`Database` werkt met gegevens via `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Aanmaken
await UserRepository.create({
  name: 'Jan',
  age: 18,
});

// Opvragen
const user = await UserRepository.findOne({
  filter: {
    name: 'Jan',
  },
});

// Wijzigen
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Verwijderen
await UserRepository.destroy(user.id);
```

Voor een gedetailleerder gebruik van CRUD-bewerkingen op gegevens verwijzen we u naar [Repository](/api/database/repository).

## Constructor

**Signatuur**

- `constructor(options: DatabaseOptions)`

Creëert een database-instantie.

**Parameters**

| Parameter              | Type           | Standaardwaarde | Beschrijving                                                                                                        |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Host van de database                                                                                                |
| `options.port`         | `number`       | -             | Poort van de databaseservice, met een standaardpoort die overeenkomt met de gebruikte database                      |
| `options.username`     | `string`       | -             | Gebruikersnaam van de database                                                                                      |
| `options.password`     | `string`       | -             | Wachtwoord van de database                                                                                          |
| `options.database`     | `string`       | -             | Naam van de database                                                                                                |
| `options.dialect`      | `string`       | `'mysql'`     | Type database                                                                                                       |
| `options.storage?`     | `string`       | `':memory:'`  | Opslagmodus voor SQLite                                                                                             |
| `options.logging?`     | `boolean`      | `false`       | Of logging ingeschakeld moet worden                                                                                 |
| `options.define?`      | `Object`       | `{}`          | Standaardparameters voor tabeldefinitie                                                                             |
| `options.tablePrefix?` | `string`       | `''`          | NocoBase-extensie, tabelnaamvoorvoegsel                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | NocoBase-extensie, parameters met betrekking tot de migratiemanager, zie de [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) implementatie |

## Migratie-gerelateerde methoden

### `addMigration()`

Voegt één migratiebestand toe.

**Signatuur**

- `addMigration(options: MigrationItem)`

**Parameters**

| Parameter            | Type               | Standaardwaarde | Beschrijving                       |
| -------------------- | ------------------ | ------ | ---------------------------------- |
| `options.name`       | `string`           | -      | Naam van het migratiebestand       |
| `options.context?`   | `string`           | -      | Context van het migratiebestand    |
| `options.migration?` | `typeof Migration` | -      | Aangepaste klasse voor het migratiebestand |
| `options.up`         | `Function`         | -      | `up`-methode van het migratiebestand |
| `options.down`       | `Function`         | -      | `down`-methode van het migratiebestand |

**Voorbeeld**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* uw migratie SQL */);
  },
});
```

### `addMigrations()`

Voegt migratiebestanden toe vanuit een opgegeven map.

**Signatuur**

- `addMigrations(options: AddMigrationsOptions): void`

**Parameters**

| Parameter            | Type       | Standaardwaarde | Beschrijving                   |
| -------------------- | ---------- | -------------- | ------------------------------ |
| `options.directory`  | `string`   | `''`           | Map waar migratiebestanden zich bevinden |
| `options.extensions` | `string[]` | `['js', 'ts']` | Bestandsextensies              |
| `options.namespace?` | `string`   | `''`           | Naamruimte                     |
| `options.context?`   | `Object`   | `{ db }`       | Context van het migratiebestand |

**Voorbeeld**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Hulpmethoden

### `inDialect()`

Controleert of het huidige databasetype één van de opgegeven types is.

**Signatuur**

- `inDialect(dialect: string[]): boolean`

**Parameters**

| Parameter | Type       | Standaardwaarde | Beschrijving                                             |
| --------- | ---------- | ------ | -------------------------------------------------------- |
| `dialect` | `string[]` | -      | Type database, mogelijke waarden zijn `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Haalt het tabelnaamvoorvoegsel op uit de configuratie.

**Signatuur**

- `getTablePrefix(): string`

## Collectieconfiguratie

### `collection()`

Definieert een collectie. Deze aanroep is vergelijkbaar met de `define`-methode van Sequelize en creëert de tabelstructuur alleen in het geheugen. Om deze persistent te maken in de database, moet u de `sync`-methode aanroepen.

**Signatuur**

- `collection(options: CollectionOptions): Collection`

**Parameters**

Alle `options`-configuratieparameters komen overeen met de constructor van de `collectie`-klasse; zie [Collectie](/api/database/collection#constructor).

**Gebeurtenissen**

- `'beforeDefineCollection'`: Wordt geactiveerd voordat een collectie wordt gedefinieerd.
- `'afterDefineCollection'`: Wordt geactiveerd nadat een collectie is gedefinieerd.

**Voorbeeld**

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

// synchroniseer collectie als tabel naar db
await db.sync();
```

### `getCollection()`

Haalt een gedefinieerde collectie op.

**Signatuur**

- `getCollection(name: string): Collection`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving           |
| ------ | -------- | ------ | ---------------------- |
| `name` | `string` | -      | Naam van de collectie |

**Voorbeeld**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Controleert of een opgegeven collectie is gedefinieerd.

**Signatuur**

- `hasCollection(name: string): boolean`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving           |
| ------ | -------- | ------ | ---------------------- |
| `name` | `string` | -      | Naam van de collectie |

**Voorbeeld**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Verwijdert een gedefinieerde collectie. Deze wordt alleen uit het geheugen verwijderd; om de wijziging persistent te maken, moet u de `sync`-methode aanroepen.

**Signatuur**

- `removeCollection(name: string): void`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving           |
| ------ | -------- | ------ | ---------------------- |
| `name` | `string` | -      | Naam van de collectie |

**Gebeurtenissen**

- `'beforeRemoveCollection'`: Wordt geactiveerd voordat een collectie wordt verwijderd.
- `'afterRemoveCollection'`: Wordt geactiveerd nadat een collectie is verwijderd.

**Voorbeeld**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importeert alle bestanden in een map als collectieconfiguraties in het geheugen.

**Signatuur**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parameters**

| Parameter            | Type       | Standaardwaarde | Beschrijving                   |
| -------------------- | ---------- | -------------- | ------------------------------ |
| `options.directory`  | `string`   | -              | Pad van de te importeren map   |
| `options.extensions` | `string[]` | `['ts', 'js']` | Scannen op specifieke achtervoegsels |

**Voorbeeld**

De collectie gedefinieerd in het bestand `./collections/books.ts` is als volgt:

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

Importeer de relevante configuratie wanneer de plugin laadt:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Extensieregistratie en -ophalen

### `registerFieldTypes()`

Registreert aangepaste veldtypen.

**Signatuur**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parameters**

`fieldTypes` is een sleutel-waardepaar waarbij de sleutel de naam van het veldtype is en de waarde de klasse van het veldtype.

**Voorbeeld**

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

Registreert aangepaste datamodelklassen.

**Signatuur**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parameters**

`models` is een sleutel-waardepaar waarbij de sleutel de modelnaam is en de waarde de modelklasse.

**Voorbeeld**

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

Registreert aangepaste repository-klassen.

**Signatuur**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parameters**

`repositories` is een sleutel-waardepaar waarbij de sleutel de repository-naam is en de waarde de repository-klasse.

**Voorbeeld**

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

Registreert aangepaste dataquery-operatoren.

**Signatuur**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parameters**

`operators` is een sleutel-waardepaar waarbij de sleutel de operatornaam is en de waarde de functie die de vergelijkingsinstructie genereert.

**Voorbeeld**

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
      // geregistreerde operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Haalt een gedefinieerde datamodelklasse op. Als er eerder geen aangepaste modelklasse is geregistreerd, retourneert deze de standaard Sequelize-modelklasse. De standaardnaam is hetzelfde als de collectienaam.

**Signatuur**

- `getModel(name: string): Model`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving           |
| ------ | -------- | ------ | ---------------------- |
| `name` | `string` | -      | Geregistreerde modelnaam |

**Voorbeeld**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Opmerking: De modelklasse die uit een collectie wordt verkregen, is niet strikt gelijk aan de geregistreerde modelklasse, maar erft ervan. Aangezien de eigenschappen van de modelklasse van Sequelize tijdens de initialisatie worden gewijzigd, verwerkt NocoBase deze overervingsrelatie automatisch. Behalve de ongelijkheid van de klasse kunnen alle andere definities normaal worden gebruikt.

### `getRepository()`

Haalt een aangepaste repository-klasse op. Als er eerder geen aangepaste repository-klasse is geregistreerd, retourneert deze de standaard NocoBase repository-klasse. De standaardnaam is hetzelfde als de collectienaam.

Repository-klassen worden voornamelijk gebruikt voor CRUD-bewerkingen op basis van datamodellen; zie [Repository](/api/database/repository).

**Signatuur**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parameters**

| Parameter    | Type                 | Standaardwaarde | Beschrijving                       |
| ------------ | -------------------- | ------ | ---------------------------------- |
| `name`       | `string`             | -      | Geregistreerde repository-naam     |
| `relationId` | `string` \| `number` | -      | Waarde van de externe sleutel voor relationele gegevens |

Wanneer de naam een associatienaam is, zoals `'tables.relations'`, retourneert deze de bijbehorende repository-klasse. Als de tweede parameter wordt opgegeven, zal de repository bij gebruik (query's, updates, enz.) gebaseerd zijn op de waarde van de externe sleutel van de relationele gegevens.

**Voorbeeld**

Stel dat er twee collecties zijn, *posts* en *authors*, en de posts-collectie heeft een externe sleutel die verwijst naar de authors-collectie:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Databasegebeurtenissen

### `on()`

Luistert naar databasegebeurtenissen.

**Signatuur**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving           |
| -------- | -------- | ------ | ---------------------- |
| event    | string   | -      | Naam van de gebeurtenis |
| listener | Function | -      | Gebeurtenisluisteraar  |

De gebeurtenisnamen ondersteunen standaard de Model-gebeurtenissen van Sequelize. Voor globale gebeurtenissen luistert u met het formaat `<sequelize_model_global_event>`, en voor enkele Model-gebeurtenissen gebruikt u het formaat `<model_name>.<sequelize_model_event>`.

Voor parameterbeschrijvingen en gedetailleerde voorbeelden van alle ingebouwde gebeurtenistypen verwijzen we u naar de sectie [Ingebouwde gebeurtenissen](#ingebouwde-gebeurtenissen).

### `off()`

Verwijdert een gebeurtenisluisterfunctie.

**Signatuur**

- `off(name: string, listener: Function)`

**Parameters**

| Parameter | Type     | Standaardwaarde | Beschrijving           |
| -------- | -------- | ------ | ---------------------- |
| name     | string   | -      | Naam van de gebeurtenis |
| listener | Function | -      | Gebeurtenisluisteraar  |

**Voorbeeld**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Databasebewerkingen

### `auth()`

Databaseverbindingsauthenticatie. Kan worden gebruikt om ervoor te zorgen dat de applicatie een verbinding met de gegevens heeft tot stand gebracht.

**Signatuur**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parameters**

| Parameter              | Type                  | Standaardwaarde | Beschrijving               |
| ---------------------- | --------------------- | ------- | -------------------------- |
| `options?`             | `Object`              | -       | Authenticatie-opties       |
| `options.retry?`       | `number`              | `10`    | Aantal herpogingen bij authenticatiefout |
| `options.transaction?` | `Transaction`         | -       | Transactieobject           |
| `options.logging?`     | `boolean \| Function` | `false` | Of logs moeten worden afgedrukt |

**Voorbeeld**

```ts
await db.auth();
```

### `reconnect()`

Maakt opnieuw verbinding met de database.

**Voorbeeld**

```ts
await db.reconnect();
```

### `closed()`

Controleert of de databaseverbinding is gesloten.

**Signatuur**

- `closed(): boolean`

### `close()`

Sluit de databaseverbinding. Gelijk aan `sequelize.close()`.

### `sync()`

Synchroniseert de collectiestructuur van de database. Gelijk aan `sequelize.sync()`; voor parameters verwijzen we u naar de [Sequelize-documentatie](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Schoont de database op, waarbij alle collecties worden verwijderd.

**Signatuur**

- `clean(options: CleanOptions): Promise<void>`

**Parameters**

| Parameter             | Type          | Standaardwaarde | Beschrijving                       |
| --------------------- | ------------- | ------- | ---------------------------------- |
| `options.drop`        | `boolean`     | `false` | Of alle collecties moeten worden verwijderd |
| `options.skip`        | `string[]`    | -       | Configuratie van over te slaan collectienamen |
| `options.transaction` | `Transaction` | -       | Transactieobject                   |

**Voorbeeld**

Verwijdert alle collecties behalve de `users`-collectie.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Pakketniveau-exports

### `defineCollection()`

Creëert de configuratie-inhoud voor een collectie.

**Signatuur**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parameters**

| Parameter           | Type                | Standaardwaarde | Beschrijving                                |
| ------------------- | ------------------- | ------ | ------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Hetzelfde als alle parameters van `db.collection()` |

**Voorbeeld**

Voor een collectieconfiguratiebestand dat door `db.import()` moet worden geïmporteerd:

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

Breidt de configuratie-inhoud van een reeds in het geheugen aanwezige collectie uit, voornamelijk voor bestandsinhoud die is geïmporteerd met de `import()`-methode. Deze methode is een top-level methode die wordt geëxporteerd door het `@nocobase/database` pakket en wordt niet aangeroepen via een db-instantie. Het `extend`-alias kan ook worden gebruikt.

**Signatuur**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parameters**

| Parameter           | Type                | Standaardwaarde | Beschrijving                                                           |
| ------------------- | ------------------- | ------ | ---------------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Hetzelfde als alle parameters van `db.collection()`                    |
| `mergeOptions?`     | `MergeOptions`      | -      | Parameters voor het npm-pakket [deepmerge](https://npmjs.com/package/deepmerge) |

**Voorbeeld**

Originele boeken collectiedefinitie (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Uitgebreide boeken collectiedefinitie (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// opnieuw uitbreiden
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Als de twee bovenstaande bestanden worden geïmporteerd bij het aanroepen van `import()`, en vervolgens opnieuw worden uitgebreid met `extend()`, zal de boeken collectie zowel de velden `title` als `price` bevatten.

Deze methode is erg handig voor het uitbreiden van collectiestructuren die al zijn gedefinieerd door bestaande plugins.

## Ingebouwde gebeurtenissen

De database activeert de volgende corresponderende gebeurtenissen in verschillende fasen van zijn levenscyclus. Door u hierop te abonneren met de `on()`-methode, kunt u specifieke verwerkingen uitvoeren om aan bepaalde bedrijfsbehoeften te voldoen.

### `'beforeSync'` / `'afterSync'`

Wordt geactiveerd voor en na het synchroniseren van een nieuwe collectiestructuurconfiguratie (velden, indexen, enz.) met de database. Dit wordt meestal geactiveerd wanneer `collectie.sync()` (interne aanroep) wordt uitgevoerd en wordt over het algemeen gebruikt voor het afhandelen van logica voor speciale veldextensies.

**Signatuur**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Type**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Voorbeeld**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // doe iets
});

db.on('users.afterSync', async (options) => {
  // doe iets
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Voordat gegevens worden aangemaakt of bijgewerkt, vindt er een validatieproces plaats op basis van de regels die in de collectie zijn gedefinieerd. Corresponderende gebeurtenissen worden geactiveerd voor en na de validatie. Dit wordt geactiveerd wanneer `repository.create()` of `repository.update()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Type**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Voorbeeld**

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

// alle modellen
db.on('beforeValidate', async (model, options) => {
  // doe iets
});
// tests model
db.on('tests.beforeValidate', async (model, options) => {
  // doe iets
});

// alle modellen
db.on('afterValidate', async (model, options) => {
  // doe iets
});
// tests model
db.on('tests.afterValidate', async (model, options) => {
  // doe iets
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // controleert op e-mailformaat
  },
});
// of
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // controleert op e-mailformaat
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Corresponderende gebeurtenissen worden geactiveerd voor en na het aanmaken van een record. Dit wordt geactiveerd wanneer `repository.create()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Voorbeeld**

```ts
db.on('beforeCreate', async (model, options) => {
  // doe iets
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

Corresponderende gebeurtenissen worden geactiveerd voor en na het bijwerken van een record. Dit wordt geactiveerd wanneer `repository.update()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Voorbeeld**

```ts
db.on('beforeUpdate', async (model, options) => {
  // doe iets
});

db.on('books.afterUpdate', async (model, options) => {
  // doe iets
});
```

### `'beforeSave'` / `'afterSave'`

Corresponderende gebeurtenissen worden geactiveerd voor en na het aanmaken of bijwerken van een record. Dit wordt geactiveerd wanneer `repository.create()` of `repository.update()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Voorbeeld**

```ts
db.on('beforeSave', async (model, options) => {
  // doe iets
});

db.on('books.afterSave', async (model, options) => {
  // doe iets
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Corresponderende gebeurtenissen worden geactiveerd voor en na het verwijderen van een record. Dit wordt geactiveerd wanneer `repository.destroy()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Type**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Voorbeeld**

```ts
db.on('beforeDestroy', async (model, options) => {
  // doe iets
});

db.on('books.afterDestroy', async (model, options) => {
  // doe iets
});
```

### `'afterCreateWithAssociations'`

Deze gebeurtenis wordt geactiveerd na het aanmaken van een record met hiërarchische associatiegegevens. Dit wordt geactiveerd wanneer `repository.create()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Voorbeeld**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // doe iets
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // doe iets
});
```

### `'afterUpdateWithAssociations'`

Deze gebeurtenis wordt geactiveerd na het bijwerken van een record met hiërarchische associatiegegevens. Dit wordt geactiveerd wanneer `repository.update()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Type**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Voorbeeld**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // doe iets
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // doe iets
});
```

### `'afterSaveWithAssociations'`

Deze gebeurtenis wordt geactiveerd na het aanmaken of bijwerken van een record met hiërarchische associatiegegevens. Dit wordt geactiveerd wanneer `repository.create()` of `repository.update()` wordt aangeroepen.

**Signatuur**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Type**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Voorbeeld**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // doe iets
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // doe iets
});
```

### `'beforeDefineCollection'`

Wordt geactiveerd voordat een collectie wordt gedefinieerd, bijvoorbeeld wanneer `db.collection()` wordt aangeroepen.

Opmerking: Dit is een synchrone gebeurtenis.

**Signatuur**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Type**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Voorbeeld**

```ts
db.on('beforeDefineCollection', (options) => {
  // doe iets
});
```

### `'afterDefineCollection'`

Wordt geactiveerd nadat een collectie is gedefinieerd, bijvoorbeeld wanneer `db.collection()` wordt aangeroepen.

Opmerking: Dit is een synchrone gebeurtenis.

**Signatuur**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Voorbeeld**

```ts
db.on('afterDefineCollection', (collection) => {
  // doe iets
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Wordt geactiveerd voor en nadat een collectie uit het geheugen is verwijderd, bijvoorbeeld wanneer `db.removeCollection()` wordt aangeroepen.

Opmerking: Dit is een synchrone gebeurtenis.

**Signatuur**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Type**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Voorbeeld**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // doe iets
});

db.on('afterRemoveCollection', (collection) => {
  // doe iets
});
```