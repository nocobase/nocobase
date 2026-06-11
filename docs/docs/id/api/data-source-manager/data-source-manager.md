---
title: "DataSourceManager"
description: "API DataSourceManager NocoBase: mengelola beberapa instance DataSource, abstract class DataSource."
keywords: "DataSourceManager,DataSource,multi data source,manajemen data source,NocoBase"
---

# DataSourceManager

`DataSourceManager` adalah class manajemen untuk beberapa instance `dataSource`.

## API

### add()
Menambahkan satu instance `dataSource`.

#### Signature

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Menambahkan middleware global ke instance `dataSource`.

### middleware()

Mengambil middleware dari instance `dataSourceManager` saat ini, dapat digunakan untuk merespons request HTTP.

### afterAddDataSource()

Hook function yang dipanggil setelah `dataSource` baru ditambahkan.

#### Signature

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Mendaftarkan tipe data source dan class-nya.

#### Signature

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Mengambil class data source.

#### Signature

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Membuat instance data source berdasarkan tipe data source yang terdaftar dan parameter instance.

#### Signature

- `buildDataSourceByType(type: string, options: any): DataSource`
