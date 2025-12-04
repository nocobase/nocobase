:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# BelongsToManyRepository

`BelongsToManyRepository`, `BelongsToMany` ilişkilerini yönetmek için kullanılan bir `İlişki Deposu`'dur.

Diğer ilişki türlerinden farklı olarak, `BelongsToMany` ilişkileri bir ara tablo aracılığıyla kaydedilmelidir. NocoBase'de bir ilişki tanımlarken, ara tablo otomatik olarak oluşturulabilir veya açıkça belirtilebilir.

## Sınıf Metotları

### `find()`

İlişkili nesneleri bulur.

**İmza**

- `async find(options?: FindOptions): Promise<M[]>`

**Detaylar**

Sorgu parametreleri [`Repository.find()`](../repository.md#find) ile aynıdır.

### `findOne()`

İlişkili bir nesneyi bulur ve yalnızca tek bir kayıt döndürür.

**İmza**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Sorgu koşullarına uyan kayıt sayısını döndürür.

**İmza**

- `async count(options?: CountOptions)`

**Tip**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Belirli koşullar altındaki bir veri kümesini ve toplam sayısını veritabanından sorgular.

**İmza**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tip**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

İlişkili bir nesne oluşturur.

**İmza**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Koşulları karşılayan ilişkili nesneleri günceller.

**İmza**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Koşulları karşılayan ilişkili nesneleri siler.

**İmza**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Yeni ilişkili nesneler ekler.

**İmza**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Tip**

```typescript
type PrimaryKeyWithThroughValues = [TargetKey, Values];

interface AssociatedOptions extends Transactionable {
  tk?:
    | TargetKey
    | TargetKey[]
    | PrimaryKeyWithThroughValues
    | PrimaryKeyWithThroughValues[];
}
```

**Detaylar**

İlişkili nesnenin `targetKey`'ini doğrudan iletebilir veya `targetKey`'i ara tablonun alan değerleriyle birlikte iletebilirsiniz.

**Örnek**

```typescript
const t1 = await Tag.repository.create({
  values: { name: 't1' },
});

const t2 = await Tag.repository.create({
  values: { name: 't2' },
});

const p1 = await Post.repository.create({
  values: { title: 'p1' },
});

const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);

// targetKey'i iletin
PostTagRepository.add([t1.id, t2.id]);

// Ara tablo alanlarını iletin
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

İlişkili nesneleri ayarlar.

**İmza**

- `async set(options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions): Promise<void>`

**Detaylar**

Parametreler [add()](#add) ile aynıdır.

### `remove()`

Verilen nesnelerle olan ilişkiyi kaldırır.

**İmza**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tip**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

İlişkili nesneleri değiştirir (toggle).

Bazı iş senaryolarında, ilişkili nesneleri değiştirmek (toggle) sıkça gerekir. Örneğin, bir kullanıcı bir ürünü favorilerine ekleyebilir, favorilerden çıkarabilir ve tekrar ekleyebilir. `toggle` metodu, bu tür işlevleri hızlıca uygulamanızı sağlar.

**İmza**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Detaylar**

`toggle` metodu, ilişkili nesnenin zaten var olup olmadığını otomatik olarak kontrol eder. Eğer varsa kaldırılır, yoksa eklenir.