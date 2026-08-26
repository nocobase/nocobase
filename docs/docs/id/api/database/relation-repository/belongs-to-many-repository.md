---
title: "BelongsToManyRepository"
description: "Repository relasi BelongsToMany NocoBase: menangani CRUD untuk relasi many-to-many."
keywords: "BelongsToManyRepository,BelongsToMany,many-to-many,Repository,NocoBase"
---

# BelongsToManyRepository

`BelongsToManyRepository` adalah `Relation Repository` yang digunakan untuk menangani relasi `BelongsToMany`.

Berbeda dari tipe relasi lainnya, relasi tipe `BelongsToMany` perlu dicatat melalui tabel perantara.
Saat mendefinisikan asosiasi di NocoBase, tabel perantara dapat dibuat secara otomatis, atau ditentukan secara eksplisit.

## Method Class

### `find()`

Mencari objek terkait

**Signature**

- `async find(options?: FindOptions): Promise<M[]>`

**Detail**

Parameter query konsisten dengan [`Repository.find()`](../repository.md#find).

### `findOne()`

Mencari objek terkait, hanya mengembalikan satu record

**Signature**

- `async findOne(options?: FindOneOptions): Promise<M>`

<embed src="../shared/find-one.md"></embed>

### `count()`

Mengembalikan jumlah record yang sesuai dengan kondisi query

**Signature**

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

Query data set dan jumlah hasil dari database berdasarkan kondisi tertentu.

**Signature**

- `async findAndCount(options?: FindAndCountOptions): Promise<[any[], number]>`

**Tipe**

```typescript
type FindAndCountOptions = CommonFindOptions;
```

### `create()`

Membuat objek terkait

**Signature**

- `async create(options?: CreateOptions): Promise<M>`

<embed src="../shared/create-options.md"></embed>

### `update()`

Memperbarui objek terkait yang sesuai dengan kondisi

**Signature**

- `async update(options?: UpdateOptions): Promise<M>`

<embed src="../shared/update-options.md"></embed>

### `destroy()`

Menghapus objek terkait yang sesuai dengan kondisi

**Signature**

- `async destroy(options?: TargetKey | TargetKey[] | DestroyOptions): Promise<Boolean>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Menambahkan objek asosiasi baru

**Signature**

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

Anda dapat memasukkan `targetKey` dari objek terkait secara langsung, atau memasukkan `targetKey` bersama dengan nilai field tabel perantara.

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

// Memasukkan targetKey
PostTagRepository.add([t1.id, t2.id]);

// Memasukkan field tabel perantara
PostTagRepository.add([
  [t1.id, { tagged_at: '123' }],
  [t2.id, { tagged_at: '456' }],
]);
```

### `set()`

Mengatur objek terkait

**Signature**

- async set(
  options: TargetKey | TargetKey[] | PrimaryKeyWithThroughValues | PrimaryKeyWithThroughValues[] | AssociatedOptions,
  ): Promise<void>

**Detail**

Parameter sama dengan [add()](#add)

### `remove()`

Menghapus asosiasi dengan objek yang diberikan

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipe**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

### `toggle()`

Toggle objek terkait.

Pada beberapa skenario bisnis, sering kali perlu toggle objek terkait, contohnya user menyimpan produk, user dapat membatalkan favorit, atau menambahkannya kembali ke favorit. Menggunakan method `toggle` dapat dengan cepat mengimplementasikan fungsi serupa.

**Signature**

- `async toggle(options: TargetKey | { tk?: TargetKey; transaction?: Transaction }): Promise<void>`

**Detail**

Method `toggle` akan otomatis menentukan apakah objek terkait sudah ada, jika ada maka dihapus, jika tidak ada maka ditambahkan.
