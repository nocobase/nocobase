:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Veritabanı

## Genel Bakış

NocoBase tarafından sunulan bir veritabanı etkileşim aracı olan Veritabanı, kodsuz ve az kodlu uygulamalar için oldukça kullanışlı veritabanı etkileşim yetenekleri sağlar. Şu anda desteklenen veritabanları şunlardır:

- SQLite 3.8.8+
- MySQL 8.0.17+
- PostgreSQL 10.0+

### Veritabanına Bağlanma

`Database` yapılandırıcısında (`constructor`), `options` parametresini ileterek veritabanı bağlantısını yapılandırabilirsiniz.

```javascript
const { Database } = require('@nocobase/database');

// SQLite veritabanı yapılandırma parametreleri
const database = new Database({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'nocobase',
  username: 'root',
  password: 'password'
})

// MySQL \ PostgreSQL veritabanı yapılandırma parametreleri
const database = new Database({
  dialect: /* 'postgres' veya 'mysql' */,
  database: 'database',
  username: 'username',
  password: 'password',
  host: 'localhost',
  port: 'port'
})

```

Detaylı yapılandırma parametreleri için lütfen [Yapılandırıcı](#constructor) bölümüne bakın.

### Veri Modeli Tanımlama

`Database`, veritabanı yapısını `koleksiyon` aracılığıyla tanımlar. Bir `koleksiyon` nesnesi, veritabanındaki bir tabloyu temsil eder.

```javascript
// koleksiyon tanımlama
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

Veritabanı yapısı tanımlandıktan sonra, `sync()` metodunu kullanarak veritabanı yapısını senkronize edebilirsiniz.

```javascript
await database.sync();
```

`koleksiyon` kullanımının daha detaylı açıklaması için lütfen [koleksiyon](/api/database/collection) bölümüne bakın.

### Veri Okuma/Yazma

`Database`, veriler üzerinde `Repository` aracılığıyla işlem yapar.

```javascript
const UserRepository = UserCollection.repository();

// Oluşturma
await UserRepository.create({
  name: '张三',
  age: 18,
});

// Sorgulama
const user = await UserRepository.findOne({
  filter: {
    name: '张三',
  },
});

// Güncelleme
await UserRepository.update({
  values: {
    age: 20,
  },
});

// Silme
await UserRepository.destroy(user.id);
```

Veri CRUD işlemlerinin daha detaylı kullanımı için lütfen [Repository](/api/database/repository) bölümüne bakın.

## Yapılandırıcı

**İmza**

- `constructor(options: DatabaseOptions)`

Bir veritabanı örneği oluşturur.

**Parametreler**

| Parametre Adı          | Tür            | Varsayılan Değer | Açıklama                                                                                                                |
| ---------------------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------- |
| `options.host`         | `string`       | `'localhost'` | Veritabanı ana bilgisayarı                                                                                                          |
| `options.port`         | `number`       | -             | Veritabanı hizmet portu, kullanılan veritabanına göre varsayılan bir portu vardır                                       |
| `options.username`     | `string`       | -             | Veritabanı kullanıcı adı                                                                                                        |
| `options.password`     | `string`       | -             | Veritabanı parolası                                                                                                          |
| `options.database`     | `string`       | -             | Veritabanı adı                                                                                                          |
| `options.dialect`      | `string`       | `'mysql'`     | Veritabanı türü                                                                                                          |
| `options.storage?`     | `string`       | `':memory:'`  | SQLite için depolama modu                                                                                                   |
| `options.logging?`     | `boolean`      | `false`       | Loglamayı etkinleştirip etkinleştirmeme                                                                                     |
| `options.define?`      | `Object`       | `{}`          | Varsayılan tablo tanımlama parametreleri                                                                                    |
| `options.tablePrefix?` | `string`       | `''`          | NocoBase uzantısı, tablo adı öneki                                                                                             |
| `options.migrator?`    | `UmzugOptions` | `{}`          | NocoBase uzantısı, geçiş yöneticisiyle ilgili parametreler, [Umzug](https://github.com/sequelize/umzug/blob/main/src/types.ts#L15) uygulamasını inceleyin |

## Geçişle İlgili Metotlar

### `addMigration()`

Tek bir geçiş dosyası ekler.

**İmza**

- `addMigration(options: MigrationItem)`

**Parametreler**

| Parametre Adı        | Tür                | Varsayılan Değer | Açıklama                   |
| -------------------- | ------------------ | ------ | ---------------------- |
| `options.name`       | `string`           | -      | Geçiş dosyası adı           |
| `options.context?`   | `string`           | -      | Geçiş dosyasının bağlamı       |
| `options.migration?` | `typeof Migration` | -      | Geçiş dosyası için özel sınıf     |
| `options.up`         | `Function`         | -      | Geçiş dosyasının `up` metodu   |
| `options.down`       | `Function`         | -      | Geçiş dosyasının `down` metodu |

**Örnek**

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

Belirtilen bir dizindeki geçiş dosyalarını ekler.

**İmza**

- `addMigrations(options: AddMigrationsOptions): void`

**Parametreler**

| Parametre Adı        | Tür        | Varsayılan Değer | Açıklama             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | `''`           | Geçiş dosyalarının bulunduğu dizin |
| `options.extensions` | `string[]` | `['js', 'ts']` | Dosya uzantıları       |
| `options.namespace?` | `string`   | `''`           | Ad alanı         |
| `options.context?`   | `Object`   | `{ db }`       | Geçiş dosyasının bağlamı |

**Örnek**

```ts
db.addMigrations({
  directory: path.resolve(__dirname, './migrations'),
  namespace: 'test',
});
```

## Yardımcı Metotlar

### `inDialect()`

Mevcut veritabanı türünün belirtilen türlerden biri olup olmadığını kontrol eder.

**İmza**

- `inDialect(dialect: string[]): boolean`

**Parametreler**

| Parametre Adı | Tür        | Varsayılan Değer | Açıklama                                             |
| --------- | ---------- | ------ | ------------------------------------------------ |
| `dialect` | `string[]` | -      | Veritabanı türü, olası değerler `mysql`/`postgres`/`mariadb` |

### `getTablePrefix()`

Yapılandırmadaki tablo adı önekini alır.

**İmza**

- `getTablePrefix(): string`

## koleksiyon Yapılandırması

### `koleksiyon()`

Bir `koleksiyon` tanımlar. Bu çağrı, Sequelize'ın `define` metoduna benzer; tablo yapısını yalnızca bellekte oluşturur. Veritabanına kalıcı olarak kaydetmek için `sync` metodunu çağırmanız gerekir.

**İmza**

- `collection(options: CollectionOptions): Collection`

**Parametreler**

Tüm `options` yapılandırma parametreleri, `koleksiyon` sınıfının yapılandırıcısıyla uyumludur, [koleksiyon](#) bölümüne bakın.

**Olaylar**

- `'beforeDefineCollection'`:`koleksiyon` tanımlanmadan önce tetiklenir.
- `'afterDefineCollection'`:`koleksiyon` tanımlandıktan sonra tetiklenir.

**Örnek**

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

// koleksiyonu tablo olarak veritabanına senkronize et
await db.sync();
```

### `getCollection()`

Tanımlanmış bir `koleksiyon` alır.

**İmza**

- `getCollection(name: string): Collection`

**Parametreler**

| Parametre Adı | Tür      | Varsayılan Değer | Açıklama       |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | `koleksiyon` adı |

**Örnek**

```ts
const collection = db.getCollection('books');
```

### `hasCollection()`

Belirtilen bir `koleksiyon`un tanımlanıp tanımlanmadığını kontrol eder.

**İmza**

- `hasCollection(name: string): boolean`

**Parametreler**

| Parametre Adı | Tür      | Varsayılan Değer | Açıklama       |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | `koleksiyon` adı |

**Örnek**

```ts
db.collection({ name: 'books' });

db.hasCollection('books'); // true

db.hasCollection('authors'); // false
```

### `removeCollection()`

Tanımlanmış bir `koleksiyon`u kaldırır. Yalnızca bellekten kaldırılır; değişikliği kalıcı hale getirmek için `sync` metodunu çağırmanız gerekir.

**İmza**

- `removeCollection(name: string): void`

**Parametreler**

| Parametre Adı | Tür      | Varsayılan Değer | Açıklama       |
| ------ | -------- | ------ | ---- |
| `name` | `string` | -      | `koleksiyon` adı |

**Olaylar**

- `'beforeRemoveCollection'`:`koleksiyon` kaldırılmadan önce tetiklenir.
- `'afterRemoveCollection'`:`koleksiyon` kaldırıldıktan sonra tetiklenir.

**Örnek**

```ts
db.collection({ name: 'books' });

db.removeCollection('books');
```

### `import()`

Bir dizindeki tüm dosyaları `koleksiyon` yapılandırmaları olarak belleğe aktarır.

**İmza**

- `async import(options: { directory: string; extensions?: ImportFileExtension[] }): Promise<Map<string, Collection>>`

**Parametreler**

| Parametre Adı        | Tür        | Varsayılan Değer | Açıklama             |
| -------------------- | ---------- | -------------- | ---------------- |
| `options.directory`  | `string`   | -              | Aktarılacak dizinin yolu |
| `options.extensions` | `string[]` | `['ts', 'js']` | Belirli uzantıları tara     |

**Örnek**

`./collections/books.ts` dosyasında tanımlanan `koleksiyon` aşağıdaki gibidir:

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

eklenti yüklendiğinde ilgili yapılandırmayı aktarın:

```ts
class Plugin {
  async load() {
    await this.app.db.import({
      directory: path.resolve(__dirname, './collections'),
    });
  }
}
```

## Uzantı Kaydı ve Alma

### `registerFieldTypes()`

Özel alan türlerini kaydeder.

**İmza**

- `registerFieldTypes(fieldTypes: MapOf<typeof Field>): void`

**Parametreler**

`fieldTypes`, anahtarın alan türü adı, değerin ise alan türü sınıfı olduğu bir anahtar-değer çiftidir.

**Örnek**

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

Özel veri modeli sınıflarını kaydeder.

**İmza**

- `registerModels(models: MapOf<ModelStatic<any>>): void`

**Parametreler**

`models`, anahtarın veri modeli adı, değerin ise veri modeli sınıfı olduğu bir anahtar-değer çiftidir.

**Örnek**

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

Özel `Repository` sınıflarını kaydeder.

**İmza**

- `registerRepositories(repositories: MapOf<RepositoryType>): void`

**Parametreler**

`repositories`, anahtarın `Repository` adı, değerin ise `Repository` sınıfı olduğu bir anahtar-değer çiftidir.

**Örnek**

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

Özel veri sorgu operatörlerini kaydeder.

**İmza**

- `registerOperators(operators: MapOf<OperatorFunc>)`

**Parametreler**

`operators`, anahtarın operatör adı, değerin ise karşılaştırma ifadesini oluşturan fonksiyon olduğu bir anahtar-değer çiftidir.

**Örnek**

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

Tanımlanmış bir veri modeli sınıfını alır. Daha önce özel bir model sınıfı kaydedilmediyse, varsayılan Sequelize model sınıfını döndürür. Varsayılan ad, `koleksiyon` adıyla aynıdır.

**İmza**

- `getModel(name: string): Model`

**Parametreler**

| Parametre Adı | Tür      | Varsayılan Değer | Açıklama           |
| ------ | -------- | ------ | -------------- |
| `name` | `string` | -      | Kaydedilmiş model adı |

**Örnek**

```ts
db.registerModels({
  books: class MyModel extends Model {},
});

const ModelClass = db.getModel('books');

console.log(ModelClass.prototype instanceof MyModel); // true
```

Not: Bir `koleksiyon`dan alınan model sınıfı, kaydedilen model sınıfıyla tam olarak aynı değildir, ancak ondan miras alır. Sequelize'ın model sınıfı özellikleri başlatma sırasında değiştirildiği için, NocoBase bu miras ilişkisini otomatik olarak yönetir. Sınıf eşitsizliği dışında, diğer tüm tanımlamalar normal şekilde kullanılabilir.

### `getRepository()`

Özel bir `Repository` sınıfı alır. Daha önce özel bir `Repository` sınıfı kaydedilmediyse, varsayılan NocoBase `Repository` sınıfını döndürür. Varsayılan ad, `koleksiyon` adıyla aynıdır.

`Repository` sınıfları, temel olarak veri modellerine dayalı CRUD işlemleri için kullanılır, [Repository](/api/database/repository) bölümüne bakın.

**İmza**

- `getRepository(name: string): Repository`
- `getRepository(name: string, relationId?: string | number): Repository`

**Parametreler**

| Parametre Adı    | Tür                  | Varsayılan Değer | Açıklama               |
| ------------ | -------------------- | ------ | ------------------ |
| `name`       | `string`             | -      | Kaydedilmiş `Repository` adı |
| `relationId` | `string` \| `number` | -      | İlişkisel veriler için yabancı anahtar değeri   |

Ad, `'tables.relations'` gibi ilişkisel bir ad olduğunda, ilişkili `Repository` sınıfını döndürür. İkinci parametre sağlanırsa, `Repository` kullanılırken (sorgulama, güncelleme vb.) ilişkisel verilerin yabancı anahtar değerine dayanır.

**Örnek**

Diyelim ki *yazılar* ve *yazarlar* adında iki `koleksiyon` var ve yazılar `koleksiyon`unda yazarlar `koleksiyon`una işaret eden bir yabancı anahtar bulunuyor:

```ts
const AuthorsRepo = db.getRepository('authors');
const author1 = AuthorsRepo.create({ name: 'author1' });

const PostsRepo = db.getRepository('authors.posts', author1.id);
const post1 = AuthorsRepo.create({ title: 'post1' });
asset(post1.authorId === author1.id); // true
```

## Veritabanı Olayları

### `on()`

Veritabanı olaylarını dinler.

**İmza**

- `on(event: string, listener: (...args: any[]) => void | Promise<void>): void`

**Parametreler**

| Parametre Adı | Tür      | Varsayılan Değer | Açıklama       |
| -------- | -------- | ------ | ---------- |
| event    | string   | -      | Olay adı   |
| listener | Function | -      | Olay dinleyicisi |

Olay adları varsayılan olarak Sequelize'ın Model olaylarını destekler. Genel olaylar için `<sequelize_model_global_event>` formatını, tekil Model olayları için ise `<model_name>.<sequelize_model_event>` formatını kullanarak dinleyebilirsiniz.

Tüm yerleşik olay türlerinin parametre açıklamaları ve detaylı örnekleri için [Yerleşik Olaylar](#yerleşik-olaylar) bölümüne bakın.

### `off()`

Bir olay dinleyici fonksiyonunu kaldırır.

**İmza**

- `off(name: string, listener: Function)`

**Parametreler**

| Parametre Adı | Tür      | Varsayılan Değer | Açıklama       |
| -------- | -------- | ------ | ---------- |
| name     | string   | -      | Olay adı   |
| listener | Function | -      | Olay dinleyicisi |

**Örnek**

```ts
const listener = async (model, options) => {
  console.log(model);
};

db.on('afterCreate', listener);

db.off('afterCreate', listener);
```

## Veritabanı İşlemleri

### `auth()`

Veritabanı bağlantı doğrulaması. Uygulamanın verilerle bağlantı kurduğunu doğrulamak için kullanılabilir.

**İmza**

- `auth(options: QueryOptions & { retry?: number } = {}): Promise<boolean>`

**Parametreler**

| Parametre Adı          | Tür                   | Varsayılan Değer | Açıklama               |
| ---------------------- | --------------------- | ------- | ------------------ |
| `options?`             | `Object`              | -       | Doğrulama seçenekleri           |
| `options.retry?`       | `number`              | `10`    | Doğrulama başarısız olduğunda yeniden deneme sayısı |
| `options.transaction?` | `Transaction`         | -       | İşlem nesnesi           |
| `options.logging?`     | `boolean \| Function` | `false` | Logları yazdırıp yazdırmama       |

**Örnek**

```ts
await db.auth();
```

### `reconnect()`

Veritabanına yeniden bağlanır.

**Örnek**

```ts
await db.reconnect();
```

### `closed()`

Veritabanı bağlantısının kapalı olup olmadığını kontrol eder.

**İmza**

- `closed(): boolean`

### `close()`

Veritabanı bağlantısını kapatır. `sequelize.close()` ile eşdeğerdir.

### `sync()`

Veritabanı `koleksiyon` yapısını senkronize eder. `sequelize.sync()` ile eşdeğerdir, parametreler için [Sequelize dokümantasyonuna](https://sequelize.org/api/v6/class/src/sequelize.js~sequelize#instance-method-sync) bakın.

### `clean()`

Veritabanını temizler, tüm `koleksiyon`ları siler.

**İmza**

- `clean(options: CleanOptions): Promise<void>`

**Parametreler**

| Parametre Adı         | Tür           | Varsayılan Değer | Açıklama               |
| --------------------- | ------------- | ------- | ------------------ |
| `options.drop`        | `boolean`     | `false` | Tüm `koleksiyon`ları silip silmeme |
| `options.skip`        | `string[]`    | -       | Atlanacak `koleksiyon` adlarının yapılandırması     |
| `options.transaction` | `Transaction` | -       | İşlem nesnesi           |

**Örnek**

`users` `koleksiyon`u hariç tüm `koleksiyon`ları kaldırır.

```ts
await db.clean({
  drop: true,
  skip: ['users'],
});
```

## Paket Düzeyinde Dışa Aktarımlar

### `defineCollection()`

Bir `koleksiyon` için yapılandırma içeriğini oluşturur.

**İmza**

- `defineCollection(name: string, config: CollectionOptions): CollectionOptions`

**Parametreler**

| Parametre Adı       | Tür                 | Varsayılan Değer | Açıklama                                |
| ------------------- | ------------------- | ------ | ----------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Tüm `db.collection()` parametreleriyle aynıdır |

**Örnek**

`db.import()` tarafından aktarılacak bir `koleksiyon` yapılandırma dosyası için:

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

Bellekteki bir `koleksiyon`un yapılandırma içeriğini genişletir, özellikle `import()` metoduyla aktarılan dosya içeriği için kullanılır. Bu metot, `@nocobase/database` paketi tarafından dışa aktarılan üst düzey bir metottur ve bir db örneği aracılığıyla çağrılmaz. `extend` takma adı da kullanılabilir.

**İmza**

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ExtendedCollectionOptions`

**Parametreler**

| Parametre Adı       | Tür                 | Varsayılan Değer | Açıklama                                                           |
| ------------------- | ------------------- | ------ | -------------------------------------------------------------- |
| `collectionOptions` | `CollectionOptions` | -      | Tüm `db.collection()` parametreleriyle aynıdır                            |
| `mergeOptions?`     | `MergeOptions`      | -      | npm paketi [deepmerge](https://npmjs.com/package/deepmerge) için parametreler |

**Örnek**

Orijinal kitaplar `koleksiyon`u tanımı (books.ts):

```ts
export default {
  name: 'books',
  fields: [{ name: 'title', type: 'string' }],
};
```

Genişletilmiş kitaplar `koleksiyon`u tanımı (books.extend.ts):

```ts
import { extend } from '@nocobase/database';

// tekrar genişlet
export default extend({
  name: 'books',
  fields: [{ name: 'price', type: 'number' }],
});
```

Yukarıdaki iki dosya `import()` çağrılırken aktarılırsa, `extend()` ile tekrar genişletildikten sonra, kitaplar `koleksiyon`u hem `title` hem de `price` alanlarına sahip olacaktır.

Bu metot, mevcut `eklenti`ler tarafından zaten tanımlanmış `koleksiyon` yapılarını genişletmek için çok kullanışlıdır.

## Yerleşik Olaylar

Veritabanı, yaşam döngüsünün farklı aşamalarında aşağıdaki ilgili olayları tetikler. `on()` metoduyla bunlara abone olmak, belirli iş ihtiyaçlarını karşılamak için özel işlem yapılmasına olanak tanır.

### `'beforeSync'` / `'afterSync'`

Yeni bir `koleksiyon` yapılandırması (alanlar, indeksler vb.) veritabanına senkronize edilmeden önce ve sonra tetiklenir. Genellikle `collection.sync()` (dahili çağrı) yürütüldüğünde tetiklenir ve özel alan uzantıları için mantık işlemek amacıyla kullanılır.

**İmza**

```ts
on(eventName: `${string}.beforeSync` | 'beforeSync' | `${string}.afterSync` | 'afterSync', listener: SyncListener): this
```

**Tür**

```ts
import type { SyncOptions, HookReturn } from 'sequelize/types';

type SyncListener = (options?: SyncOptions) => HookReturn;
```

**Örnek**

```ts
const users = db.collection({
  name: 'users',
  fields: [{ type: 'string', name: 'username' }],
});

db.on('beforeSync', async (options) => {
  // bir şeyler yapın
});

db.on('users.afterSync', async (options) => {
  // bir şeyler yapın
});

await users.sync();
```

### `'beforeValidate'` / `'afterValidate'`

Veri oluşturmadan veya güncellemeden önce, `koleksiyon`da tanımlanan kurallara dayalı bir doğrulama süreci vardır. Doğrulama öncesinde ve sonrasında ilgili olaylar tetiklenir. Bu, `repository.create()` veya `repository.update()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.beforeValidate` | 'beforeValidate' | `${string}.afterValidate` | 'afterValidate', listener: ValidateListener): this
```

**Tür**

```ts
import type { ValidationOptions } from 'sequelize/types/lib/instance-validator';
import type { HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

type ValidateListener = (
  model: Model,
  options?: ValidationOptions,
) => HookReturn;
```

**Örnek**

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

// tüm modeller
db.on('beforeValidate', async (model, options) => {
  // bir şeyler yapın
});
// tests modeli
db.on('tests.beforeValidate', async (model, options) => {
  // bir şeyler yapın
});

// tüm modeller
db.on('afterValidate', async (model, options) => {
  // bir şeyler yapın
});
// tests modeli
db.on('tests.afterValidate', async (model, options) => {
  // bir şeyler yapın
});

const repository = db.getRepository('tests');
await repository.create({
  values: {
    email: 'abc', // e-posta formatını kontrol eder
  },
});
// veya
await repository.update({
  filterByTk: 1,
  values: {
    email: 'abc', // e-posta formatını kontrol eder
  },
});
```

### `'beforeCreate'` / `'afterCreate'`

Bir kayıt oluşturulmadan önce ve sonra ilgili olaylar tetiklenir. Bu, `repository.create()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.beforeCreate` | 'beforeCreate' | `${string}.afterCreate` | 'afterCreate', listener: CreateListener): this
```

**Tür**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Örnek**

```ts
db.on('beforeCreate', async (model, options) => {
  // bir şeyler yapın
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

Bir kayıt güncellenmeden önce ve sonra ilgili olaylar tetiklenir. Bu, `repository.update()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.beforeUpdate` | 'beforeUpdate' | `${string}.afterUpdate` | 'afterUpdate', listener: UpdateListener): this
```

**Tür**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Örnek**

```ts
db.on('beforeUpdate', async (model, options) => {
  // bir şeyler yapın
});

db.on('books.afterUpdate', async (model, options) => {
  // bir şeyler yapın
});
```

### `'beforeSave'` / `'afterSave'`

Bir kayıt oluşturulmadan veya güncellenmeden önce ve sonra ilgili olaylar tetiklenir. Bu, `repository.create()` veya `repository.update()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.beforeSave` | 'beforeSave' | `${string}.afterSave` | 'afterSave', listener: SaveListener): this
```

**Tür**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveListener = (model: Model, options?: SaveOptions) => HookReturn;
```

**Örnek**

```ts
db.on('beforeSave', async (model, options) => {
  // bir şeyler yapın
});

db.on('books.afterSave', async (model, options) => {
  // bir şeyler yapın
});
```

### `'beforeDestroy'` / `'afterDestroy'`

Bir kayıt silinmeden önce ve sonra ilgili olaylar tetiklenir. Bu, `repository.destroy()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.beforeDestroy` | 'beforeDestroy' | `${string}.afterDestroy` | 'afterDestroy', listener: DestroyListener): this
```

**Tür**

```ts
import type { DestroyOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type DestroyListener = (
  model: Model,
  options?: DestroyOptions,
) => HookReturn;
```

**Örnek**

```ts
db.on('beforeDestroy', async (model, options) => {
  // bir şeyler yapın
});

db.on('books.afterDestroy', async (model, options) => {
  // bir şeyler yapın
});
```

### `'afterCreateWithAssociations'`

Bu olay, hiyerarşik ilişki verileriyle bir kayıt oluşturulduktan sonra tetiklenir. `repository.create()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.afterCreateWithAssociations` | 'afterCreateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tür**

```ts
import type { CreateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type CreateWithAssociationsListener = (
  model: Model,
  options?: CreateOptions,
) => HookReturn;
```

**Örnek**

```ts
db.on('afterCreateWithAssociations', async (model, options) => {
  // bir şeyler yapın
});

db.on('books.afterCreateWithAssociations', async (model, options) => {
  // bir şeyler yapın
});
```

### `'afterUpdateWithAssociations'`

Bu olay, hiyerarşik ilişki verileriyle bir kayıt güncellendikten sonra tetiklenir. `repository.update()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.afterUpdateWithAssociations` | 'afterUpdateWithAssociations', listener: CreateWithAssociationsListener): this
```

**Tür**

```ts
import type { UpdateOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type UpdateWithAssociationsListener = (
  model: Model,
  options?: UpdateOptions,
) => HookReturn;
```

**Örnek**

```ts
db.on('afterUpdateWithAssociations', async (model, options) => {
  // bir şeyler yapın
});

db.on('books.afterUpdateWithAssociations', async (model, options) => {
  // bir şeyler yapın
});
```

### `'afterSaveWithAssociations'`

Bu olay, hiyerarşik ilişki verileriyle bir kayıt oluşturulduktan veya güncellendikten sonra tetiklenir. `repository.create()` veya `repository.update()` çağrıldığında tetiklenir.

**İmza**

```ts
on(eventName: `${string}.afterSaveWithAssociations` | 'afterSaveWithAssociations', listener: SaveWithAssociationsListener): this
```

**Tür**

```ts
import type { SaveOptions, HookReturn } from 'sequelize/types';
import type { Model } from '@nocobase/database';

export type SaveWithAssociationsListener = (
  model: Model,
  options?: SaveOptions,
) => HookReturn;
```

**Örnek**

```ts
db.on('afterSaveWithAssociations', async (model, options) => {
  // bir şeyler yapın
});

db.on('books.afterSaveWithAssociations', async (model, options) => {
  // bir şeyler yapın
});
```

### `'beforeDefineCollection'`

Bir `koleksiyon` tanımlanmadan önce tetiklenir, örneğin `db.collection()` çağrıldığında.

Not: Bu senkron bir olaydır.

**İmza**

```ts
on(eventName: 'beforeDefineCollection', listener: BeforeDefineCollectionListener): this
```

**Tür**

```ts
import type { CollectionOptions } from '@nocobase/database';

export type BeforeDefineCollectionListener = (
  options: CollectionOptions,
) => void;
```

**Örnek**

```ts
db.on('beforeDefineCollection', (options) => {
  // bir şeyler yapın
});
```

### `'afterDefineCollection'`

Bir `koleksiyon` tanımlandıktan sonra tetiklenir, örneğin `db.collection()` çağrıldığında.

Not: Bu senkron bir olaydır.

**İmza**

```ts
on(eventName: 'afterDefineCollection', listener: AfterDefineCollectionListener): this
```

**Tür**

```ts
import type { Collection } from '@nocobase/database';

export type AfterDefineCollectionListener = (options: Collection) => void;
```

**Örnek**

```ts
db.on('afterDefineCollection', (collection) => {
  // bir şeyler yapın
});
```

### `'beforeRemoveCollection'` / `'afterRemoveCollection'`

Bir `koleksiyon` bellekten kaldırılmadan önce ve sonra tetiklenir, örneğin `db.removeCollection()` çağrıldığında.

Not: Bu senkron bir olaydır.

**İmza**

```ts
on(eventName: 'beforeRemoveCollection' | 'afterRemoveCollection', listener: RemoveCollectionListener): this
```

**Tür**

```ts
import type { Collection } from '@nocobase/database';

export type RemoveCollectionListener = (options: Collection) => void;
```

**Örnek**

```ts
db.on('beforeRemoveCollection', (collection) => {
  // bir şeyler yapın
});

db.on('afterRemoveCollection', (collection) => {
  // bir şeyler yapın
});
```