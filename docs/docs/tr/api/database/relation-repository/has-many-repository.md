:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# HasManyRepository

`HasManyRepository`, `HasMany` ilişkilerini yönetmek için kullanılan bir `Relation Repository`'dir.

## Sınıf Metotları

### `find()`

İlişkili nesneleri bulur

**İmza**

- `async find(options?: FindOptions): Promise<M[]>`

**Detaylar**

Sorgu parametreleri, [`Repository.find()`](../repository.md#find) ile aynıdır.

### `findOne()`

İlişkili bir nesneyi bulur ve yalnızca tek bir kayıt döndürür

**İmza**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Sorgu koşullarıyla eşleşen kayıt sayısını döndürür

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

Belirli koşullarla eşleşen bir veri kümesini ve sonuç sayısını veritabanından sorgular.

**İmza**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tip**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

İlişkili nesneler oluşturur

**İmza**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Koşulları karşılayan ilişkili nesneleri günceller

**İmza**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Koşulları karşılayan ilişkili nesneleri siler

**İmza**

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Nesne ilişkileri ekler

**İmza**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tip**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Detaylar**

- `tk` - İlişkili nesnenin targetKey değeridir; tek bir değer veya bir dizi olabilir.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Verilen nesnelerle olan ilişkiyi kaldırır

**İmza**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detaylar**

Parametreler, [`add()`](#add) metodu ile aynıdır.

### `set()`

Mevcut ilişki için ilişkili nesneleri ayarlar

**İmza**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detaylar**

Parametreler, [`add()`](#add) metodu ile aynıdır.