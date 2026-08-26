---
title: "DataSource (abstract)"
description: "Abstract class DataSource NocoBase: merepresentasikan tipe data source (database, API, dll), container untuk Collection dan Repository."
keywords: "DataSource,abstract class,tipe data source,Collection,container Repository,NocoBase"
---

# DataSource (abstract)

Abstract class `DataSource`, digunakan untuk merepresentasikan satu tipe data source, dapat berupa database, API, dll.

## Anggota

### collectionManager

Instance CollectionManager dari data source, harus mengimplementasikan interface [`ICollectionManager`](/api/data-source-manager/i-collection-manager).

### resourceManager

Instance resourceManager dari data source

### acl

Instance ACL dari data source

## API

### constructor()

Constructor, membuat instance `DataSource`.

#### Signature

- `constructor(options: DataSourceOptions)`

### init() 

Fungsi inisialisasi, dipanggil setelah `constructor`.

#### Signature

- `init(options: DataSourceOptions)`


### name

#### Signature

- `get name()`

Mengembalikan nama instance dari data source

### middleware()

Mendapatkan middleware DataSource, digunakan untuk mounting ke Server untuk menerima request.

### testConnection()

Static method, dipanggil saat operasi test koneksi, dapat digunakan untuk validasi parameter, logika spesifik diimplementasikan oleh subclass.

#### Signature

- `static testConnection(options?: any): Promise<boolean>`

### load()

#### Signature

- `async load(options: any = {})`

Operasi loading data source, logika diimplementasikan oleh subclass.

### createCollectionManager()

#### Signature
- `abstract createCollectionManager(options?: any): ICollectionManager`

Membuat instance CollectionManager dari data source, logika diimplementasikan oleh subclass.

### createResourceManager()

Membuat instance ResourceManager dari data source, subclass dapat meng-override implementasi, secara default membuat `ResourceManager` dari `@nocobase/resourcer`.

### createACL()

- Membuat instance ACL dari DataSource, subclass dapat meng-override implementasi, secara default membuat `ACL` dari `@nocobase/acl`.

