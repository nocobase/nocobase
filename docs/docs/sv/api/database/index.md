:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Databas

## Översikt

Databasen är ett verktyg från NocoBase för databasinteraktion, som erbjuder smidiga funktioner för no-code- och low-code-applikationer. Databaserna som stöds för närvarande är:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Anslut till databasen

I `Database`-konstruktorn kan ni konfigurera databasanslutningen genom att skicka in `options`-parametern.

```javascript
const { Database } = require('@nocobase/database');

// SQLite databas konfigurationsparametrar
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// MySQL \ PostgreSQL databas konfigurationsparametrar
const database = new Database({
  dialect: /* 'postgres' eller 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

För detaljerade konfigurationsparametrar, se [Konstruktorn](#constructorn).

### Datamodellens definition

`Database` definierar databasstrukturen via en `samling`. Ett `samling`-objekt representerar en tabell i databasen.

```javascript
// Definiera samling
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

När databasstrukturen är definierad kan ni använda metoden `sync()` för att synkronisera den.

```javascript
await database.sync();
```

För mer detaljerad användning av `samling`, se [Samling](/api/database/collection).

### Läsa och skriva data

`Database` hanterar data via `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Skapa
await UserRepository.create({
  name: 'Johan',
  age: 18,
});

// Fråga
const user = await UserRepository.findOne({
  filter: {
    name: 'Johan',
  },
});

// Uppdatera
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Ta bort
await UserRepository.destroy(user.id);
```

För mer detaljerad användning av CRUD-operationer, se [Repository](/api/database/repository).

## Konstruktorn

**Signatur**

- `constructor(options: DatabaseOptions)`

Skapar en databasinstans.

**Parametrar**

| Parameter              | Typ            | Standardvärde | Beskrivning                                                                                                         |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Databasvärd                                                                                                         |
| `options.port`         | `number`       | -             | Databasens tjänstport, med en standardport som motsvarar den databas som används                                    |
| `options.username`     | `string`       | -             | Databasens användarnamn                                                                                             |
| `options.password`     | `string`       | -             | Databasens lösenord                                                                                                 |
| `options.database`     | `string`       | -             | Databasnamn                                                                                                         |
| `options.dialect`      | `string`       | `'mysql'`     | Databastyp                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | Lagringsläge för SQLite                                                                                             |
| `options.logging?`     | `boolean`      | `false`       | Om loggning ska aktiveras                                                                                           |
| `options.define?`      | `Object`       | `{}`          | Standardparametrar för tabelldefinition                                                                             |
| `options.tablePrefix?` | `string`       | `''`          | NocoBase-tillägg, tabellnamnsprefix                                                                                 |
| `options.migrator?`    | `UmzugOptions` | `{}`          | NocoBase-tillägg, parametrar relaterade till migreringshanteraren, se [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) implementering |

## Metoder för migrering

### `addMigration()`

Lägger till en enskild migreringsfil.

**Signatur**

- `addMigration(options: MigrationItem)`

**Parametrar**

| Parameter            | Typ                | Standardvärde | Beskrivning                          |
| -------------------- | ------------------ | ------ | ------------------------------------ |
| `options.name`       | `string`           | -      | Migreringsfilens namn                |
| `options.context?`   | `string`           | -      | Migreringsfilens kontext             |
| `options.migration?` | `typeof Migration` | -      | Anpassad klass för migreringsfilen   |
| `options.up`         | `Function`         | -      | `up`-metoden för migreringsfilen     |
| `options.down`       | `Function`         | -      | `down`-metoden för migreringsfilen   |

**Exempel**

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

Lägger till migreringsfiler från en angiven katalog.

**Signatur**

- `addMigrations(options: AddMigrationsOptions): void`

**Parametrar**

| Parameter            | Typ        | Standardvärde | Beskrivning                      |
| -------------------- | ---------- | -------------- | -------------------------------- |
| `options.directory`  | `string`   | `''`           | Katalog där migreringsfiler finns |
| `options.extensions` | `string[]` | `['js', 'ts']` | Filändelser                      |
| `options.namespace?` | `string`   | `''`           | Namnrymd                         |
| `options.context?`   | `Object`   | `{ db }`       | Migreringsfilens kontext         |

**Exempel**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Hjälpmetoder

### `inDialect()`

Kontrollerar om den aktuella databastypen är en av de angivna typerna.

**Signatur**

- `inDialect(dialect: string[]): boolean`

**Parametrar**

