---
title: "ctx.makeResource()"
description: "ctx.makeResource() membuat instance API resource, untuk CRUD kustom, operasi relasi, digunakan dengan initResource."
keywords: "ctx.makeResource,initResource,API resource,CRUD,MultiRecordResource,SingleRecordResource,RunJS,NocoBase"
---

# ctx.makeResource()

**Membuat** instance resource baru dan mengembalikannya, **tidak akan** menulis atau mengubah `ctx.resource`. Cocok untuk skenario yang membutuhkan beberapa resource independen atau penggunaan sementara.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Multiple Resource** | Memuat beberapa data source bersamaan (seperti list user + list order), setiap data dengan resource independen |
| **Query Sementara** | Query sekali pakai, dibuang setelah digunakan, tidak perlu mengikat ke `ctx.resource` |
| **Data Pendukung** | Data utama menggunakan `ctx.resource`, data tambahan dibuat dengan `makeResource` |

Jika hanya membutuhkan satu resource dan ingin mengikatnya ke `ctx.resource`, lebih cocok menggunakan [ctx.initResource()](./init-resource.md).

## Definisi Tipe

```ts
makeResource<T = FlowResource>(
  resourceType: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): T;
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `resourceType` | `string` | Tipe resource: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Return Value**: instance resource yang baru dibuat.

## Perbedaan dengan ctx.initResource()

| Method | Perilaku |
|------|------|
| `ctx.makeResource(type)` | Hanya membuat instance baru dan mengembalikannya, **tidak** menulis ke `ctx.resource`. Dapat dipanggil beberapa kali untuk mendapatkan beberapa resource independen |
| `ctx.initResource(type)` | Jika `ctx.resource` tidak ada akan membuat dan mengikat; jika sudah ada langsung mengembalikan. Memastikan `ctx.resource` tersedia |

## Contoh

### Resource Tunggal

```ts
const listRes = ctx.makeResource('MultiRecordResource');
listRes.setResourceName('users');
await listRes.refresh();
const users = listRes.getData();
// ctx.resource tetap dengan nilai aslinya (jika ada)
```

### Multiple Resource

```ts
const usersRes = ctx.makeResource('MultiRecordResource');
usersRes.setResourceName('users');
await usersRes.refresh();

const ordersRes = ctx.makeResource('MultiRecordResource');
ordersRes.setResourceName('orders');
await ordersRes.refresh();

ctx.render(
  <div>
    <p>Jumlah user: {usersRes.getData().length}</p>
    <p>Jumlah order: {ordersRes.getData().length}</p>
  </div>
);
```

### Query Sementara

```ts
// Query sekali pakai, tidak mengotori ctx.resource
const tempRes = ctx.makeResource('SingleRecordResource');
tempRes.setResourceName('users');
tempRes.setFilterByTk(1);
await tempRes.refresh();
const record = tempRes.getData();
```

## Hal yang Perlu Diperhatikan

- Resource baru perlu memanggil `setResourceName(name)` untuk menentukan data table, kemudian memuat data melalui `refresh()`.
- Setiap instance resource independen, tidak saling memengaruhi; cocok untuk memuat beberapa data source secara paralel.

## Terkait

- [ctx.initResource()](./init-resource.md): Menginisialisasi dan mengikat ke `ctx.resource`
- [ctx.resource](./resource.md): Instance resource dalam konteks saat ini
- [MultiRecordResource](../resource/multi-record-resource) — Multiple record/list
- [SingleRecordResource](../resource/single-record-resource) — Single record
- [APIResource](../resource/api-resource) — API resource umum
- [SQLResource](../resource/sql-resource) — Resource query SQL
