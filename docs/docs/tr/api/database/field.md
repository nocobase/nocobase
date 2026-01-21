:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Alan

## Genel Bakış

Koleksiyon alan yönetimi sınıfı (soyut sınıf). Aynı zamanda tüm alan tiplerinin temel sınıfıdır. Diğer tüm alan tipleri bu sınıfı miras alarak uygulanır.

Alanları nasıl özelleştireceğinizi öğrenmek için lütfen [Alan Tiplerini Genişletme] bölümüne bakınız.

## Yapıcı Metot

Geliştiriciler tarafından genellikle doğrudan çağrılmaz; temel olarak `db.collection({ fields: [] })` metodu aracılığıyla bir proxy girişi olarak kullanılır.

Bir alan genişletirken, temel olarak `Field` soyut sınıfını miras alarak ve ardından bunu Database örneğine kaydederek uygulanır.

**İmza**

- `constructor(options: FieldOptions, context: FieldContext)`

**Parametreler**

| Parametre Adı        | Tip            | Varsayılan Değer | Açıklama                                     |
| :------------------- | :------------- | :--------------- | :------------------------------------------- |
| `options`            | `FieldOptions` | -                | Alan yapılandırma nesnesi                    |
| `options.name`       | `string`       | -                | Alan adı                                     |
| `options.type`       | `string`       | -                | Alan tipi, db'de kayıtlı alan tipinin adına karşılık gelir |
| `context`            | `FieldContext` | -                | Alan bağlam nesnesi                          |
| `context.database`   | `Database`     | -                | Veritabanı örneği                            |
| `context.collection` | `Collection`   | -                | Koleksiyon örneği                            |

## Örnek Üyeler

### `name`

Alan adı.

### `type`

Alan tipi.

### `dataType`

Alan veritabanı depolama tipi.

### `options`

Alan başlatma yapılandırma parametreleri.

### `context`

Alan bağlam nesnesi.

## Yapılandırma Metotları

### `on()`

Koleksiyon olaylarına dayalı bir kısayol tanımlama metodudur. Bu, `db.on(this.collection.name + '.' + eventName, listener)` ile eşdeğerdir.

Miras alırken bu metodu genellikle geçersiz kılmanıza gerek yoktur.

**İmza**

- `on(eventName: string, listener: (...args: any[]) => void)`

**Parametreler**

| Parametre Adı | Tip                        | Varsayılan Değer | Açıklama       |
| :------------ | :------------------------- | :--------------- | :------------- |
| `eventName`   | `string`                   | -                | Olay adı       |
| `listener`    | `(...args: any[]) => void` | -                | Olay dinleyicisi |

### `off()`

Koleksiyon olaylarına dayalı bir kısayol kaldırma metodudur. Bu, `db.off(this.collection.name + '.' + eventName, listener)` ile eşdeğerdir.

Miras alırken bu metodu genellikle geçersiz kılmanıza gerek yoktur.

**İmza**

- `off(eventName: string, listener: (...args: any[]) => void)`

**Parametreler**

| Parametre Adı | Tip                        | Varsayılan Değer | Açıklama       |
| :------------ | :------------------------- | :--------------- | :------------- |
| `eventName`   | `string`                   | -                | Olay adı       |
| `listener`    | `(...args: any[]) => void` | -                | Olay dinleyicisi |

### `bind()`

Bir alan bir koleksiyona eklendiğinde çalıştırılacak içeriktir. Genellikle koleksiyon olay dinleyicileri ve diğer işlemleri eklemek için kullanılır.

Miras alırken, önce ilgili `super.bind()` metodunu çağırmanız gerekir.

**İmza**

- `bind()`

### `unbind()`

Bir alan bir koleksiyondan kaldırıldığında çalıştırılacak içeriktir. Genellikle koleksiyon olay dinleyicilerini ve diğer işlemleri kaldırmak için kullanılır.

Miras alırken, önce ilgili `super.unbind()` metodunu çağırmanız gerekir.

**İmza**

- `unbind()`

### `get()`

Bir alanın yapılandırma öğesinin değerini alır.

**İmza**

- `get(key: string): any`

**Parametreler**

| Parametre Adı | Tip      | Varsayılan Değer | Açıklama         |
| :------------ | :------- | :--------------- | :--------------- |
| `key`         | `string` | -                | Yapılandırma öğesi adı |

**Örnek**

```ts
const field = db.collection('users').getField('name');

// Alan adı yapılandırma öğesinin değerini alır, 'name' döndürür
console.log(field.get('name'));
```

### `merge()`

Bir alanın yapılandırma öğelerinin değerlerini birleştirir.

**İmza**

- `merge(options: { [key: string]: any }): void`

**Parametreler**