| Parameter | Typ        | Standardvärde | Beskrivning                                      |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | Databastyp, möjliga värden är `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Hämtar tabellnamnsprefixet från konfigurationen.

**Signatur**

- `getTablePrefix(): string`

## Konfiguration av samlingar

### `collection()`

Definierar en `samling`. Detta anrop liknar Sequenzes `define`-metod och skapar tabellstrukturen endast i minnet. För att spara den permanent i databasen måste ni anropa metoden `sync()`.

**Signatur**

- `collection(options: CollectionOptions): Collection`

**Parametrar**

Alla `options`-konfigurationsparametrar överensstämmer med konstruktorn för `samling`-klassen, se [Samling](/api/database/collection#constructorn).

**Händelser**

- `'beforeDefineCollection'`: Utlöses innan en `samling` definieras.
- `'afterDefineCollection'`: Utlöses efter att en `samling` har definierats.

**Exempel**

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

// synkronisera samlingen som en tabell till databasen
await db.sync();
```

### `getCollection()`

Hämtar en definierad `samling`.

**Signatur**

- `getCollection(name: string): Collection`

**Parametrar**

| Parameter | Typ      | Standardvärde | Beskrivning          |
| ------ | -------- | ------ | -------------------- |
| `name` | `string` | -      | `samlingens` namn |

**Exempel**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Kontrollerar om en angiven `samling` har definierats.

**Signatur**

- `hasCollection(name: string): boolean`

**Parametrar**

| Parameter | Typ      | Standardvärde | Beskrivning          |
| ------ | -------- | ------ | -------------------- |
| `name` | `string` | -      | `samlingens` namn |

**Exempel**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Tar bort en definierad `samling`. Den tas endast bort från minnet; för att spara ändringen permanent måste ni anropa metoden `sync()`.

**Signatur**

- `removeCollection(name: string): void`

**Parametrar**

| Parameter | Typ      | Standardvärde | Beskrivning          |
| ------ | -------- | ------ | -------------------- |
| `name` | `string` | -      | `samlingens` namn |

**Händelser**

- `'beforeRemoveCollection'`: Utlöses innan en `samling` tas bort.
- `'afterRemoveCollection'`: Utlöses efter att en `samling` har tagits bort.

**Exempel**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importerar alla filer i en katalog som `samlings`-konfigurationer till minnet.

**Signatur**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parametrar**

| Parameter            | Typ        | Standardvärde | Beskrivning                      |
| -------------------- | ---------- | -------------- | -------------------------------- |
| `options.directory`  | `string`   | -              | Sökväg till katalogen som ska importeras |
| `options.extensions` | `string[]` | `['ts', 'js']` | Sök efter specifika filändelser |

**Exempel**

`samlingen` som definieras i filen `./collections/books.ts` är som följer:

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

Importera relevant konfiguration när `plugin` laddas:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Registrering och hämtning av tillägg

### `registerFieldTypes()`

Registrerar anpassade fälttyper.

**Signatur**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parametrar**

`fieldTypes` är ett nyckel-värde-par där nyckeln är fälttypens namn och värdet är fälttypklassen.

**Exempel**

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

Registrerar anpassade datamodellklasser.

**Signatur**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parametrar**

`models` är ett nyckel-värde-par där nyckeln är modellnamnet och värdet är modellklassen.

**Exempel**

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

Registrerar anpassade repository-klasser.

**Signatur**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parametrar**

`repositories` är ett nyckel-värde-par där nyckeln är repository-namnet och värdet är repository-klassen.

**Exempel**

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

Registrerar anpassade datafrågeoperatorer.

**Signatur**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parametrar**

`operators` är ett nyckel-värde-par där nyckeln är operatornamnet och värdet är funktionen som genererar jämförelseuttrycket.

**Exempel**

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
      // registered operator
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Hämtar en definierad datamodellklass. Om ingen anpassad modellklass tidigare har registrerats, kommer den att returnera Sequenzes standardmodellklass. Standardnamnet är detsamma som `samlingens` namn.

**Signatur**

- `getModel(name: string): Model`

**Parametrar**

| Parameter | Typ      | Standardvärde | Beskrivning          |
| ------ | -------- | ------ | -------------------- |
| `name` | `string` | -      | Registrerat modellnamn |

**Exempel**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Obs: Modellklassen som hämtas från en `samling` är inte strikt lika med den registrerade modellklassen, utan ärver från den. Eftersom Sequenzes modellklassers egenskaper ändras under initieringen, hanterar NocoBase automatiskt detta arvförhållande. Förutom att klasserna inte är exakt lika, kan alla andra definitioner användas normalt.

### `getRepository()`

Hämtar en anpassad repository-klass. Om ingen anpassad repository-klass tidigare har registrerats, kommer den att returnera NocoBase standard repository-klass. Standardnamnet är detsamma som `samlingens` namn.

