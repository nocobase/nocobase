---
title: "HasManyRepository"
description: "Repository relasi HasMany NocoBase: menangani CRUD untuk relasi one-to-many."
keywords: "HasManyRepository,HasMany,one-to-many,Repository,NocoBase"
---

# HasManyRepository

`HasManyRepository` adalah `Relation Repository` yang digunakan untuk menangani relasi `HasMany`.

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

- `async destroy(options?: TK | DestroyOptions): Promise<M>`

<embed src="../shared/destroy-options.md"></embed>

### `add()`

Menambahkan asosiasi objek

**Signature**

- `async add(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Tipe**

```typescript
interface AssociatedOptions extends Transactionable {
  tk?: TargetKey | TargetKey[];
}
```

**Detail**

- `tk` - Nilai targetKey dari objek terkait, dapat berupa nilai tunggal atau array.
  <embed src="../shared/transaction.md"></embed>

### `remove()`

Menghapus asosiasi dengan objek yang diberikan

**Signature**

- `async remove(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detail**

Parameter sama dengan method [`add()`](#add).

### `set()`

Mengatur objek terkait untuk relasi saat ini

**Signature**

- `async set(options: TargetKey | TargetKey[] | AssociatedOptions)`

**Detail**

Parameter sama dengan method [`add()`](#add).
