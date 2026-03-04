:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/resource/single-record-resource).
:::

# SingleRecordResource

Resource yang berorientasi pada **satu catatan (single record)**: data berupa objek tunggal, mendukung pengambilan berdasarkan kunci utama (primary key), pembuatan/pembaruan (save), dan penghapusan. Cocok untuk skenario "satu catatan" seperti detail, formulir, dll. Berbeda dengan [MultiRecordResource](./multi-record-resource.md), metode `getData()` pada `SingleRecordResource` mengembalikan objek tunggal. Anda menentukan kunci utama melalui `setFilterByTk(id)`, dan `save()` akan secara otomatis memanggil `create` atau `update` berdasarkan status `isNewRecord`.

**Pewarisan**: FlowResource → APIResource → BaseRecordResource → SingleRecordResource.

**Cara Pembuatan**: `ctx.makeResource('SingleRecordResource')` atau `ctx.initResource('SingleRecordResource')`. Anda harus memanggil `setResourceName('nama_koleksi')` sebelum digunakan. Saat melakukan operasi berdasarkan kunci utama, panggil `setFilterByTk(id)`. Dalam RunJS, `ctx.api` disuntikkan oleh lingkungan runtime.

---

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **Blok Detail** | Blok detail menggunakan `SingleRecordResource` secara default untuk memuat satu catatan berdasarkan kunci utamanya. |
| **Blok Formulir** | Formulir Tambah/Edit menggunakan `SingleRecordResource`, di mana `save()` secara otomatis membedakan antara `create` dan `update`. |
| **JSBlock Detail** | Memuat satu pengguna, pesanan, dll., di dalam JSBlock dan menyesuaikan tampilannya. |
| **Resource Asosiasi** | Memuat catatan tunggal yang terkait menggunakan format `users.profile`, memerlukan `setSourceId(ID_catatan_induk)`. |

---

## Format Data

- `getData()` mengembalikan **objek catatan tunggal**, yang sesuai dengan kolom `data` dari respons API get.
- `getMeta()` mengembalikan元 informasi/metadata (jika ada).

---

## Nama Resource dan Kunci Utama

| Metode | Keterangan |
|------|------|
| `setResourceName(name)` / `getResourceName()` | Nama resource, misal `'users'`, `'users.profile'` (resource asosiasi). |
| `setSourceId(id)` / `getSourceId()` | ID catatan induk untuk resource asosiasi (misal `users.profile` memerlukan kunci utama dari catatan `users`). |
| `setDataSourceKey(key)` / `getDataSourceKey()` | Pengidentifikasi sumber data (digunakan dalam lingkungan multi-sumber data). |
| `setFilterByTk(tk)` / `getFilterByTk()` | Kunci utama catatan saat ini; setelah diatur, `isNewRecord` menjadi `false`. |

---

## Status

| Properti/Metode | Keterangan |
|----------|------|
| `isNewRecord` | Apakah dalam status "Baru" (bernilai true jika `filterByTk` tidak diatur atau jika baru saja dibuat). |

---

## Parameter Permintaan (Filter / Kolom)

| Metode | Keterangan |
|------|------|
| `setFilter(filter)` / `getFilter()` | Penyaringan (tersedia saat tidak dalam status "Baru"). |
| `setFields(fields)` / `getFields()` | Kolom yang diminta. |
| `setAppends(appends)` / `getAppends()` / `addAppends` / `removeAppends` | Pemuatan asosiasi (appends). |

---

## CRUD

| Metode | Keterangan |
|------|------|
| `refresh()` | Meminta `get` berdasarkan `filterByTk` saat ini dan memperbarui `getData()`; tidak melakukan permintaan dalam status "Baru". |
| `save(data, options?)` | Memanggil `create` saat dalam status "Baru", jika tidak memanggil `update`; opsional `{ refresh: false }` untuk mencegah penyegaran otomatis. |
| `destroy(options?)` | Menghapus catatan berdasarkan `filterByTk` saat ini dan menghapus data lokal. |
| `runAction(actionName, options)` | Memanggil action resource apa pun. |

