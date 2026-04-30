---
title: "IRepository"
description: "Interface IRepository NocoBase: interface method operasi model Repository, beradaptasi dengan CRUD data source."
keywords: "IRepository,interface,Repository,CRUD,NocoBase"
---

# IRepository

Interface `Repository` mendefinisikan serangkaian method operasi model, yang digunakan untuk beradaptasi dengan operasi CRUD data source.

## API 

### find()

Berdasarkan parameter query, mengembalikan list model yang sesuai dengan kondisi

#### Signature

- `find(options?: any): Promise<IModel[]>`

### findOne()

Berdasarkan parameter query, mengembalikan model yang sesuai dengan kondisi, jika ada beberapa model yang sesuai, hanya mengembalikan yang pertama

#### Signature 

- `findOne(options?: any): Promise<IModel>`


### count()

Berdasarkan parameter query, mengembalikan jumlah model yang sesuai dengan kondisi

#### Signature

- `count(options?: any): Promise<Number>`

### findAndCount()

Berdasarkan parameter query, mengembalikan list dan jumlah model yang sesuai dengan kondisi

#### Signature

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

Membuat objek data model

#### Signature

- `create(options: any): void`

### update()

Berdasarkan kondisi query, memperbarui objek data model

#### Signature

- `update(options: any): void`

### destroy()

Berdasarkan kondisi query, menghapus objek data model

#### Signature

- `destroy(options: any): void`