Repository-klasser används främst för CRUD-operationer baserade på datamodeller, se [Repository](/api/database/repository).

**Signatur**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parametrar**

| Parameter    | Typ                  | Standardvärde | Beskrivning              |
| ------------ | -------------------- | ------ | ------------------------ |
| `name`       | `string`             | -      | Registrerat repository-namn |
| `relationId` | `string` \| `number` | -      | Främmande nyckelvärde för relationsdata |

När namnet är ett associationsnamn som `'tables.relations'`, kommer det att returnera den associerade repository-klassen. Om den andra parametern anges, kommer repositoryn att baseras på det främmande nyckelvärdet för relationsdata när den används (frågor, uppdateringar, etc.).

**Exempel**

Anta att det finns två `samlingar`, *inlägg* och *författare*, och att `samlingen` för inlägg har en främmande nyckel som pekar på `samlingen` för författare:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Databas-händelser

### `on()`

Lyssnar efter databas-händelser.

**Signatur**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parametrar**

| Parameter | Typ      | Standardvärde | Beskrivning        |
| -------- | -------- | ------ | ------------------ |
| event    | string   | -      | Händelsenamn       |
| listener | Function | -      | Händelselyssnare   |

Händelsenamnen stöder Sequenzes modellhändelser som standard. För globala händelser lyssnar ni med formatet `<sequelize_model_global_event>`, och för enskilda modellhändelser använder ni formatet `<modellnamn>.<sequelize_model_event>`.

