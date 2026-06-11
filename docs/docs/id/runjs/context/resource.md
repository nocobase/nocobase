---
title: "ctx.resource"
description: "ctx.resource adalah instance API resource yang terkait dengan block saat ini, untuk operasi data seperti CRUD, refresh, mendapatkan baris terpilih."
keywords: "ctx.resource,API resource,CRUD,getData,refresh,RunJS,NocoBase"
---

# ctx.resource

Instance **FlowResource** dalam konteks saat ini, untuk mengakses dan mengoperasikan data. Pada sebagian besar block (form, table, detail, dll.) dan skenario popup, runtime environment akan pre-bind `ctx.resource`; pada skenario seperti JSBlock yang secara default tidak memiliki resource, perlu memanggil [ctx.initResource()](./init-resource.md) terlebih dahulu untuk inisialisasi, kemudian menggunakan melalui `ctx.resource`.

## Skenario Penggunaan

Semua skenario di RunJS yang perlu mengakses data terstruktur (list, single, custom API, SQL) dapat digunakan. Form, table, block detail dan popup biasanya sudah pre-bind; pada JSBlock, JSField, JSItem, JSColumn, dll. jika perlu memuat data, dapat `ctx.initResource(type)` terlebih dahulu kemudian mengakses `ctx.resource`.

## Definisi Tipe

```ts
resource: FlowResource | undefined;
```

- Pada konteks dengan pre-bind, `ctx.resource` adalah instance resource yang sesuai;
- JSBlock, dll. secara default tidak memiliki resource, adalah `undefined`, perlu `ctx.initResource(type)` terlebih dahulu baru memiliki nilai.

## Method Umum

Method yang diekspos oleh tipe resource yang berbeda (MultiRecordResource, SingleRecordResource, APIResource, SQLResource) sedikit berbeda, berikut adalah method umum atau yang sering digunakan:

| Method | Deskripsi |
|------|------|
| `getData()` | Mendapatkan data saat ini (list atau single) |
| `setData(value)` | Menyetel data lokal |
| `refresh()` | Melakukan request berdasarkan parameter saat ini, refresh data |
| `setResourceName(name)` | Menyetel nama resource (seperti `'users'`, `'users.tags'`) |
| `setFilterByTk(tk)` | Menyetel filter primary key (single get, dll.) |
| `runAction(actionName, options)` | Memanggil action resource sembarang (seperti `create`, `update`) |
| `on(event, callback)` / `off(event, callback)` | Subscribe/unsubscribe event (seperti `refresh`, `saved`) |

**Khusus MultiRecordResource**: `getSelectedRows()`, `destroySelectedRows()`, `setPage()`, `next()`, `previous()`, dll.

## Contoh

### Data List (Perlu initResource Terlebih Dahulu)

```js
ctx.initResource('MultiRecordResource');
ctx.resource.setResourceName('users');
await ctx.resource.refresh();
const rows = ctx.resource.getData();
```

### Skenario Tabel (Sudah Pre-Bind)

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
for (const row of rows) {
  console.log(row);
}

await ctx.resource.destroySelectedRows();
ctx.message.success(ctx.t('Sudah dihapus'));
```

### Single Record

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const record = ctx.resource.getData();
```

### Memanggil Action Kustom

```js
await ctx.resource.runAction('create', { data: { name: 'Andi' } });
```

## Hubungan dengan ctx.initResource / ctx.makeResource

- **ctx.initResource(type)**: jika `ctx.resource` tidak ada akan membuat dan mengikat; jika sudah ada langsung mengembalikan. Memastikan `ctx.resource` tersedia.
- **ctx.makeResource(type)**: membuat instance resource baru dan mengembalikan, **tidak** menulis ke `ctx.resource`. Cocok untuk skenario yang memerlukan beberapa resource independen atau penggunaan sementara.
- **ctx.resource**: mengakses resource yang sudah terikat dalam konteks saat ini. Sebagian besar block/popup sudah pre-bind; saat tidak ada binding adalah `undefined`, perlu `ctx.initResource` terlebih dahulu.

## Hal yang Perlu Diperhatikan

- Sebelum digunakan disarankan melakukan pengecekan null: `ctx.resource?.refresh()`, terutama pada skenario seperti JSBlock yang mungkin tidak pre-bind.
- Setelah inisialisasi perlu memanggil `setResourceName(name)` untuk menentukan data table, kemudian memuat data melalui `refresh()`.
- API lengkap setiap tipe Resource lihat link di bawah.

## Terkait

- [ctx.initResource()](./init-resource.md) - Inisialisasi dan mengikat resource ke konteks saat ini
- [ctx.makeResource()](./make-resource.md) - Membuat instance resource baru, tidak mengikat ke `ctx.resource`
- [MultiRecordResource](../resource/multi-record-resource.md) - Multiple record/list
- [SingleRecordResource](../resource/single-record-resource.md) - Single record
- [APIResource](../resource/api-resource.md) - API resource umum
- [SQLResource](../resource/sql-resource.md) - Resource query SQL
