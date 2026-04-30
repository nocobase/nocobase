---
pkg: '@nocobase/plugin-workflow-action-trigger'
title: "Event Setelah Action"
description: "Trigger event setelah action: memicu Workflow setelah action dieksekusi, seperti otomatis buat asosiasi setelah simpan, kirim notifikasi, sinkronisasi data."
keywords: "Workflow,event setelah action,Post Action,picu setelah simpan,sinkronisasi data,NocoBase"
---
# Event Setelah Action

## Pengantar

Semua perubahan data yang dihasilkan oleh pengguna dalam sistem biasanya diselesaikan melalui suatu operasi, bentuk konkretnya biasanya adalah klik suatu tombol. Tombol tersebut bisa jadi tombol kirim dalam formulir, atau tombol operasi dalam Block data. Event setelah action digunakan untuk mengikat Workflow terkait pada operasi tombol-tombol ini, untuk mencapai efek memicu alur tertentu setelah operasi pengguna sukses.

Misalnya, saat menambah atau memperbarui data, pengguna dapat melalui konfigurasi opsi "Ikat Workflow" dari tombol, setelah operasi klik selesai, akan memicu Workflow yang diikat.

Pada level implementasi, karena pemrosesan event setelah action berada di lapisan middleware (middleware Koa), oleh karena itu, panggilan API HTTP NocoBase juga dapat memicu event setelah action yang sudah didefinisikan.

## Instalasi

Plugin bawaan, tidak perlu diinstal.

## Konfigurasi Trigger

### Membuat Workflow

Saat membuat Workflow, pilih tipe "Event Setelah Action":

