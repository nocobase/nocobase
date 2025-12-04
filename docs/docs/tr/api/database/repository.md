:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Depo

## Genel Bakış

Belirli bir `koleksiyon` nesnesi üzerinde, o `koleksiyon` üzerinde okuma ve yazma işlemleri gerçekleştirmek için `Depo` nesnesini alabilirsiniz.

```javascript
const { UserCollection } = require('./collections');

const UserRepository = UserCollection.repository;

const user = await UserRepository.findOne({
  filter: {
    id: 1,
  },
});

user.name = 'new name';
await user.save();
```

### Sorgu

#### Temel Sorgu

`Depo` nesnesi üzerinde `find*` ile başlayan metotları çağırarak sorgu işlemleri gerçekleştirebilirsiniz. Tüm sorgu metotları, verileri filtrelemek için `filter` parametresini kullanmanıza olanak tanır.

```javascript
// SELECT * FROM users WHERE id = 1
userRepository.find({
  filter: {
    id: 1,
  },
});
```

#### Operatörler

`Depo`'daki `filter` parametresi, daha çeşitli sorgu işlemleri gerçekleştirmek için farklı operatörler de sağlar.

```javascript
// SELECT * FROM users WHERE age > 18
userRepository.find({
  filter: {
    age: {
      $gt: 18,
    },
  },
});

// SELECT * FROM users WHERE age > 18 OR name LIKE '%张%'
userRepository.find({
  filter: {
    $or: [{ age: { $gt: 18 } }, { name: { $like: '%张%' } }],
  },
});
```

Operatörler hakkında daha fazla bilgi için lütfen [Filtre Operatörleri](/api/database/operators) bölümünü inceleyin.

#### Alan Kontrolü

Sorgulama işlemi yaparken, `fields`, `except` ve `appends` parametreleri aracılığıyla çıktı alanlarını kontrol edebilirsiniz.

- `fields`: Çıktı alanlarını belirtir
- `except`: Çıktı alanlarından hariç tutulacakları belirler
- `appends`: Çıktıya ilişkili alanları ekler

```javascript
// Sonuç sadece id ve name alanlarını içerecektir
userRepository.find({
  fields: ['id', 'name'],
});

// Sonuç password alanını içermeyecektir
userRepository.find({
  except: ['password'],
});

// Sonuç, ilişkili posts nesnesinin verilerini içerecektir
userRepository.find({
  appends: ['posts'],
});
```

#### İlişkili Alanları Sorgulama

`filter` parametresi, ilişkili alanlara göre filtrelemeyi destekler, örneğin:

```javascript
// İlişkili posts'larında 'post title' başlıklı bir nesne bulunan kullanıcı nesnelerini sorgular
userRepository.find({
  filter: {
    'posts.title': 'post title',
  },
});
```

İlişkili alanlar iç içe de kullanılabilir.

```javascript
// posts'larının yorumlarında 'keywords' içeren kullanıcı nesnelerini sorgular
await userRepository.find({
  filter: {
    'posts.comments.content': {
      $like: '%keywords%',
    },
  },
});
```

#### Sıralama

`sort` parametresini kullanarak sorgu sonuçlarını sıralayabilirsiniz.

```javascript
// SELECT * FROM users ORDER BY age
await userRepository.find({
  sort: 'age',
});

// SELECT * FROM users ORDER BY age DESC
await userRepository.find({
  sort: '-age',
});

// SELECT * FROM users ORDER BY age DESC, name ASC
await userRepository.find({
  sort: ['-age', 'name'],
});
```

İlişkili nesnelerin alanlarına göre de sıralama yapabilirsiniz.

```javascript
await userRepository.find({
  sort: 'profile.createdAt',
});
```

### Oluşturma

#### Temel Oluşturma

`Depo` aracılığıyla yeni veri nesneleri oluşturun.

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
});
// INSERT INTO users (name, age) VALUES ('张三', 18)

// Toplu oluşturmayı destekler
await userRepository.create([
  {
    name: '张三',
    age: 18,
  },
  {
    name: '李四',
    age: 20,
  },
]);
```

#### İlişkileri Oluşturma

Oluşturma sırasında ilişkili nesneleri de eş zamanlı olarak oluşturabilirsiniz. Sorgulamaya benzer şekilde, ilişkili nesnelerin iç içe kullanımı da desteklenir, örneğin:

```javascript
await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          name: 'tag1',
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
// Bir kullanıcı oluşturulurken, post da kullanıcıyla ilişkilendirilir ve etiketler (tags) post ile ilişkilendirilir.
```

Eğer ilişkili nesne veri tabanında zaten mevcutsa, oluşturma sırasında onun ID'sini ileterek ilişkili nesneyle bir ilişki kurabilirsiniz.

```javascript
const tag1 = await tagRepository.findOne({
  filter: {
    name: 'tag1',
  },
});