För parameterbeskrivningar och detaljerade exempel på alla inbyggda händelsetyper, se avsnittet [Inbyggda händelser](#inbyggda-händelser).

### `off()`

Tar bort en händelselyssnarfunktion.

**Signatur**

- `off(name: string, listener: Function)`

**Parametrar**

| Parameter | Typ      | Standardvärde | Beskrivning        |
| -------- | -------- | ------ | ------------------ |
| name     | string   | -      | Händelsenamn       |
| listener | Function | -      | Händelselyssnare   |

**Exempel**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Databasoperationer

### `auth()`

Autentisering av databasanslutning. Kan användas för att säkerställa att applikationen har upprättat en anslutning till databasen.

**Signatur**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parametrar**

| Parameter              | Typ                   | Standardvärde | Beskrivning              |
| ---------------------- | --------------------- | ------- | ------------------------ |
| `options?`             | `Object`              | -       | Autentiseringsalternativ |
| `options.retry?`       | `number`              | `10`    | Antal återförsök vid misslyckad autentisering |
| `options.transaction?` | `Transaction`         | -       | Transaktionsobjekt       |
| `options.logging?`     | `boolean \| Function` | `false` | Om loggar ska skrivas ut |

**Exempel**

```ts
await db.auth();
```

### `reconnect()`

Återansluter till databasen.

**Exempel**

```ts
await db.reconnect();
```

### `closed()`

Kontrollerar om databasanslutningen är stängd.

**Signatur**

- `closed(): boolean`

### `close()`

Stänger databasanslutningen. Motsvarar `sequelize.close()`.

### `sync()`

Synkroniserar databasens `samlings`-struktur. Motsvarar `sequelize.sync()`, för parametrar se [Sequelize-dokumentationen](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Rensar databasen och tar bort alla `samlingar`.

**Signatur**

- `clean(options: CleanOptions): Promise<void>`

**Parametrar**

| Parameter             | Typ           | Standardvärde | Beskrivning              |
| --------------------- | ------------- | ------- | ------------------------ |
| `options.drop`        | `boolean`     | `false` | Om alla `samlingar` ska tas bort |
| `options.skip`        | `string[]`    | -       | Konfiguration av `samlingsnamn` att hoppa över |
| `options.transaction` | `Transaction` | -       | Transaktionsobjekt       |

**Exempel**

Tar bort alla `samlingar` utom `users`-`samlingen`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Paketnivå-exporter

### `defineCollection()`

Skapar konfigurationsinnehållet för en `samling`.

**Signatur**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parametrar**

| Parameter           | Typ                 | Standardvärde | Beskrivning                             |
| ------------------- | ------------------- | ------ | --------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Samma som alla parametrar för `db.collection()` |

**Exempel**

För en `samlings`-konfigurationsfil som ska importeras av `db.import()`:

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

Utökar konfigurationsinnehållet för en `samling` som redan finns i minnet, främst för filinnehåll som importerats med metoden `import()`. Denna metod är en toppnivåmetod som exporteras av `@nocobase/database`-paketet och anropas inte via en db-instans. Aliaset `extend` kan också användas.

**Signatur**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parametrar**

| Parameter           | Typ                 | Standardvärde | Beskrivning                                                    |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Samma som alla parametrar för `db.collection()`                |
| `mergeOptions?`     | `MergeOptions`      | -      | Parametrar för npm-paketet [deepmerge](https://npmjs.com/package/deepmerge) |

**Exempel**

Ursprunglig definition av `samlingen` för böcker (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Utökad definition av `samlingen` för böcker (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// utöka igen
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Om de två filerna ovan importeras vid anrop av `import()`, och sedan utökas igen med `extend()`, kommer `samlingen` för böcker att ha både fälten `title` och `price`.

Denna metod är mycket användbar för att utöka `samlings`-strukturer som redan definierats av befintliga `plugin`.

## Inbyggda händelser

Databasen utlöser följande händelser vid olika stadier i sin livscykel. Genom att prenumerera på dem med metoden `on()` kan ni utföra specifik bearbetning för att möta vissa affärsbehov.

### `'beforeSync'` / `'afterSync'`

Utlöses före och efter att en ny `samlings`-strukturkonfiguration (fält, index, etc.) synkroniseras med databasen. Den utlöses vanligtvis när `collection.sync()` (internt anrop) körs och används generellt för att hantera logik för speciella fältutökningar.

**Signatur**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Typ**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Exempel**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // do something
});

db.on('users.afterSync', async (options) => {
  // do something
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Innan data skapas eller uppdateras sker en valideringsprocess baserad på reglerna som definierats i `samlingen`. Motsvarande händelser utlöses före och efter valideringen. Detta utlöses när `repository.create()` eller `repository.update()` anropas.

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

**Exempel**

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

// alla modeller
db.on('beforeValidate', async (model, options) => {
  // do something
});
// tests modell
db.on('tests.beforeValidate', async (model, options) => {
  // do something
});

// alla modeller
db.on('afterValidate', async (model, options) => {
  // do something
});
// tests modell
db.on('tests.afterValidate', async (model, options) => {
  // do something
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // kontrollerar e-postformat
  },
});
// eller
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // kontrollerar e-postformat
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Motsvarande händelser utlöses före och efter att en post skapas. Detta utlöses när `repository.create()` anropas.

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

**Exempel**

```ts
db.on('beforeCreate', async (model, options) => {
  // do something
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

Motsvarande händelser utlöses före och efter att en post uppdateras. Detta utlöses när `repository.update()` anropas.

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

**Exempel**

```ts
db.on('beforeUpdate', async (model, options) => {
  // do something
});

db.on('books.afterUpdate', async (model, options) => {
  // do something
});
```

### `'beforeSave'` / `'afterSave'`

Motsvarande händelser utlöses före och efter att en post skapas eller uppdateras. Detta utlöses när `repository.create()` eller `repository.update()` anropas.

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

**Exempel**

```ts
db.on('beforeSave', async (model, options) => {
  // do something
});

db.on('books.afterSave', async (model, options) => {
  // do something
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Motsvarande händelser utlöses före och efter att en post tas bort. Detta utlöses när `repository.destroy()` anropas.

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

**Exempel**

```ts
db.on('beforeDestroy', async (model, options) => {
  // do something
});

db.on('books.afterDestroy', async (model, options) => {
  // do something
});
```

### `'afterCreateWithAssociations'`

Denna händelse utlöses efter att en post med hierarkisk associationsdata har skapats. Den utlöses när `repository.create()` anropas.

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

**Exempel**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterUpdateWithAssociations'`

Denna händelse utlöses efter att en post med hierarkisk associationsdata har uppdaterats. Den utlöses när `repository.update()` anropas.

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

**Exempel**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // do something
});
```

### `'afterSaveWithAssociations'`

Denna händelse utlöses efter att en post med hierarkisk associationsdata har skapats eller uppdaterats. Den utlöses när `repository.create()` eller `repository.update()` anropas.

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

**Exempel**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // do something
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // do something
});
```

### `'beforeDefineCollection'`

Utlöses innan en `samling` definieras, t.ex. när `db.collection()` anropas.

Obs: Detta är en synkron händelse.

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

**Exempel**

```ts
db.on('beforeDefineCollection', (options) => {
  // do something
});
```

### `'afterDefineCollection'`

Utlöses efter att en `samling` har definierats, t.ex. när `db.collection()` anropas.

Obs: Detta är en synkron händelse.

**Signatur**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Exempel**

```ts
db.on('afterDefineCollection', (collection) => {
  // do something
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Utlöses före och efter att en `samling` tas bort från minnet, t.ex. när `db.removeCollection()` anropas.

Obs: Detta är en synkron händelse.

**Signatur**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Exempel**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // do something
});

db.on('afterRemoveCollection', (collection) => {
  // do something
});
```