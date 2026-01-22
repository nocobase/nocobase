:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Databáze

## Přehled

`Database` je nástroj pro interakci s databází, který poskytuje NocoBase. Nabízí velmi pohodlné funkce pro práci s databázemi v no-code a low-code aplikacích. Aktuálně jsou podporovány tyto databáze:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Připojení k databázi

V konstruktoru `Database` můžete nakonfigurovat připojení k databázi předáním parametru `options`.

```javascript
const { Database } = require('@nocobase/database');

// Konfigurační parametry databáze SQLite
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// Konfigurační parametry databáze MySQL \ PostgreSQL
const database = new Database({
  dialect: /* 'postgres' nebo 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Podrobné konfigurační parametry naleznete v části [Konstruktor](#constructor).

### Definice datového modelu

`Database` definuje strukturu databáze pomocí `kolekce`. Objekt `kolekce` představuje tabulku v databázi.

```javascript
// Definice kolekce
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

Jakmile je struktura databáze definována, můžete použít metodu `sync()` k její synchronizaci.

```javascript
await database.sync();
```

Podrobnější informace o používání `kolekce` naleznete v části [Kolekce](/api/database/collection).

### Čtení a zápis dat

`Database` pracuje s daty prostřednictvím `Repository`.

```javascript
const UserRepository = UserCollection.repository();

// Vytvoření
await UserRepository.create({
  name: 'Jan',
  age: 18,
});

// Dotazování
const user = await UserRepository.findOne({
  filter: {
    name: 'Jan',
  },
});

// Úprava
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Smazání
await UserRepository.destroy(user.id);
```

Podrobnější informace o používání CRUD operací s daty naleznete v části [Repository](/api/database/repository).

## Konstruktor

**Podpis**

- `constructor(options: DatabaseOptions)`

Vytvoří instanci databáze.

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :--------------------- | :-------------- | :------------- | :------------------------------------------------------------------------------------------------------------------ |
| `options.host` | `string` | `'localhost'` | Hostitel databáze |
| `options.port` | `number` | - | Port databázové služby, s výchozím portem odpovídajícím použité databázi |
| `options.username` | `string` | - | Uživatelské jméno databáze |
| `options.password` | `string` | - | Heslo databáze |
| `options.database` | `string` | - | Název databáze |
| `options.dialect` | `string` | `'mysql'` | Typ databáze |
| `options.storage?` | `string` | `':memory:'` | Režim úložiště pro SQLite |
| `options.logging?` | `boolean` | `false` | Zda povolit logování |
| `options.define?` | `Object` | `{}` | Výchozí parametry definice tabulky |
| `options.tablePrefix?` | `string` | `''` | Rozšíření NocoBase, prefix názvu tabulky |
| `options.migrator?` | `UmzugOptions` | `{}` | Rozšíření NocoBase, parametry související se správcem migrací, viz implementace [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) |

## Metody související s migracemi

### `addMigration()`

Přidá jeden migrační soubor.

**Podpis**

- `addMigration(options: MigrationItem)`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------------------- | :----------------- | :----- | :-------------------- |
| `options.name` | `string` | - | Název migračního souboru |
| `options.context?` | `string` | - | Kontext migračního souboru |
| `options.migration?` | `typeof Migration` | - | Vlastní třída pro migrační soubor |
| `options.up` | `Function` | - | Metoda `up` migračního souboru |
| `options.down` | `Function` | - | Metoda `down` migračního souboru |

**Příklad**

```ts
db.addMigration({
  name: '20220916120411-test-1',
  async up() {
    const queryInterface = this.context.db.sequelize.getQueryInterface();
    await queryInterface.query(/* vaše migrační SQL dotazy */);
  },
});
```

### `addMigrations()`

Přidá migrační soubory z určeného adresáře.

**Podpis**

- `addMigrations(options: AddMigrationsOptions): void`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------------------- | :--------- | :------------- | :--------------- |
| `options.directory` | `string` | `''` | Adresář, kde se nacházejí migrační soubory |
| `options.extensions` | `string[]` | `['js', 'ts']` | Přípony souborů |
| `options.namespace?` | `string` | `''` | Jmenný prostor |
| `options.context?` | `Object` | `{ db }` | Kontext migračního souboru |

**Příklad**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Pomocné metody

### `inDialect()`

Zkontroluje, zda je aktuální typ databáze jedním z uvedených typů.

**Podpis**

