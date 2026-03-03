:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/runjs/context/open-view).
:::

# ctx.openView()

Membuka tampilan yang ditentukan (laci/drawer, dialog, halaman tersemat, dll.) secara terprogram. Disediakan oleh `FlowModelContext`, fungsi ini digunakan untuk membuka tampilan `ChildPage` atau `PopupAction` yang telah dikonfigurasi dalam skenario seperti `JSBlock`, sel tabel, alur kerja, dan lainnya.

## Skenario Penggunaan

| Skenario | Keterangan |
|------|------|
| **JSBlock** | Membuka dialog detail/edit setelah tombol diklik, meneruskan `filterByTk` dari baris saat ini. |
| **Sel Tabel** | Merender tombol di dalam sel, klik untuk membuka dialog detail baris. |
| **Alur Kerja / JSAction** | Membuka tampilan atau dialog berikutnya setelah operasi berhasil. |
| **Bidang Relasi** | Membuka dialog pemilihan/pengeditan melalui `ctx.runAction('openView', params)`. |

> Catatan: `ctx.openView` harus tersedia dalam lingkungan RunJS yang memiliki konteks `FlowModel`. Jika model yang sesuai dengan `uid` tidak ada, `PopupActionModel` akan dibuat secara otomatis dan disimpan secara permanen.

## Tanda Tangan (Signature)

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Penjelasan Parameter

### uid

Pengidentifikasi unik untuk model tampilan. Jika tidak ada, model akan dibuat dan disimpan secara otomatis. Disarankan untuk menggunakan UID yang stabil, seperti `${ctx.model.uid}-detail`, agar konfigurasi dapat digunakan kembali saat membuka dialog yang sama beberapa kali.

### Bidang options yang Umum Digunakan

| Bidang | Tipe | Keterangan |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Metode pembukaan: laci (drawer), dialog, atau tersemat (embed). Default: `drawer`. |
| `size` | `small` / `medium` / `large` | Ukuran dialog atau laci. Default: `medium`. |
| `title` | `string` | Judul tampilan. |
| `params` | `Record<string, any>` | Parameter arbitrer yang diteruskan ke tampilan. |
| `filterByTk` | `any` | Nilai kunci utama (primary key), digunakan untuk skenario detail/edit rekaman tunggal. |
| `sourceId` | `string` | ID rekaman sumber, digunakan dalam skenario relasi. |
| `dataSourceKey` | `string` | Sumber data. |
| `collectionName` | `string` | Nama koleksi. |
| `associationName` | `string` | Nama bidang relasi. |
| `navigation` | `boolean` | Apakah akan menggunakan navigasi rute. Jika `defineProperties` atau `defineMethods` diberikan, ini akan dipaksa menjadi `false`. |
| `preventClose` | `boolean` | Apakah akan mencegah penutupan. |
| `defineProperties` | `Record<string, PropertyOptions>` | Menyuntikkan properti secara dinamis ke dalam model di dalam tampilan. |
| `defineMethods` | `Record<string, Function>` | Menyuntikkan metode secara dinamis ke dalam model di dalam tampilan. |

## Contoh

### Penggunaan Dasar: Membuka Laci (Drawer)

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('Detail'),
});
```

### Meneruskan Konteks Baris Saat Ini

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('Detail Baris'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### Membuka melalui runAction

Ketika model dikonfigurasi dengan tindakan `openView` (seperti bidang relasi atau bidang yang dapat diklik), Anda dapat memanggil:

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### Menyuntikkan Konteks Kustom

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## Hubungan dengan ctx.viewer dan ctx.view

| Kegunaan | Penggunaan yang Disarankan |
|------|----------|
| **Membuka tampilan alur yang telah dikonfigurasi** | `ctx.openView(uid, options)` |
| **Membuka konten kustom (tanpa alur)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Mengoperasikan tampilan yang sedang terbuka** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` membuka `FlowPage` (`ChildPageModel`), yang merender halaman alur lengkap secara internal; `ctx.viewer` membuka konten React apa pun.

## Catatan

- Disarankan untuk mengaitkan `uid` dengan `ctx.model.uid` (misalnya, `${ctx.model.uid}-xxx`) untuk menghindari konflik antar beberapa blok.
- Saat `defineProperties` atau `defineMethods` diteruskan, `navigation` akan dipaksa menjadi `false` untuk mencegah hilangnya konteks setelah penyegaran (refresh).
- Di dalam dialog, `ctx.view` merujuk pada instans tampilan saat ini, dan `ctx.view.inputArgs` dapat digunakan untuk membaca parameter yang diteruskan saat pembukaan.

## Terkait

- [ctx.view](./view.md): Instans tampilan yang sedang terbuka.
- [ctx.model](./model.md): Model saat ini, digunakan untuk membangun `popupUid` yang stabil.