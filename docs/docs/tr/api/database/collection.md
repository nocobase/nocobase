:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# koleksiyon

## Genel Bakış

`koleksiyon`, sistemdeki veri modellerini (model adları, alanlar, indeksler, ilişkiler gibi) tanımlamak için kullanılır.
Genellikle, bir `Database` örneğinin `collection` metodu üzerinden bir proxy girişi olarak çağrılır.

```javascript
const { Database } = require('@nocobase/database')

// Bir veritabanı örneği oluşturun
const db = new Database({...});

// Bir veri modeli tanımlayın
db.collection({
  name: 'users',
  // Model alanlarını tanımlayın
  fields: [
    // Skaler alan
    {
      name: 'name',
      type: 'string',
    },

    // İlişki alanı
    {
      name: 'profile',
      type: 'hasOne' // 'hasMany', 'belongsTo', 'belongsToMany'
    }
  ],
});
```

Daha fazla alan türü için lütfen [Alanlar](/api/database/field) bölümüne bakın.

## Kurucu Fonksiyon

**İmza**

- `constructor(options: CollectionOptions, context: CollectionContext)`

**Parametreler**

| Parametre Adı         | Tip                                                         | Varsayılan Değer | Açıklama                                                                                   |
| --------------------- | ----------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `options.name`        | `string`                                                    | -      | koleksiyon tanımlayıcısı                                                                   |
| `options.tableName?`  | `string`                                                    | -      | Veritabanı tablo adı. Sağlanmazsa, `options.name` değeri kullanılır.                       |
| `options.fields?`     | `FieldOptions[]`                                            | -      | Alan tanımları. Detaylar için [Alan](./field) bölümüne bakın.                              |
| `options.model?`      | `string \| ModelStatic<Model>`                              | -      | Sequelize Model tipi. Eğer `string` kullanılırsa, model adının daha önce `db` üzerinde kaydedilmiş olması gerekir. |
| `options.repository?` | `string \| RepositoryType`                                  | -      | Depo tipi. Eğer `string` kullanılırsa, depo tipinin daha önce `db` üzerinde kaydedilmiş olması gerekir.    |
| `options.sortable?`   | `string \| boolean \| { name?: string; scopeKey?: string }` | -      | Sıralanabilir alan yapılandırması. Varsayılan olarak sıralanmaz.                           |
| `options.autoGenId?`  | `boolean`                                                   | `true` | Benzersiz birincil anahtarın otomatik olarak oluşturulup oluşturulmayacağı. Varsayılan olarak `true`. |
| `context.database`    | `Database`                                                  | -      | Mevcut bağlamdaki veritabanı.                                                              |

**Örnek**

Bir gönderi koleksiyonu oluşturun:

```ts
const posts = new Collection(
  {
    name: 'posts',
    fields: [
      {
        type: 'string',
        name: 'title',
      },
      {
        type: 'double',
        name: 'price',
      },
    ],
  },
  {
    // Mevcut veritabanı örneği
    database: db,
  },
);
```

## Örnek Üyeleri

### `options`

koleksiyon için başlangıç yapılandırma parametreleri. Kurucu fonksiyonun `options` parametresiyle aynıdır.

### `context`

Mevcut koleksiyonun ait olduğu bağlam, şu anda başlıca veritabanı örneğidir.

### `name`

koleksiyon adı.

### `db`

Ait olduğu veritabanı örneği.

### `filterTargetKey`

Birincil anahtar olarak kullanılan alan adı.

### `isThrough`

Bir ara koleksiyon olup olmadığı.

### `model`

Sequelize Model tipiyle eşleşir.

### `repository`

Depo örneği.

## Alan Yapılandırma Metotları

### `getField()`

koleksiyonda tanımlanmış, ilgili ada sahip alan nesnesini alır.

**İmza**

- `getField(name: string): Field`

**Parametreler**

| Parametre Adı | Tip      | Varsayılan Değer | Açıklama   |
| ------------- | -------- | ------ | ---------- |
| `name`        | `string` | -      | Alan adı   |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const field = posts.getField('title');
```

### `setField()`

koleksiyona bir alan ayarlar.

**İmza**

- `setField(name: string, options: FieldOptions): Field`

**Parametreler**

| Parametre Adı | Tip            | Varsayılan Değer | Açıklama                                  |
| ------------- | -------------- | ------ | ----------------------------------------- |
| `name`        | `string`       | -      | Alan adı                                  |
| `options`     | `FieldOptions` | -      | Alan yapılandırması. Detaylar için [Alan](./field) bölümüne bakın. |

**Örnek**

```ts
const posts = db.collection({ name: 'posts' });