await userRepository.create({
  name: '张三',
  age: 18,
  posts: [
    {
      title: 'post title',
      content: 'post content',
      tags: [
        {
          id: tag1.id, // Mevcut bir ilişkili nesneyle ilişki kurar
        },
        {
          name: 'tag2',
        },
      ],
    },
  ],
});
```

### Güncelleme

#### Temel Güncelleme

Bir veri nesnesini aldıktan sonra, doğrudan veri nesnesi (`Model`) üzerinde özelliklerini değiştirebilir ve ardından değişiklikleri kaydetmek için `save` metodunu çağırabilirsiniz.

```javascript
const user = await userRepository.findOne({
  filter: {
    name: '张三',
  },
});

user.age = 20;
await user.save();
```

Veri nesnesi `Model`, Sequelize Model'den miras alır. `Model` üzerindeki işlemler için lütfen [Sequelize Model](https://sequelize.org/master/manual/model-basics.html) bölümünü inceleyin.

`Depo` aracılığıyla da verileri güncelleyebilirsiniz:

```javascript
// Filtreleme koşullarını karşılayan veri kayıtlarını günceller
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
  },
});
```

Güncelleme yaparken, `whitelist` ve `blacklist` parametrelerini kullanarak hangi alanların güncelleneceğini kontrol edebilirsiniz, örneğin:

```javascript
await userRepository.update({
  filter: {
    name: '张三',
  },
  values: {
    age: 20,
    name: '李四',
  },
  whitelist: ['age'], // Sadece age alanını günceller
});
```

#### İlişkili Alanları Güncelleme

Güncelleme yaparken, ilişkili nesneleri ayarlayabilirsiniz, örneğin:

```javascript
const tag1 = tagRepository.findOne({
  filter: {
    id: 1,
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    title: 'new post title',
    tags: [
      {
        id: tag1.id, // tag1 ile ilişki kurar
      },
      {
        name: 'tag2', // Yeni bir etiket (tag) oluşturur ve ilişki kurar
      },
    ],
  },
});

await postRepository.update({
  filter: {
    id: 1,
  },
  values: {
    tags: null, // post ile etiketler (tags) arasındaki ilişkiyi kaldırır
  },
});
```

### Silme

`Depo` içindeki `destroy()` metodunu çağırarak silme işlemi gerçekleştirebilirsiniz. Silme işlemi yaparken filtreleme koşullarını belirtmeniz gerekir:

```javascript
await userRepository.destroy({
  filter: {
    status: 'blocked',
  },
});
```

## Yapıcı Fonksiyon

Genellikle geliştiriciler tarafından doğrudan çağrılmaz. Esas olarak `db.registerRepositories()` aracılığıyla tür kaydedildikten ve `db.collection()` parametrelerinde ilgili kayıtlı depo türü belirtildikten sonra örneği oluşturulur.

**İmza**

- `constructor(collection: Collection)`

**Örnek**

```ts
import { Repository } from '@nocobase/database';

class MyRepository extends Repository {
  async myQuery(sql) {
    return this.database.sequelize.query(sql);
  }
}

db.registerRepositories({
  books: MyRepository,
});

db.collection({
  name: 'books',
  // here link to the registered repository
  repository: 'books',
});

await db.sync();

const books = db.getRepository('books') as MyRepository;
await books.myQuery('SELECT * FROM books;');
```

## Örnek Üyeleri

### `database`

Bağlamın bulunduğu veri tabanı yönetim örneği.

### `collection`

İlgili `koleksiyon` yönetim örneği.

### `model`

İlgili model sınıfı.

## Örnek Metotları

### `find()`

Veri tabanından bir veri kümesi sorgular; filtreleme koşulları, sıralama vb. belirtilebilir.

**İmza**

- `async find(options?: FindOptions): Promise<Model[]>`

**Tip**

```typescript
type Filter = FilterWithOperator | FilterWithValue | FilterAnd | FilterOr;
type Appends = string[];
type Except = string[];
type Fields = string[];
type Sort = string[] | string;

