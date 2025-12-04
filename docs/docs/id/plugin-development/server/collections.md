:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Koleksi

Dalam pengembangan **plugin** NocoBase, **koleksi (tabel data)** adalah salah satu konsep paling inti. Anda dapat menambah atau mengubah struktur tabel data dalam **plugin** dengan mendefinisikan atau memperluas **koleksi**. Berbeda dengan tabel data yang dibuat melalui antarmuka manajemen **sumber data**, **koleksi** yang didefinisikan dalam kode biasanya merupakan tabel metadata tingkat sistem dan tidak akan muncul dalam daftar manajemen **sumber data**.

## Mendefinisikan Tabel Data

Mengikuti struktur direktori konvensional, file **koleksi** harus ditempatkan di direktori `./src/server/collections`. Gunakan `defineCollection()` untuk membuat tabel baru dan `extendCollection()` untuk memperluas tabel yang sudah ada.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Contoh Artikel',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Judul', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Isi' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Penulis' },
    },
  ],
});
```

Dalam contoh di atas:

- `name`: Nama tabel (tabel dengan nama yang sama akan otomatis dibuat di database).
- `title`: Nama tampilan tabel di antarmuka.
- `fields`: Kumpulan bidang, setiap bidang berisi atribut seperti `type`, `name`, dan lainnya.

Ketika Anda perlu menambah bidang atau mengubah konfigurasi untuk **koleksi** **plugin** lain, Anda dapat menggunakan `extendCollection()`:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Setelah mengaktifkan **plugin**, sistem akan otomatis menambahkan bidang `isPublished` ke tabel `articles` yang sudah ada.

:::tip
Direktori konvensional akan selesai dimuat sebelum semua metode `load()` **plugin** dieksekusi, sehingga menghindari masalah ketergantungan yang disebabkan oleh beberapa tabel data yang belum dimuat.
:::

## Sinkronisasi Struktur Database

Saat **plugin** pertama kali diaktifkan, sistem akan otomatis menyinkronkan konfigurasi **koleksi** dengan struktur database. Jika **plugin** sudah terinstal dan berjalan, setelah menambah atau mengubah **koleksi**, Anda perlu menjalankan perintah *upgrade* secara manual:

```bash
yarn nocobase upgrade
```

Jika terjadi pengecualian atau data kotor selama proses sinkronisasi, Anda dapat membangun kembali struktur tabel dengan menginstal ulang aplikasi:

```bash
yarn nocobase install -f
```

## Pembuatan Sumber Daya (Resource) Otomatis

Setelah mendefinisikan **koleksi**, sistem akan otomatis membuat Sumber Daya (Resource) yang sesuai untuknya, di mana Anda dapat langsung melakukan operasi CRUD melalui API. Lihat [Manajer Sumber Daya](./resource-manager.md).