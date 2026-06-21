---
title: "ICollectionManager"
description: "Interface ICollectionManager NocoBase: interface untuk mengelola instance Collection dari data source."
keywords: "ICollectionManager,interface,Collection,data source,NocoBase"
---

# ICollectionManager

Interface `ICollectionManager`, digunakan untuk mengelola instance `Collection` dari data source.

## API

### registerFieldTypes()

Mendaftarkan tipe field di `Collection`.

#### Signature

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Mendaftarkan `Interface` dari `Collection`.

#### Signature

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Mendaftarkan `Collection Template`.

#### Signature

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Mendaftarkan `Model`.

#### Signature

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Mendaftarkan `Repository`.

#### Signature

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Mendapatkan instance repository yang terdaftar.

#### Signature

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Mendefinisikan satu `Collection`.

#### Signature

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Memodifikasi properti `Collection` yang sudah ada.

#### Signature

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Memeriksa apakah `Collection` ada.

#### Signature


- `hasCollection(name: string): boolean`

### getCollection()

Mendapatkan instance `Collection`.

#### Signature

- `getCollection(name: string): ICollection`

### getCollections()

Mendapatkan semua instance `Collection`.

#### Signature

- `getCollections(): Array<ICollection>`

### getRepository()

Mendapatkan instance `Repository`.

#### Signature

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Sinkronisasi data source, logika diimplementasikan oleh subclass.

#### Signature

- `sync(): Promise<void>`


