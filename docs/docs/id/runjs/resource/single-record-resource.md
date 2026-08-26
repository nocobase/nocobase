---
title: "RunJS SingleRecordResource"
description: "Resource single record RunJS: getData mengembalikan single object, setFilterByTk, save, create, update, destroy, cocok untuk block detail, block form, resource relasi."
keywords: "SingleRecordResource,single record,setFilterByTk,save,block detail,block form,RunJS,NocoBase"
---

# SingleRecordResource

Resource yang berorientasi pada **single record**: data adalah single object, mendukung get berdasarkan primary key, create/update (save), dan delete. Cocok untuk skenario "single record" seperti detail, form, dll. Berbeda dengan [MultiRecordResource](./multi-record-resource.md), `getData()` SingleRecordResource mengembalikan single object, primary key ditentukan melalui `setFilterByTk(id)`, `save()` akan otomatis memanggil create atau update berdasarkan `isNewRecord`.

**Hubungan Inheritance**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Cara Pembuatan**: `ctx.makeResource('SingleRecordResource')` atau `ctx.initResource('SingleRecordResource')`. Sebelum digunakan perlu `setResourceName('nama-data-table')`; saat operasi berdasarkan primary key perlu `setFilterByTk(id)`; di RunJS `ctx.api` disuntikkan oleh runtime environment.

---

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **Block Detail** | Block detail secara default menggunakan SingleRecordResource, memuat single record berdasarkan primary key |
| **Block Form** | Form create/edit menggunakan SingleRecordResource, `save()` otomatis membedakan create/update |
| **JSBlock Detail** | Memuat single user, order, dll. di JSBlock dan kustomisasi tampilan |
| **Resource Relasi** | Menggunakan bentuk `users.profile` dll. untuk memuat single record relasi, perlu digunakan dengan `setSourceId(ID-record-parent)` |

---

## Format Data

- `getData()` mengembalikan **objek record tunggal**, yaitu field `data` dari API get
- `getMeta()` mengembalikan informasi meta (jika ada)

---

## Nama Resource dan Primary Key

| Method | Deskripsi |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nama resource, seperti `'users'`, `'users.profile'` (resource relasi) |
| `setSourceId(id)` / `getSourceId()` | ID record parent saat resource relasi (seperti `users.profile` perlu meneruskan primary key users) |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Identifier data source (digunakan pada multi-data-source) |
| `setFilterByTk(tk)` / `getFilterByTk()` | Primary key record saat ini; setelah disetel `isNewRecord` adalah false |

---

## Status

| Properti/Method | Deskripsi |
|----------|------|
| `isNewRecord` | Apakah dalam status "new" (true saat filterByTk belum disetel atau baru dibuat) |

---

## Parameter Request (Filter / Field)

| Method | Deskripsi |
|------|------|
| `setFilter(filter)` / `getFilter()` | Filter (tersedia saat bukan new) |
| `setFields(fields)` / `getFields()` | Field request |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Expand relasi |

---

## CRUD

| Method | Deskripsi |
|------|------|
| `refresh()` | Request get berdasarkan `filterByTk` saat ini, update `getData()`; saat status new tidak melakukan request |
| `save(data, options?)` | Saat new memanggil create, jika tidak memanggil update; opsional `{ refresh: false }` untuk tidak otomatis refresh |
| `destroy(options?)` | Delete berdasarkan `filterByTk` saat ini, dan menghapus data lokal |
| `runAction(actionName, options)` | Memanggil action resource sembarang |

---

## Konfigurasi dan Event

| Method | Deskripsi |
|------|------|
| `setSaveActionOptions(options)` | Konfigurasi request saat save |
| `on('refresh', fn)` / `on('saved', fn)` | Memicu setelah refresh selesai, save |

---

## Contoh

### Get dan Update Dasar

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Update
await ctx.resource.save({ name: 'Budi' });
```

### Membuat Record Baru

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Citra', email: 'citra@example.com' });
```

### Menghapus Record

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// getData() adalah null setelah destroy
```

### Expand Relasi dan Field

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Resource Relasi (seperti users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Primary key record parent
res.setFilterByTk(profileId);    // Jika profile adalah hasOne dapat menghilangkan filterByTk
await res.refresh();
const profile = res.getData();
```

### save Tidak Otomatis Refresh

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// Setelah save tidak memicu refresh, getData() mempertahankan nilai lama
```

### Memantau Event refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>User: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Save berhasil');
});
await ctx.resource?.refresh?.();
```

---

## Hal yang Perlu Diperhatikan

- **setResourceName wajib**: sebelum digunakan harus memanggil `setResourceName('nama-data-table')`, jika tidak tidak dapat membangun URL request.
- **filterByTk dan isNewRecord**: saat `setFilterByTk` belum disetel `isNewRecord` adalah true, `refresh()` tidak akan melakukan request; `save()` akan menjalankan create.
- **Resource relasi**: saat nama resource adalah `parent.child` (seperti `users.profile`), perlu `setSourceId(primary key record parent)` terlebih dahulu.
- **getData adalah objek**: `data` yang dikembalikan API single adalah objek record, `getData()` langsung mengembalikan objek tersebut; setelah `destroy()` adalah null.

---

## Terkait

- [ctx.resource](../context/resource.md) - Instance resource dalam konteks saat ini
- [ctx.initResource()](../context/init-resource.md) - Inisialisasi dan mengikat ke ctx.resource
- [ctx.makeResource()](../context/make-resource.md) - Membuat instance resource baru, tidak mengikat
- [APIResource](./api-resource.md) - API resource umum, request berdasarkan URL
- [MultiRecordResource](./multi-record-resource.md) - Berorientasi data table/list, mendukung CRUD, pagination