interface SequelizeFindOptions {
  limit?: number;
  offset?: number;
}

interface FilterByTk {
  filterByTk?: TargetKey;
}

interface CommonFindOptions extends Transactionable {
  filter?: Filter;
  fields?: Fields;
  appends?: Appends;
  except?: Except;
  sort?: Sort;
}

type FindOptions = SequelizeFindOptions & CommonFindOptions & FilterByTk;
```

**Detaylar**

#### `filter: Filter`

Veri sonuçlarını filtrelemek için kullanılan sorgu koşulu. Geçirilen sorgu parametrelerinde, `key` sorgulanacak alan adıdır ve `value` sorgulanacak değeri veya diğer koşullu veri filtrelemesi için operatörlerle birlikte kullanılabilir.

```typescript
// name'i 'foo' olan ve age'i 18'den büyük olan kayıtları sorgular
repository.find({
  filter: {
    name: 'foo',
    age: {
      $gt: 18,
    },
  },
});
```

Daha fazla operatör için lütfen [Sorgu Operatörleri](./operators.md) bölümünü inceleyin.

#### `filterByTk: TargetKey`

`TargetKey` aracılığıyla veri sorgular; bu, `filter` parametresi için pratik bir yöntemdir. `TargetKey`'in hangi alan olduğu, `koleksiyon` içinde [yapılandırılabilir](./collection.md#filtertargetkey) ve varsayılan olarak `primaryKey`'dir.

```typescript
// Varsayılan olarak, id'si 1 olan kaydı bulur
repository.find({
  filterByTk: 1,
});
```

#### `fields: string[]`

Veri alanı sonuçlarını kontrol etmek için kullanılan sorgu sütunları. Bu parametre geçildikten sonra, yalnızca belirtilen alanlar döndürülür.

#### `except: string[]`

Veri alanı sonuçlarını kontrol etmek için kullanılan hariç tutulan sütunlar. Bu parametre geçildikten sonra, belirtilen alanlar çıktı olarak verilmez.

#### `appends: string[]`

İlişkili verileri yüklemek için eklenen sütunlar. Bu parametre geçildikten sonra, belirtilen ilişkili alanlar da çıktı olarak verilir.

#### `sort: string[] | string`

Sorgu sonuçları için sıralama yöntemini belirtir. Parametre alan adıdır ve varsayılan olarak artan `asc` düzende sıralanır. Azalan `desc` düzende sıralamak için alan adının önüne `-` sembolü ekleyin, örneğin: `['-id', 'name']`, bu `id desc, name asc` şeklinde sıralama anlamına gelir.

#### `limit: number`

Sonuç sayısını sınırlar, `SQL`'deki `limit` ile aynıdır.

#### `offset: number`

Sorgu ofseti, `SQL`'deki `offset` ile aynıdır.

**Örnek**

```ts
const posts = db.getRepository('posts');

const results = await posts.find({
  filter: {
    createdAt: {
      $gt: '2022-01-01T00:00:00.000Z',
    },
  },
  fields: ['title'],
  appends: ['user'],
});
```

### `findOne()`

Veri tabanından belirli koşulları karşılayan tek bir veri parçasını sorgular. Sequelize'deki `Model.findOne()` ile eşdeğerdir.

<embed src="./shared/find-one.md"></embed>

**İmza**

- `async findOne(options?: FindOneOptions): Promise<Model | null>`

**Örnek**

```ts
const posts = db.getRepository('posts');

const result = await posts.findOne({
  filterByTk: 1,
});
```

### `count()`

Veri tabanından belirli koşulları karşılayan toplam veri giriş sayısını sorgular. Sequelize'deki `Model.count()` ile eşdeğerdir.

**İmza**

- `count(options?: CountOptions): Promise<number>`

**Tip**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

**Örnek**

```ts
const books = db.getRepository('books');

const count = await books.count({
  filter: {
    title: '三字经',
  },
});
```

### `findAndCount()`

Veri tabanından belirli koşulları karşılayan bir veri kümesini ve toplam sonuç sayısını sorgular. Sequelize'deki `Model.findAndCountAll()` ile eşdeğerdir.

**İmza**

- `async findAndCount(options?: FindAndCountOptions): Promise<[Model[], number]>`

**Tip**

```typescript
type FindAndCountOptions = Omit<
  SequelizeAndCountOptions,
  'where' | 'include' | 'order'