posts.setField('title', { type: 'string' });
```

### `setFields()`

koleksiyona birden fazla alanı toplu olarak ayarlar.

**İmza**

- `setFields(fields: FieldOptions[], resetFields = true): Field[]`

**Parametreler**

| Parametre Adı | Tip              | Varsayılan Değer | Açıklama                                  |
| ------------- | ---------------- | ------ | ----------------------------------------- |
| `fields`      | `FieldOptions[]` | -      | Alan yapılandırması. Detaylar için [Alan](./field) bölümüne bakın. |
| `resetFields` | `boolean`        | `true` | Mevcut alanların sıfırlanıp sıfırlanmayacağı. |

**Örnek**

```ts
const posts = db.collection({ name: 'posts' });

posts.setFields([
  { type: 'string', name: 'title' },
  { type: 'double', name: 'price' },
]);
```

### `removeField()`

koleksiyonda tanımlanmış, ilgili ada sahip alan nesnesini kaldırır.

**İmza**

- `removeField(name: string): void | Field`

**Parametreler**

| Parametre Adı | Tip      | Varsayılan Değer | Açıklama   |
| ------------- | -------- | ------ | ---------- |
| `name`        | `string` | -      | Alan adı   |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.removeField('title');
```

### `resetFields()`

koleksiyonun alanlarını sıfırlar (temizler).

**İmza**

- `resetFields(): void`

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.resetFields();
```

### `hasField()`

koleksiyonda ilgili ada sahip bir alan nesnesinin tanımlı olup olmadığını kontrol eder.

**İmza**

- `hasField(name: string): boolean`

**Parametreler**

| Parametre Adı | Tip      | Varsayılan Değer | Açıklama   |
| ------------- | -------- | ------ | ---------- |
| `name`        | `string` | -      | Alan adı   |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.hasField('title'); // true
```

### `findField()`

koleksiyonda kriterlere uyan bir alan nesnesi bulur.

**İmza**

- `findField(predicate: (field: Field) => boolean): Field | undefined`

**Parametreler**

| Parametre Adı | Tip                         | Varsayılan Değer | Açıklama       |
| ------------- | --------------------------- | ------ | -------------- |
| `predicate`   | `(field: Field) => boolean` | -      | Arama kriteri  |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.findField((field) => field.name === 'title');
```

### `forEachField()`

koleksiyondaki alan nesneleri üzerinde döner.

**İmza**

- `forEachField(callback: (field: Field) => void): void`

**Parametreler**

| Parametre Adı | Tip                      | Varsayılan Değer | Açıklama          |
| ------------- | ------------------------ | ------ | ----------------- |
| `callback`    | `(field: Field) => void` | -      | Geri çağırma fonksiyonu |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.forEachField((field) => console.log(field.name));
```

## İndeks Yapılandırma Metotları

### `addIndex()`

koleksiyona bir indeks ekler.

**İmza**

- `addIndex(index: string | string[] | { fields: string[], unique?: boolean,[key: string]: any })`

**Parametreler**

| Parametre Adı | Tip                                                          | Varsayılan Değer | Açıklama                   |
| ------------- | ------------------------------------------------------------ | ------ | -------------------------- |
| `index`       | `string \| string[]`                                         | -      | İndekslenecek alan adı(ları). |
| `index`       | `{ fields: string[], unique?: boolean, [key: string]: any }` | -      | Tam yapılandırma.          |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.addIndex({
  fields: ['title'],
  unique: true,
});
```

### `removeIndex()`

koleksiyondan bir indeksi kaldırır.

**İmza**

- `removeIndex(fields: string[])`

**Parametreler**

| Parametre Adı | Tip        | Varsayılan Değer | Açıklama                           |
| ------------- | ---------- | ------ | ---------------------------------- |
| `fields`      | `string[]` | -      | Kaldırılacak indeksin alan adları kombinasyonu. |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
  indexes: [
    {
      fields: ['title'],
      unique: true,
    },
  ],
});

posts.removeIndex(['title']);
```

## koleksiyon Yapılandırma Metotları

### `remove()`

koleksiyonu siler.

**İmza**

- `remove(): void`

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

posts.remove();
```

## Veritabanı İşlem Metotları

### `sync()`

koleksiyon tanımını veritabanına senkronize eder. Sequelize'deki varsayılan `Model.sync` mantığına ek olarak, ilişki alanlarına karşılık gelen koleksiyonları da işler.

**İmza**

- `sync(): Promise<void>`

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

await posts.sync();
```

### `existsInDb()`

koleksiyonun veritabanında mevcut olup olmadığını kontrol eder.

**İmza**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametreler**

| Parametre Adı          | Tip           | Varsayılan Değer | Açıklama       |
| ---------------------- | ------------- | ------ | -------------- |
| `options?.transaction` | `Transaction` | -      | İşlem örneği   |

**Örnek**

```ts
const posts = db.collection({
  name: 'posts',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});

const existed = await posts.existsInDb();

console.log(existed); // false
```

### `removeFromDb()`

**İmza**

- `removeFromDb(): Promise<void>`

**Örnek**

```ts
const books = db.collection({
  name: 'books',
});

// Kitap koleksiyonunu veritabanına senkronize edin
await db.sync();

// Veritabanındaki kitap koleksiyonunu kaldırın
await books.removeFromDb();
```