---

## Konfigurasi dan Event

| Metode | Keterangan |
|------|------|
| `setSaveActionOptions(options)` | Konfigurasi permintaan untuk action `save`. |
| `on('refresh', fn)` / `on('saved', fn)` | Dipicu setelah penyegaran selesai atau setelah penyimpanan berhasil. |

---

## Contoh

### Pengambilan dan Pembaruan Dasar

```js
ctx.initResource('SingleRecordResource');
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.refresh();
const user = ctx.resource.getData();

// Perbarui
await ctx.resource.save({ name: 'Budi' });
```

### Membuat Catatan Baru

```js
const newRes = ctx.makeResource('SingleRecordResource');
newRes.setResourceName('users');
await newRes.save({ name: 'Wati', email: 'wati@example.com' });
```

### Menghapus Catatan

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
await ctx.resource.destroy();
// Setelah destroy, getData() akan bernilai null
```

### Pemuatan Asosiasi dan Kolom

```js
ctx.resource.setResourceName('users');
ctx.resource.setFilterByTk(1);
ctx.resource.setFields(['id', 'nickname', 'email']);
ctx.resource.setAppends(['profile', 'roles']);
await ctx.resource.refresh();
const user = ctx.resource.getData();
```

### Resource Asosiasi (misal users.profile)

```js
const res = ctx.makeResource('SingleRecordResource');
res.setResourceName('users.profile');
res.setSourceId(ctx.record?.id); // Kunci utama catatan induk
res.setFilterByTk(profileId);    // Jika profile adalah relasi hasOne, filterByTk dapat diabaikan
await res.refresh();
const profile = res.getData();
```

### Save Tanpa Penyegaran Otomatis

```js
await ctx.resource.save({ status: 'active' }, { refresh: false });
// Setelah penyimpanan, refresh tidak dipicu, getData() tetap memegang nilai lama
```

### Mendengarkan Event refresh / saved

```js
ctx.resource?.on?.('refresh', () => {
  const data = ctx.resource.getData();
  ctx.render(<div>Pengguna: {data?.nickname}</div>);
});
ctx.resource?.on?.('saved', (savedData) => {
  ctx.message.success('Berhasil disimpan');
});
await ctx.resource?.refresh?.();
```

---

## Catatan Penting

- **setResourceName wajib diisi**: Anda harus memanggil `setResourceName('nama_koleksi')` sebelum digunakan, jika tidak, URL permintaan tidak dapat dibuat.
- **filterByTk dan isNewRecord**: Jika `setFilterByTk` tidak diatur, `isNewRecord` bernilai `true`, dan `refresh()` tidak akan mengirimkan permintaan; `save()` akan menjalankan proses `create`.
- **Resource Asosiasi**: Ketika nama resource dalam format `induk.anak` (misal `users.profile`), Anda harus memanggil `setSourceId(kunci_utama_induk)` terlebih dahulu.
- **getData Berupa Objek**: Data yang dikembalikan oleh API catatan tunggal adalah objek catatan; `getData()` mengembalikan objek tersebut secara langsung. Nilainya menjadi `null` setelah `destroy()`.

---

## Terkait

- [ctx.resource](../context/resource.md) - Instans resource dalam konteks saat ini
- [ctx.initResource()](../context/init-resource.md) - Inisialisasi dan ikat ke `ctx.resource`
- [ctx.makeResource()](../context/make-resource.md) - Buat instans resource baru tanpa mengikat
- [APIResource](./api-resource.md) - Resource API umum yang diminta berdasarkan URL
- [MultiRecordResource](./multi-record-resource.md) - Berorientasi pada koleksi/daftar, mendukung CRUD dan penomoran halaman (pagination)