| Parametre Adı | Tip                      | Varsayılan Değer | Açıklama                   |
| :------------ | :----------------------- | :--------------- | :------------------------- |
| `options`     | `{ [key: string]: any }` | -                | Birleştirilecek yapılandırma öğesi nesnesi |

**Örnek**

```ts
const field = db.collection('users').getField('name');

field.merge({
  // Bir indeks yapılandırması ekler
  index: true,
});
```

### `remove()`

Alanı koleksiyondan kaldırır (yalnızca bellekten kaldırır).

**Örnek**

```ts
const books = db.getCollections('books');

books.getField('isbn').remove();

// veritabanından gerçekten kaldırın
await books.sync();
```

## Veritabanı Metotları

### `removeFromDb()`

Alanı veritabanından kaldırır.

**İmza**

- `removeFromDb(options?: Transactionable): Promise<void>`

**Parametreler**

| Parametre Adı          | Tip           | Varsayılan Değer | Açıklama     |
| :--------------------- | :------------ | :--------------- | :----------- |
| `options.transaction?` | `Transaction` | -                | İşlem örneği |

### `existsInDb()`

Alanın veritabanında var olup olmadığını belirler.

**İmza**

- `existsInDb(options?: Transactionable): Promise<boolean>`

**Parametreler**

| Parametre Adı          | Tip           | Varsayılan Değer | Açıklama     |
| :--------------------- | :------------ | :--------------- | :----------- |
| `options.transaction?` | `Transaction` | -                | İşlem örneği |

## Yerleşik Alan Tipleri Listesi

NocoBase, bazı yaygın olarak kullanılan alan tiplerini yerleşik olarak sunar ve bir koleksiyon için alanları tanımlarken doğrudan ilgili tip adını kullanarak tipi belirleyebilirsiniz. Farklı alan tiplerinin farklı parametre yapılandırmaları vardır, ayrıntılar için aşağıdaki listeye bakınız.

Alan tipleri için aşağıdaki ek olarak tanıtılanlar dışındaki tüm yapılandırma öğeleri Sequelize'a iletilir, bu nedenle Sequelize tarafından desteklenen tüm alan yapılandırma öğeleri burada kullanılabilir (örneğin `allowNull`, `defaultValue` vb.).

Ek olarak, sunucu tarafı alan tipleri temel olarak veritabanı depolama ve bazı algoritma sorunlarını çözer ve ön uç alan görüntüleme tipleri ve kullanılan bileşenlerle temelde ilgisizdir. Ön uç alan tipleri için lütfen ilgili eğitim açıklamalarına bakınız.

### `'boolean'`

Mantıksal değer tipi.

**Örnek**

```js
db.collection({
  name: 'books',
  fields: [
    {
      type: 'boolean',
      name: 'published',
    },
  ],
});
```

### `'integer'`

Tam sayı tipi (32-bit).

**Örnek**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'integer',
      name: 'pages',
    },
  ],
});
```

### `'bigInt'`

Büyük tam sayı tipi (64-bit).

**Örnek**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'bigInt',
      name: 'words',
    },
  ],
});
```

### `'double'`

Çift hassasiyetli kayan nokta tipi (64-bit).

**Örnek**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
  ],
});
```

### `'real'`

Gerçek sayı tipi (yalnızca PG için geçerlidir).

### `'decimal'`

Ondalık sayı tipi.

### `'string'`

Dize tipi. Çoğu veritabanındaki `VARCHAR` tipine eşdeğerdir.

**Örnek**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'string',
      name: 'title',
    },
  ],
});
```

### `'text'`

Metin tipi. Çoğu veritabanındaki `TEXT` tipine eşdeğerdir.

**Örnek**

```ts
db.collection({
  name: 'books',
  fields: [
    {
      type: 'text',
      name: 'content',
    },
  ],
});
```

### `'password'`

Parola tipi (NocoBase eklentisi). Node.js'in yerel crypto paketinin `scrypt` metoduna dayalı parola şifrelemesi yapar.