![Buat Workflow_Trigger event setelah action](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Mode Eksekusi

Untuk event setelah action, saat membuat juga dapat memilih mode eksekusi sebagai "Sinkron" atau "Asinkron":

![Buat Workflow_pilih sinkron atau asinkron](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Jika ini adalah alur yang perlu segera dieksekusi dan dikembalikan setelah operasi pengguna, dapat menggunakan mode sinkron, jika tidak default ke mode asinkron. Pada mode asinkron setelah memicu Workflow, operasi tersebut selesai, Workflow akan dieksekusi secara berurutan dengan cara antrian di backend aplikasi.

### Konfigurasi Tabel Data

Masuk ke kanvas Workflow, klik Trigger untuk membuka dialog konfigurasi, pertama Anda perlu memilih tabel data yang akan diikat:

![Konfigurasi Workflow_pilih tabel data](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Pilih Mode Pemicuan

Kemudian pilih mode pemicuan, ada mode lokal dan mode global:

![Konfigurasi Workflow_pilih mode pemicuan](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Di antaranya:

* Mode lokal hanya memicu pada tombol operasi yang diikat Workflow ini, tombol yang tidak diikat Workflow ini tidak akan memicu setelah diklik. Dapat berdasarkan formulir dengan tujuan berbeda, mempertimbangkan apakah memicu alur yang sama, untuk memutuskan apakah mengikat Workflow ini.
* Mode global yaitu pada tombol operasi yang dikonfigurasi pada tabel data semua akan memicu, tanpa membedakan dari formulir mana, juga tidak perlu mengikat Workflow yang sesuai.

Pada mode lokal, tombol operasi yang saat ini didukung untuk diikat adalah:

* Tombol "Kirim" dan "Simpan" pada formulir tambah.
* Tombol "Kirim" dan "Simpan" pada formulir perbarui.
* Tombol "Perbarui Data" pada baris data (table, list, kanban, dll.).

### Pilih Tipe Operasi

Jika memilih mode global, juga perlu memilih tipe operasi, saat ini mendukung "Operasi Buat Data" dan "Operasi Perbarui Data". Kedua operasi memicu Workflow setelah operasi sukses.

### Pilih Pre-load Data Relasi

Jika perlu menggunakan data terkait dari data pemicu pada alur berikutnya, dapat memilih field relasi yang perlu di-preload:

![Konfigurasi Workflow_pre-load relasi](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Setelah dipicu dapat langsung menggunakan data terkait ini dalam alur.

## Konfigurasi Operasi

Untuk operasi mode pemicuan lokal, setelah konfigurasi Workflow selesai, perlu kembali ke antarmuka pengguna, ikat Workflow ini pada tombol operasi formulir Block data yang sesuai.

Workflow yang dikonfigurasi pada tombol "Kirim" (termasuk tombol "Simpan Data") akan dipicu setelah pengguna mengirim formulir yang sesuai dan operasi data selesai.

![Event setelah action_tombol kirim](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Pilih "Ikat Workflow" dari menu konfigurasi tombol, akan membuka dialog konfigurasi pengikatan. Dalam dialog dapat dikonfigurasi sejumlah Workflow yang akan dipicu, jika tidak satupun dikonfigurasi, berarti tidak perlu memicu. Untuk setiap Workflow, perlu terlebih dahulu membatasi data yang dipicu adalah seluruh data formulir atau data field relasi tertentu di formulir, kemudian berdasarkan tabel data sesuai model data yang dipilih, pilih Workflow formulir yang sudah dikonfigurasi cocok dengan model tabel tersebut.

![Event setelah action_konfigurasi ikat Workflow_pilihan konteks](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Event setelah action_konfigurasi ikat Workflow_pilihan Workflow](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Tips"}
Workflow perlu diaktifkan terlebih dahulu, baru dapat dipilih di antarmuka di atas.
:::

## Contoh

Di sini akan didemonstrasikan dengan cara operasi tambah.

Asumsikan skenario "Permohonan Reimburse", kita perlu setelah karyawan mengirim reimburse biaya, melakukan peninjauan otomatis kuota dan peninjauan manual untuk yang melebihi kuota, yang lulus peninjauan baru meloloskan permohonan, dan kemudian diserahkan kepada keuangan untuk diproses.

Pertama, kita dapat membuat sebuah tabel data "Reimburse Biaya" terlebih dahulu, dengan field berikut:

- Nama Proyek: Single Line Text
- Pemohon: Many-to-One (Pengguna)
- Jumlah: Number
- Status: Single Choice ("Lulus Peninjauan", "Selesai Diproses")

Kemudian buat sebuah Workflow tipe "Event Setelah Action" terlebih dahulu, dan konfigurasikan model tabel data dalam Trigger sebagai tabel "Reimburse Biaya":

![Contoh_konfigurasi Trigger_pilih tabel data](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Atur Workflow ke status aktif, Node pemrosesan spesifik dari alur dapat dikonfigurasi nanti.

Kemudian kita buat Block table tabel data "Reimburse Biaya" di antarmuka, dan tambahkan tombol "Tambah" pada bilah alat, konfigurasi field formulir yang sesuai. Dan pada item konfigurasi tombol operasi "Kirim" formulir, buka dialog konfigurasi "Ikat Workflow" tombol, pilih seluruh data formulir sebagai konteks, dan Workflow sebagai Workflow yang sebelumnya kita buat:

![Contoh_konfigurasi tombol formulir_ikat Workflow](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Setelah konfigurasi formulir selesai, kembali lagi ke orkestrasi logika Workflow. Misalnya kita perlu meminta administrator melakukan peninjauan manual saat jumlah lebih dari 500 yuan, jika tidak langsung lolos. Setelah lolos peninjauan baru buat record reimburse, dan diproses lebih lanjut oleh keuangan (diabaikan).

![Contoh_alur pemrosesan](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Mengabaikan pemrosesan keuangan berikutnya, ini menyelesaikan konfigurasi alur permohonan reimburse. Ketika karyawan mengisi permohonan reimburse dan mengirim, akan memicu Workflow yang sesuai. Jika jumlah biaya kurang dari 500, akan otomatis membuat record dan menunggu keuangan untuk pemrosesan lebih lanjut, jika tidak akan ditinjau oleh atasan, setelah lolos peninjauan juga sama membuat record dan diserahkan kepada keuangan untuk diproses.

Alur contoh ini juga dapat dikonfigurasi pada tombol "Kirim" biasa, dapat memutuskan berdasarkan skenario bisnis spesifik apakah perlu membuat record terlebih dahulu sebelum mengeksekusi alur berikutnya.

## Panggilan Eksternal

Pemicuan event setelah action tidak terbatas pada operasi antarmuka pengguna, juga dapat dipicu melalui panggilan API HTTP.

:::info{title="Tips"}
Saat memicu event setelah action melalui panggilan API HTTP, juga perlu memperhatikan status aktivasi Workflow, dan apakah konfigurasi tabel data cocok, jika tidak mungkin tidak akan terpanggil sukses, atau muncul error.
:::

Untuk Workflow yang diikat secara lokal pada tombol operasi, dapat dipanggil seperti ini (contoh tombol buat tabel `posts`):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Di mana parameter URL `triggerWorkflows` adalah key Workflow, beberapa Workflow dipisahkan dengan koma. Key tersebut dapat diperoleh dengan hover mouse di nama Workflow di bagian atas kanvas Workflow:

![Workflow_key_cara melihat](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan di atas sukses, akan memicu event setelah action dari tabel `posts` yang sesuai.

:::info{title="Tips"}
Karena panggilan eksternal juga perlu berbasis identitas pengguna, jadi saat memanggil melalui API HTTP, sama dengan request yang dikirim antarmuka biasa, perlu menyediakan informasi autentikasi, termasuk request header `Authorization` atau parameter `token` (token yang diperoleh saat login), serta request header `X-Role` (nama peran pengguna saat ini).
:::

Jika perlu memicu event data relasi to-one (to-many belum didukung) dalam operasi tersebut, dapat menggunakan `!` dalam parameter untuk menentukan data pemicu field relasi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Setelah panggilan di atas sukses, akan memicu event setelah action dari tabel `categories` yang sesuai.

:::info{title="Tips"}
Jika event dikonfigurasi sebagai mode global, maka tidak perlu menggunakan parameter URL `triggerWorkflows` untuk menentukan Workflow yang sesuai, langsung memanggil operasi tabel data yang sesuai akan memicu.
:::

## FAQ

### Perbedaan dengan Event Sebelum Action

* Event Sebelum Action: dipicu sebelum suatu operasi (seperti tambah, perbarui, dll.) dieksekusi, sebelum operasi dieksekusi, dapat memvalidasi atau memproses data request dalam alur. Jika alur dihentikan (request diintersep), operasi tersebut (tambah, perbarui, dll.) tidak akan dieksekusi.
* Event Setelah Action: dipicu setelah suatu operasi pengguna sukses, saat ini data sudah sukses dikirim dan masuk database, dapat melanjutkan pemrosesan alur terkait berdasarkan hasil sukses.

Seperti yang ditunjukkan pada gambar di bawah:

![Urutan eksekusi operasi](https://static-docs.nocobase.com/20251219234806.png)

### Perbedaan dengan Event Tabel Data

Event setelah action memiliki kesamaan dengan event tabel data, dari segi efek keduanya memicu alur setelah perubahan data, tetapi pada level implementasi masing-masing berbeda. Event setelah action ditujukan untuk level API, sedangkan event tabel data ditujukan untuk perubahan data tabel data.

Event tabel data lebih dekat ke level dasar sistem, dalam beberapa kasus mungkin satu event menyebabkan perubahan data yang memicu event lain, dapat menghasilkan reaksi berantai. Terutama beberapa data tabel data terkait juga berubah dalam operasi tabel saat ini, maka event terkait tabel relasi juga dapat dipicu.

Pemicuan event tabel data tidak mengandung informasi terkait pengguna. Sedangkan event setelah action lebih dekat ke sisi pengguna, merupakan hasil operasi pengguna, konteks alur juga akan mengandung informasi terkait pengguna, cocok untuk memproses alur operasi pengguna. Dalam desain NocoBase ke depan, mungkin akan memperluas lebih banyak event setelah action yang dapat digunakan untuk pemicuan, jadi **lebih disarankan menggunakan event setelah action** untuk memproses alur operasi pengguna yang menyebabkan perubahan data.

Perbedaan lainnya adalah, event setelah action dapat diikat secara lokal pada tombol formulir tertentu. Jika ada beberapa formulir, sebagian formulir saat dikirim dapat memicu event ini, sedangkan yang lain tidak. Sedangkan event tabel data ditujukan untuk perubahan data seluruh tabel data, tidak dapat diikat secara lokal.