- `inDialect(dialect: string[]): boolean`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :-------- | :--------- | :----- | :----------------------------------------------- |
| `dialect` | `string[]` | - | Typ databáze, možné hodnoty jsou `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Získá prefix názvu tabulky z konfigurace.

**Podpis**

- `getTablePrefix(): string`

## Konfigurace kolekcí

### `collection()`

Definuje `kolekci`. Toto volání je podobné metodě `define` v Sequelize, která vytváří strukturu tabulky pouze v paměti. Pro její trvalé uložení do databáze je potřeba zavolat metodu `sync`.

**Podpis**

- `collection(options: CollectionOptions): Collection`

**Parametry**

Všechny konfigurační parametry `options` jsou shodné s konstruktorem třídy `kolekce`, viz [Kolekce](#).

**Události**

- `'beforeDefineCollection'`: Spustí se před definováním `kolekce`.
- `'afterDefineCollection'`: Spustí se po definování `kolekce`.

**Příklad**

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

// synchronizovat kolekci jako tabulku do databáze
await db.sync();
```

### `getCollection()`

Získá definovanou `kolekci`.

**Podpis**

- `getCollection(name: string): Collection`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------- | :--------- | :----- | :---- |
| `name` | `string` | - | Název kolekce |

**Příklad**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Zkontroluje, zda byla definována zadaná `kolekce`.

**Podpis**

- `hasCollection(name: string): boolean`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------- | :--------- | :----- | :---- |
| `name` | `string` | - | Název kolekce |

**Příklad**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Odebere definovanou `kolekci`. Odebere se pouze z paměti; pro trvalé uložení změny je potřeba zavolat metodu `sync`.

**Podpis**

- `removeCollection(name: string): void`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------- | :--------- | :----- | :---- |
| `name` | `string` | - | Název kolekce |

**Události**

- `'beforeRemoveCollection'`: Spustí se před odebráním `kolekce`.
- `'afterRemoveCollection'`: Spustí se po odebrání `kolekce`.

**Příklad**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Importuje všechny soubory z adresáře jako konfigurace `kolekcí` do paměti.

**Podpis**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------------------- | :--------- | :------------- | :--------------- |
| `options.directory` | `string` | - | Cesta k adresáři pro import |
| `options.extensions` | `string[]` | `['ts', 'js']` | Skenovat pro konkrétní přípony |

**Příklad**

Kolekce definovaná v souboru `./collections/books.ts` vypadá takto:

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

Importujte příslušnou konfiguraci při načítání pluginu:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Registrace a získávání rozšíření

### `registerFieldTypes()`

Registruje vlastní typy polí.

**Podpis**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parametry**

`fieldTypes` je pár klíč-hodnota, kde klíč je název typu pole a hodnota je třída typu pole.

**Příklad**

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

Registruje vlastní třídy datových modelů.

**Podpis**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parametry**

`models` je pár klíč-hodnota, kde klíč je název datového modelu a hodnota je třída datového modelu.

**Příklad**

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

Registruje vlastní třídy repozitářů.

**Podpis**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parametry**

`repositories` je pár klíč-hodnota, kde klíč je název repozitáře a hodnota je třída repozitáře.

**Příklad**

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

Registruje vlastní operátory pro dotazování dat.

**Podpis**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parametry**

`operators` je pár klíč-hodnota, kde klíč je název operátoru a hodnota je funkce, která generuje porovnávací výraz.

