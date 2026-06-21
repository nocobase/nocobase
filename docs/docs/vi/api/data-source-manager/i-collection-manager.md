---
title: "ICollectionManager"
description: "Interface ICollectionManager của NocoBase: interface để quản lý các instance Collection của nguồn dữ liệu."
keywords: "ICollectionManager,interface,Collection,nguồn dữ liệu,NocoBase"
---

# ICollectionManager

Interface `ICollectionManager`, dùng để quản lý các instance `Collection` của nguồn dữ liệu.

## API

### registerFieldTypes()

Đăng ký các kiểu field trong `Collection`.

#### Chữ ký

- `registerFieldTypes(types: Record<string, any>): void`

### registerFieldInterfaces()

Đăng ký `Interface` của `Collection`.

#### Chữ ký

- `registerFieldInterfaces(interfaces: Record<string, any>): void`

### registerCollectionTemplates()

Đăng ký `Collection Template`.

#### Chữ ký

- `registerCollectionTemplates(templates: Record<string, any>): void`

### registerModels()

Đăng ký `Model`.

#### Chữ ký

- `registerModels(models: Record<string, any>): void`

### registerRepositories()

Đăng ký `Repository`.

#### Chữ ký

- `registerRepositories(repositories: Record<string, any>): void`

### getRegisteredRepository()

Lấy instance Repository đã đăng ký.

#### Chữ ký

- `getRegisteredRepository(key: string): IRepository`

### defineCollection()

Định nghĩa một `Collection`.

#### Chữ ký

- `defineCollection(options: CollectionOptions): ICollection`

### extendCollection()

Sửa thuộc tính của một `Collection` đã tồn tại.

#### Chữ ký

- `extendCollection(collectionOptions: CollectionOptions, mergeOptions?: MergeOptions): ICollection`

### hasCollection()

Kiểm tra `Collection` có tồn tại không.

#### Chữ ký


- `hasCollection(name: string): boolean`

### getCollection()

Lấy instance `Collection`.

#### Chữ ký

- `getCollection(name: string): ICollection`

### getCollections()

Lấy tất cả các instance `Collection`.

#### Chữ ký

- `getCollections(): Array<ICollection>`

### getRepository()

Lấy instance `Repository`.

#### Chữ ký

- `getRepository(name: string, sourceId?: string | number): IRepository`

### sync()

Đồng bộ nguồn dữ liệu, logic do lớp con triển khai.

#### Chữ ký

- `sync(): Promise<void>`


