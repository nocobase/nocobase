---
title: "ctx.initResource()"
description: "ctx.initResource() menginisialisasi resource RunJS, membuat instance API resource yang dapat digunakan kembali."
keywords: "ctx.initResource,makeResource,API resource,MultiRecordResource,SingleRecordResource,RunJS,NocoBase"
---

# ctx.initResource()

**Menginisialisasi** resource pada konteks saat ini: jika `ctx.resource` belum ada, maka membuat satu sesuai tipe yang ditentukan dan mengikatnya ke konteks; jika sudah ada langsung digunakan. Setelahnya dapat diakses melalui `ctx.resource`.

## Skenario Penggunaan

Umumnya hanya digunakan pada skenario **JSBlock** (block independen). Sebagian besar block, popup, dll. sudah pre-bind `ctx.resource`, tidak perlu memanggil secara manual; JSBlock secara default tidak memiliki resource, perlu `ctx.initResource(type)` terlebih dahulu kemudian memuat data melalui `ctx.resource`.

## Definisi Tipe

```ts
initResource(
  type: 'APIResource' | 'SingleRecordResource' | 'MultiRecordResource' | 'SQLResource'
): FlowResource;
```

| Parameter | Tipe | Deskripsi |
|------|------|------|
| `type` | `string` | Tipe resource: `'APIResource'`, `'SingleRecordResource'`, `'MultiRecordResource'`, `'SQLResource'` |

**Return Value**: instance resource pada konteks saat ini (yaitu `ctx.resource`).

## Perbedaan dengan ctx.makeResource()

| Method | Perilaku |
|------|------|
| `ctx.initResource(type)` | Jika `ctx.resource` tidak ada akan membuat dan mengikat; jika sudah ada langsung mengembalikan. Memastikan `ctx.resource` tersedia |
| `ctx.makeResource(type)` | Hanya membuat instance baru dan mengembalikan, **tidak** menulis ke `ctx.resource`. Cocok untuk skenario yang membutuhkan beberapa resource independen atau penggunaan sementara |

## Contoh

### Data List (MultiRecordResource)

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
ctx.render(<pre>{JSON.stringify(rows, null, 2)}</pre>);
```

### Single Record (SingleRecordResource)

```ts
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1); // Menentukan primary key
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Menentukan Data Source

```ts
ctx.initResource('MultiRecordResource');
ctx.resource.setDataSourceKey('main');
ctx.resource.setResourceName('orders');
await ctx.resource.refresh();
```

## Hal yang Perlu Diperhatikan

- Pada sebagian besar block (form, table, detail, dll.) dan skenario popup, `ctx.resource` sudah pre-bind oleh runtime environment, tidak perlu memanggil `ctx.initResource`.
- Hanya perlu menginisialisasi secara manual pada konteks seperti JSBlock yang secara default tidak memiliki resource.
- Setelah inisialisasi perlu memanggil `setResourceName(name)` untuk menentukan data table, kemudian memuat data melalui `refresh()`.

## Terkait

- [ctx.resource](./resource.md): Instance resource dalam konteks saat ini
- [ctx.makeResource()](./make-resource.md): Membuat instance resource baru, tidak mengikat ke `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) — Multiple record/list
- [SingleRecordResource](../resource/single-record-resource.md) — Single record
- [APIResource](../resource/api-resource.md) — API resource umum
- [SQLResource](../resource/sql-resource.md) — Resource query SQL