**Örnek**

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'password',
      name: 'password',
      length: 64, // Uzunluk, varsayılan 64
      randomBytesSize: 8, // Rastgele bayt uzunluğu, varsayılan 8
    },
  ],
});
```

**Parametreler**

| Parametre Adı     | Tip      | Varsayılan Değer | Açıklama         |
| :---------------- | :------- | :--------------- | :--------------- |
| `length`          | `number` | 64               | Karakter uzunluğu |
| `randomBytesSize` | `number` | 8                | Rastgele bayt boyutu |

### `'date'`

Tarih tipi.

### `'time'`

Saat tipi.

### `'array'`

Dizi tipi (yalnızca PG için geçerlidir).

### `'json'`

JSON tipi.

### `'jsonb'`

JSONB tipi (yalnızca PG için geçerlidir, diğerleri `'json'` tipi olarak uyumlu hale getirilir).

### `'uuid'`

UUID tipi.

### `'uid'`

UID tipi (NocoBase eklentisi). Kısa rastgele dize tanımlayıcı tipi.

### `'formula'`

Formül tipi (NocoBase eklentisi). [mathjs](https://www.npmjs.com/package/mathjs) tabanlı matematiksel formül hesaplamaları yapılandırılabilir. Formülde aynı kayıttaki diğer sütunların değerleri hesaplamaya dahil edilebilir.

**Örnek**

```ts
db.collection({
  name: 'orders',
  fields: [
    {
      type: 'double',
      name: 'price',
    },
    {
      type: 'integer',
      name: 'quantity',
    },
    {
      type: 'formula',
      name: 'total',
      expression: 'price * quantity',
    },
  ],
});
```

### `'radio'`

Radyo tipi (NocoBase eklentisi). Tüm koleksiyonda en fazla bir satırın bu alan değeri `true` olabilir; diğerleri `false` veya `null` olacaktır.

**Örnek**

Tüm sistemde yalnızca bir kullanıcı root olarak işaretlenebilir. Başka bir kullanıcının root değeri `true` olarak değiştirildikten sonra, root değeri `true` olan diğer tüm kayıtlar `false` olarak değiştirilecektir:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'radio',
      name: 'root',
    },
  ],
});
```

### `'sort'`

Sıralama tipi (NocoBase eklentisi). Tam sayıları temel alarak sıralama yapar, yeni kayıtlara otomatik olarak yeni sıra numaraları atar ve veriler taşındığında sıra numaralarını yeniden düzenler.

Bir koleksiyon `sortable` seçeneğini tanımlarsa, ilgili alan da otomatik olarak oluşturulur.

**Örnek**

Yazılar, ait oldukları kullanıcıya göre sıralanabilir:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'user',
    },
    {
      type: 'sort',
      name: 'priority',
      scopeKey: 'userId', // Aynı userId değerine göre gruplandırılmış verileri sıralar
    },
  ],
});
```

### `'virtual'`

Sanal tip. Gerçekte veri depolamaz, yalnızca özel getter/setter tanımları için kullanılır.

### `'belongsTo'`

Çoka bir ilişki tipi. Yabancı anahtar kendi koleksiyonunda saklanır, hasOne/hasMany ilişkilerinin tersidir.

**Örnek**

Herhangi bir yazı bir yazara aittir:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users', // Yapılandırılmazsa, varsayılan olarak adın çoğul hali koleksiyon adı olarak kullanılır
      foreignKey: 'authorId', // Yapılandırılmazsa, varsayılan olarak `<name> + Id` formatı kullanılır
      sourceKey: 'id', // Yapılandırılmazsa, varsayılan olarak hedef koleksiyonun kimliği kullanılır
    },
  ],
});
```

### `'hasOne'`

Bire bir ilişki tipi. Yabancı anahtar ilişkili koleksiyonda saklanır, belongsTo ilişkisinin tersidir.

**Örnek**

Her kullanıcının bir profili vardır:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasOne',
      name: 'profile',
      target: 'profiles', // Atlanabilir
    },
  ],
});
```

### `'hasMany'`

Bire çok ilişki tipi. Yabancı anahtar ilişkili koleksiyonda saklanır, belongsTo ilişkisinin tersidir.

**Örnek**

Her kullanıcı birden fazla yazıya sahip olabilir:

```ts
db.collection({
  name: 'users',
  fields: [
    {
      type: 'hasMany',
      name: 'posts',
      foreignKey: 'authorId',
      sourceKey: 'id',
    },
  ],
});
```

### `'belongsToMany'`

Çoka çok ilişki tipi. Her iki tarafın yabancı anahtarlarını depolamak için bir ara koleksiyon kullanır. Eğer mevcut bir koleksiyon ara koleksiyon olarak belirtilmezse, otomatik olarak bir ara koleksiyon oluşturulur.

**Örnek**

Herhangi bir yazıya birden fazla etiket eklenebilir ve herhangi bir etiket birden fazla yazıya eklenebilir:

```ts
db.collection({
  name: 'posts',
  fields: [
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags', // Aynı ad ise atlanabilir
      through: 'postsTags', // Ara koleksiyon yapılandırılmazsa otomatik olarak oluşturulur
      foreignKey: 'postId', // Kendi koleksiyonunun ara koleksiyondaki yabancı anahtarı
      sourceKey: 'id', // Kendi koleksiyonunun birincil anahtarı
      otherKey: 'tagId', // İlişkili koleksiyonun ara koleksiyondaki yabancı anahtarı
    },
  ],
});

db.collection({
  name: 'tags',
  fields: [
    {
      type: 'belongsToMany',
      name: 'posts',
      through: 'postsTags', // Aynı ilişki grubu aynı ara koleksiyonu işaret eder
    },
  ],
});
```