**Příklad**

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
      // registrovaný operátor
      $dateOn: '2020-01-01',
    },
  },
});
```

### `getModel()`

Získá definovanou třídu datového modelu. Pokud nebyla dříve zaregistrována žádná vlastní třída modelu, vrátí se výchozí třída modelu Sequelize. Výchozí název je stejný jako název definované `kolekce`.

**Podpis**

- `getModel(name: string): Model`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------- | :--------- | :----- | :------------- |
| `name` | `string` | - | Název registrovaného modelu |

**Příklad**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Poznámka: Třída modelu získaná z `kolekce` není striktně shodná s registrovanou třídou modelu, ale dědí z ní. Jelikož se vlastnosti třídy modelu Sequelize mění během inicializace, NocoBase automaticky spravuje tento vztah dědičnosti. Kromě nerovnosti tříd lze všechny ostatní definice normálně používat.

### `getRepository()`

Získá vlastní třídu repozitáře. Pokud nebyla dříve zaregistrována žádná vlastní třída repozitáře, vrátí se výchozí třída repozitáře NocoBase. Výchozí název je stejný jako název definované `kolekce`.

Třídy repozitářů se primárně používají pro CRUD operace (vytváření, čtení, aktualizace, mazání) založené na datových modelech, viz [Repository](/api/database/repository).

**Podpis**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :----------- | :------------------- | :----- | :------------------- |
| `name` | `string` | - | Název registrovaného repozitáře |
| `relationId` | `string` \| `number` | - | Hodnota cizího klíče pro relační data |

Pokud je název asociační, například `'tables.relations'`, vrátí se přidružená třída repozitáře. Pokud je poskytnut druhý parametr, repozitář bude při použití (dotazování, aktualizace atd.) vycházet z hodnoty cizího klíče relačních dat.

**Příklad**

Předpokládejme, že existují dvě `kolekce`, *příspěvky* a *autoři*, a `kolekce` příspěvků má cizí klíč odkazující na `kolekci` autorů:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Databázové události

### `on()`

Naslouchá databázovým událostem.

**Podpis**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------- | :------- | :----- | :--------- |
| event | string | - | Název události |
| listener | Function | - | Posluchač události |

Názvy událostí standardně podporují události modelu Sequelize. Pro globální události nasloucháte pomocí formátu názvu `<sequelize_model_global_event>`, a pro události jednoho modelu použijte formát `<model_name>.<sequelize_model_event>`.

Popisy parametrů a podrobné příklady všech vestavěných typů událostí naleznete v sekci [Vestavěné události](#vestavěné-události).

### `off()`

Odebere funkci posluchače události.

**Podpis**

- `off(name: string, listener: Function)`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------- | :------- | :----- | :--------- |
| name | string | - | Název události |
| listener | Function | - | Posluchač události |

**Příklad**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Databázové operace

### `auth()`

Autentizace databázového připojení. Lze použít k zajištění, že aplikace navázala spojení s daty.

**Podpis**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :--------------------- | :-------------------- | :------ | :----------------- |
| `options?` | `Object` | - | Možnosti autentizace |
| `options.retry?` | `number` | `10` | Počet opakování při selhání autentizace |
| `options.transaction?` | `Transaction` | - | Objekt transakce |
| `options.logging?` | `boolean \| Function` | `false` | Zda tisknout logy |

**Příklad**

```ts
await db.auth();
```

### `reconnect()`

Znovu připojí k databázi.

**Příklad**

```ts
await db.reconnect();
```

### `closed()`

Zkontroluje, zda je databázové připojení uzavřeno.

**Podpis**

- `closed(): boolean`

### `close()`

Uzavře databázové připojení. Ekvivalentní k `sequelize.close()`.

### `sync()`

Synchronizuje strukturu databázové `kolekce`. Ekvivalentní k `sequelize.sync()`, parametry naleznete v [dokumentaci Sequelize](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync).

### `clean()`

Vyčistí databázi, čímž smaže všechny `kolekce`.

**Podpis**

- `clean(options: CleanOptions): Promise<void>`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :-------------------- | :------------ | :------ | :----------------- |
| `options.drop` | `boolean` | `false` | Zda odstranit všechny kolekce |
| `options.skip` | `string[]` | - | Konfigurace názvů kolekcí k přeskočení |
| `options.transaction` | `Transaction` | - | Objekt transakce |

**Příklad**

Odebere všechny kolekce kromě kolekce `users`.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Exporty na úrovni balíčku

### `defineCollection()`

Vytvoří konfigurační obsah pro `kolekci`.

**Podpis**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------------------ | :------------------ | :----- | :---------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Stejné jako všechny parametry `db.collection()` |

**Příklad**

Pro konfigurační soubor kolekce, který má být importován pomocí `db.import()`:

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

Rozšíří konfigurační obsah `kolekce` již v paměti, primárně pro obsah souborů importovaných metodou `import()`. Tato metoda je top-level metodou exportovanou balíčkem `@nocobase/database` a není volána přes instanci `db`. Lze také použít alias `extend`.

**Podpis**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parametry**

| Parametr | Typ | Výchozí hodnota | Popis |
| :------------------ | :------------------ | :----- | :------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | - | Stejné jako všechny parametry `db.collection()` |
| `mergeOptions?` | `MergeOptions` | - | Parametry pro npm balíček [deepmerge](https://npmjs.com/package/deepmerge) |

**Příklad**

Původní definice kolekce knih (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Rozšířená definice kolekce knih (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// rozšířit znovu
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Pokud jsou výše uvedené dva soubory importovány při volání `import()`, po opětovném rozšíření pomocí `extend()` bude kolekce knih obsahovat pole `title` a `price`.

Tato metoda je velmi užitečná pro rozšíření struktur kolekcí, které již byly definovány existujícími pluginy.

## Vestavěné události

Databáze spouští následující události v odpovídajících fázích svého životního cyklu. Přihlášením k odběru pomocí metody `on()` můžete provádět specifické zpracování, které splňuje určité obchodní potřeby.

### `'beforeSync'` / `'afterSync'`

Spustí se před a po synchronizaci nové konfigurační struktury `kolekce` (polí, indexů atd.) do databáze. Obvykle se spouští při provádění `collection.sync()` (interní volání) a obecně se používá pro zpracování logiky speciálních rozšíření polí.

**Podpis**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Typ**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Příklad**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // udělejte něco
});

db.on('users.afterSync', async (options) => {
  // udělejte něco
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Před vytvořením nebo aktualizací dat probíhá proces validace dat založený na pravidlech definovaných v `kolekci`. Odpovídající události se spustí před a po validaci. K tomu dojde při volání `repository.create()` nebo `repository.update()`.

**Podpis**

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

**Příklad**

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

// všechny modely
db.on('beforeValidate', async (model, options) => {
  // udělejte něco
});
// model tests
db.on('tests.beforeValidate', async (model, options) => {
  // udělejte něco
});

// všechny modely
db.on('afterValidate', async (model, options) => {
  // udělejte něco
});
// model tests
db.on('tests.afterValidate', async (model, options) => {
  // udělejte něco
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // kontroluje formát e-mailu
  },
});
// nebo
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // kontroluje formát e-mailu
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Odpovídající události se spustí před a po vytvoření záznamu. K tomu dojde při volání `repository.create()`.

**Podpis**

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

**Příklad**

```ts
db.on('beforeCreate', async (model, options) => {
  // udělejte něco
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

Odpovídající události se spustí před a po aktualizaci záznamu. K tomu dojde při volání `repository.update()`.

**Podpis**

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

**Příklad**

```ts
db.on('beforeUpdate', async (model, options) => {
  // udělejte něco
});

db.on('books.afterUpdate', async (model, options) => {
  // udělejte něco
});
```

### `'beforeSave'` / `'afterSave'`

Odpovídající události se spustí před a po vytvoření nebo aktualizaci záznamu. K tomu dojde při volání `repository.create()` nebo `repository.update()`.

**Podpis**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Typ**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Příklad**

```ts
db.on('beforeSave', async (model, options) => {
  // udělejte něco
});

db.on('books.afterSave', async (model, options) => {
  // udělejte něco
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Odpovídající události se spustí před a po smazání záznamu. K tomu dojde při volání `repository.destroy()`.

**Podpis**

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

**Příklad**

```ts
db.on('beforeDestroy', async (model, options) => {
  // udělejte něco
});

db.on('books.afterDestroy', async (model, options) => {
  // udělejte něco
});
```

### `'afterCreateWithAssociations'`

Tato událost se spustí po vytvoření záznamu s hierarchickými asociačními daty. K tomu dojde při volání `repository.create()`.

**Podpis**

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

**Příklad**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // udělejte něco
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // udělejte něco
});
```

### `'afterUpdateWithAssociations'`

Tato událost se spustí po aktualizaci záznamu s hierarchickými asociačními daty. K tomu dojde při volání `repository.update()`.

**Podpis**

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

**Příklad**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // udělejte něco
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // udělejte něco
});
```

### `'afterSaveWithAssociations'`

Tato událost se spustí po vytvoření nebo aktualizaci záznamu s hierarchickými asociačními daty. K tomu dojde při volání `repository.create()` nebo `repository.update()`.

**Podpis**

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

**Příklad**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // udělejte něco
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // udělejte něco
});
```

### `'beforeDefineCollection'`

Spustí se před definováním `kolekce`, například při volání `db.collection()`.

Poznámka: Toto je synchronní událost.

**Podpis**

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

**Příklad**

```ts
db.on('beforeDefineCollection', (options) => {
  // udělejte něco
});
```

### `'afterDefineCollection'`

Spustí se po definování `kolekce`, například při volání `db.collection()`.

Poznámka: Toto je synchronní událost.

**Podpis**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Příklad**

```ts
db.on('afterDefineCollection', (collection) => {
  // udělejte něco
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Spustí se před a po odebrání `kolekce` z paměti, například při volání `db.removeCollection()`.

Poznámka: Toto je synchronní událost.

**Podpis**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Typ**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Příklad**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // udělejte něco
});

db.on('afterRemoveCollection', (collection) => {
  // udělejte něco
});
```