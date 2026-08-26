---
title: "ctx.openView()"
description: "ctx.openView() membuka popup, drawer, atau view halaman, mendukung passing parameter, callback, untuk skenario detail, edit, pemilihan."
keywords: "ctx.openView,popup,drawer,view halaman,detail,edit,RunJS,NocoBase"
---

# ctx.openView()

Membuka view tertentu (drawer, popup, halaman embedded, dll.) secara programmatic. Disediakan oleh FlowModelContext, untuk membuka view ChildPage atau PopupAction yang sudah dikonfigurasi pada skenario seperti JSBlock, sel tabel, event flow, dll.

## Skenario Penggunaan

| Skenario | Deskripsi |
|------|------|
| **JSBlock** | Setelah klik tombol membuka popup detail/edit, meneruskan `filterByTk` dari baris saat ini |
| **Sel Tabel** | Render tombol di sel, klik untuk membuka popup detail baris |
| **Event Flow / JSAction** | Membuka view atau popup berikutnya setelah action berhasil |
| **Field Relasi** | Membuka popup pemilihan/edit melalui `ctx.runAction('openView', params)` |

> Perhatian: `ctx.openView` perlu tersedia pada environment RunJS yang memiliki konteks FlowModel; jika model yang sesuai dengan uid tidak ada, akan otomatis membuat PopupActionModel dan mempersistensikannya.

## Signature

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## Penjelasan Parameter

### uid

Identifier unik dari model view. Jika tidak ada akan otomatis dibuat dan disimpan. Disarankan menggunakan UID yang stabil, seperti `${ctx.model.uid}-detail`, agar konfigurasi dapat digunakan kembali saat membuka popup yang sama beberapa kali.

### Field Umum options

| Field | Tipe | Deskripsi |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | Cara membuka: drawer, popup, embed, default `drawer` |
| `size` | `small` / `medium` / `large` | Ukuran popup/drawer, default `medium` |
| `title` | `string` | Judul view |
| `params` | `Record<string, any>` | Parameter sembarang yang dikirim ke view |
| `filterByTk` | `any` | Nilai primary key, untuk skenario detail/edit single record |
| `sourceId` | `string` | ID record sumber, digunakan pada skenario relasi |
| `dataSourceKey` | `string` | Data source |
| `collectionName` | `string` | Nama data table |
| `associationName` | `string` | Nama field relasi |
| `navigation` | `boolean` | Apakah menggunakan navigasi route, akan dipaksa menjadi `false` saat meneruskan `defineProperties` / `defineMethods` |
| `preventClose` | `boolean` | Apakah mencegah penutupan |
| `defineProperties` | `Record<string, PropertyOptions>` | Menyuntikkan properti secara dinamis ke model dalam view |
| `defineMethods` | `Record<string, Function>` | Menyuntikkan method secara dinamis ke model dalam view |

## Contoh

### Penggunaan Dasar: Membuka Drawer

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

Saat model dikonfigurasi dengan action openView (seperti field relasi, field yang dapat diklik), dapat memanggil:

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

## Hubungan dengan ctx.viewer, ctx.view

| Tujuan | Penggunaan yang Direkomendasikan |
|------|----------|
| **Membuka flow view yang sudah dikonfigurasi** | `ctx.openView(uid, options)` |
| **Membuka content kustom (tanpa flow)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **Mengoperasikan view yang sedang terbuka** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView` membuka FlowPage (ChildPageModel), internal akan merender flow page lengkap; `ctx.viewer` membuka konten React sembarang.

## Hal yang Perlu Diperhatikan

- uid disarankan terkait dengan `ctx.model.uid` (seperti `${ctx.model.uid}-xxx`), untuk menghindari konflik antar block
- Saat meneruskan `defineProperties` / `defineMethods`, `navigation` akan dipaksa menjadi `false`, untuk mencegah konteks hilang setelah refresh
- `ctx.view` dalam popup menunjuk ke instance view saat ini, `ctx.view.inputArgs` dapat membaca parameter yang diteruskan saat dibuka

## Terkait

- [ctx.view](./view.md): Instance view yang sedang terbuka
- [ctx.model](./model.md): Model saat ini, untuk membangun popupUid yang stabil