> &
  CommonFindOptions;
```

**Detaylar**

Sorgu parametreleri `find()` ile aynıdır. Dönüş değeri bir dizidir; ilk öğe sorgu sonucunu, ikinci öğe ise toplam sayıyı temsil eder.

### `create()`

`koleksiyon`'a yeni bir kayıt ekler. Sequelize'deki `Model.create()` ile eşdeğerdir. Oluşturulacak veri nesnesi ilişki alanı bilgilerini taşıdığında, ilgili ilişki veri kayıtları da eş zamanlı olarak oluşturulur veya güncellenir.

**İmza**

- `async create<M extends Model>(options: CreateOptions): Promise<M>`

<embed src="./shared/create-options.md"></embed>

**Örnek**

```ts
const posts = db.getRepository('posts');

const result = await posts.create({
  values: {
    title: 'NocoBase 1.0 Yayın Notları',
    tags: [
      // İlişki tablosunun birincil anahtar değeri mevcutsa, bu veriyi günceller
      { id: 1 },
      // Birincil anahtar değeri yoksa, yeni veri oluşturur
      { name: 'NocoBase' },
    ],
  },
});
```

### `createMany()`

`koleksiyon`'a birden fazla yeni kayıt ekler. `create()` metodunu birden çok kez çağırmaya eşdeğerdir.

**İmza**

- `createMany(options: CreateManyOptions): Promise<Model[]>`

**Tip**

```typescript
interface CreateManyOptions extends BulkCreateOptions {
  records: Values[];
}
```

**Detaylar**

- `records`: Oluşturulacak kayıtlar için veri nesnelerinin bir dizisi.
- `transaction`: İşlem (transaction) nesnesi. Eğer bir işlem parametresi geçilmezse, bu metot otomatik olarak dahili bir işlem oluşturur.

**Örnek**

```ts
const posts = db.getRepository('posts');

const results = await posts.createMany({
  records: [
    {
      title: 'NocoBase 1.0 Yayın Notları',
      tags: [
        // İlişki tablosunun birincil anahtar değeri mevcutsa, bu veriyi günceller
        { id: 1 },
        // Birincil anahtar değeri yoksa, yeni veri oluşturur
        { name: 'NocoBase' },
      ],
    },
    {
      title: 'NocoBase 1.1 Yayın Notları',
      tags: [{ id: 1 }],
    },
  ],
});
```

### `update()`

`koleksiyon`'daki verileri günceller. Sequelize'deki `Model.update()` ile eşdeğerdir. Güncellenecek veri nesnesi ilişki alanı bilgilerini taşıdığında, ilgili ilişki veri kayıtları da eş zamanlı olarak oluşturulur veya güncellenir.

**İmza**

- `async update<M extends Model>(options: UpdateOptions): Promise<M>`

<embed src="./shared/update-options.md"></embed>

**Örnek**

```ts
const posts = db.getRepository('posts');

const result = await posts.update({
  filterByTk: 1,
  values: {
    title: 'NocoBase 1.0 Yayın Notları',
    tags: [
      // İlişki tablosunun birincil anahtar değeri mevcutsa, bu veriyi günceller
      { id: 1 },
      // Birincil anahtar değeri yoksa, yeni veri oluşturur
      { name: 'NocoBase' },
    ],
  },
});
```

### `destroy()`

`koleksiyon`'daki verileri siler. Sequelize'deki `Model.destroy()` ile eşdeğerdir.

**İmza**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<number>`

**Tip**

```typescript
interface DestroyOptions extends SequelizeDestroyOptions {
  filter?: Filter;
  filterByTk?: TargetKey | TargetKey[];
  truncate?: boolean;
  context?: any;
}
```

**Detaylar**

- `filter`: Silinecek kayıtlar için filtreleme koşullarını belirtir. Filter'ın detaylı kullanımı için [`find()`](#find) metodunu inceleyin.
- `filterByTk`: Silinecek kayıtlar için TargetKey'e göre filtreleme koşullarını belirtir.
- `truncate`: `koleksiyon` verilerinin boşaltılıp boşaltılmayacağını belirler; `filter` veya `filterByTk` parametresi geçilmediğinde etkilidir.
- `transaction`: İşlem (transaction) nesnesi. Eğer bir işlem parametresi geçilmezse, bu metot otomatik olarak dahili bir işlem oluşturur.