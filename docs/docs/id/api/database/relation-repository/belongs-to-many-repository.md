:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# BelongsToManyRepository

`BelongsToManyRepository` adalah sebuah `Relation Repository` yang digunakan untuk menangani hubungan `BelongsToMany`.

Berbeda dengan jenis hubungan lainnya, hubungan `BelongsToMany` perlu dicatat melalui tabel perantara (junction table).
Saat mendefinisikan hubungan asosiasi di NocoBase, tabel perantara dapat dibuat secara otomatis, atau Anda dapat menentukannya secara eksplisit.

## Metode Kelas

### `find()`

Mencari objek terkait (associated objects).

**Tanda Tangan**

- `async find(options?: FindOptions): Promise<M[]>`

**Detail**

Parameter kueri (query parameters) konsisten dengan [`Repository.find()`](../repository.md#find).

### `findOne()`

Mencari objek terkait, hanya mengembalikan satu rekaman.

**Tanda Tangan**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Mengembalikan jumlah rekaman yang sesuai dengan kondisi kueri.

**Tanda Tangan**

- `async count(options?: CountOptions)`

**Tipe**

```typescript
interface CountOptions
  extends Omit<SequelizeCountOptions, 'distinct' | 'where' | 'include'>,
    Transactionable {
  filter?: Filter;
}
```

### `findAndCount()`

Mengkueri basis data untuk mendapatkan kumpulan data (dataset) dan jumlah total (count) berdasarkan kondisi tertentu.

**Tanda Tangan**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tipe**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Membuat objek terkait.

**Tanda Tangan**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Memperbarui objek terkait yang memenuhi kondisi.

**Tanda Tangan**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Menghapus objek terkait yang memenuhi kondisi.

**Tanda Tangan**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Menambahkan objek terkait baru.

**Tanda Tangan**

- `async add(
options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions
): Promise<void>`

**Tipe**

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

**Detail**

Anda dapat langsung meneruskan `targetKey` dari objek terkait, atau meneruskan `targetKey` beserta nilai-nilai kolom dari tabel perantara.

**Contoh**

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

// Meneruskan targetKey
PostTagRepository.add([t1.id, t2.id]);

// Meneruskan kolom tabel perantara
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Mengatur objek terkait.

**Tanda Tangan**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Detail**

Parameter sama dengan [add()](#add).

### `remove()`

Menghapus hubungan asosiasi dengan objek yang diberikan.

**Tanda Tangan**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipe**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Mengubah status objek terkait (toggle associated objects).

Dalam beberapa skenario bisnis, seringkali diperlukan untuk mengubah status objek terkait. Misalnya, pengguna dapat memfavoritkan suatu produk, membatalkan favorit, dan memfavoritkan kembali. Metode `toggle` dapat digunakan untuk mengimplementasikan fungsionalitas serupa dengan cepat.

**Tanda Tangan**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Detail**

Metode `toggle` secara otomatis memeriksa apakah objek terkait sudah ada. Jika ada, objek akan dihapus; jika tidak ada, objek akan ditambahkan.