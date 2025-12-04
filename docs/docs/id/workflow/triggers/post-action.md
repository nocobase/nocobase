---
pkg: '@nocobase/plugin-workflow-action-trigger'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Event Pasca-Aksi

## Pendahuluan

Semua perubahan data yang dibuat oleh pengguna dalam sistem biasanya dilakukan melalui sebuah aksi. Bentuknya biasanya berupa klik tombol. Tombol ini bisa jadi tombol kirim di formulir atau tombol aksi di blok data. Event pasca-aksi digunakan untuk mengikat alur kerja terkait ke aksi tombol-tombol ini, sehingga proses tertentu terpicu setelah aksi pengguna berhasil diselesaikan.

Misalnya, saat menambah atau memperbarui data, pengguna dapat mengonfigurasi opsi "Ikat alur kerja" pada tombol. Setelah aksi selesai, alur kerja yang terikat akan terpicu.

Pada tingkat implementasi, karena penanganan event pasca-aksi berada di lapisan middleware (middleware Koa), panggilan HTTP API ke NocoBase juga dapat memicu event pasca-aksi yang telah didefinisikan.

## Instalasi

Ini adalah plugin bawaan, tidak perlu instalasi.

## Konfigurasi Pemicu

### Membuat Alur Kerja

Saat membuat alur kerja, pilih "Event Pasca-Aksi" sebagai jenisnya:

![Create Workflow_Post-Action Event Trigger](https://static-docs.nocobase.com/13c87035ec1bb7332514676d3e896007.png)

### Mode Eksekusi

Untuk event pasca-aksi, Anda juga dapat memilih mode eksekusi "Sinkron" atau "Asinkron" saat membuatnya:

![Create Workflow_Select Synchronous or Asynchronous](https://static-docs.nocobase.com/bc83525c7e539d578f9e2e20baf9ab69.png)

Jika proses perlu dieksekusi dan dikembalikan segera setelah aksi pengguna, Anda dapat menggunakan mode sinkron; jika tidak, defaultnya adalah mode asinkron. Dalam mode asinkron, aksi selesai segera setelah alur kerja terpicu, dan alur kerja akan dieksekusi secara berurutan dalam antrean latar belakang aplikasi.

### Mengonfigurasi Koleksi

Masuk ke kanvas alur kerja, klik pemicu untuk membuka pop-up konfigurasi, dan pertama-tama pilih koleksi yang akan diikat:

![Workflow Configuration_Select Collection](https://static-docs.nocobase.com/35c49a91eba731127edcf76719c97634.png)

### Memilih Mode Pemicu

Kemudian pilih mode pemicu, yang bisa berupa mode lokal atau global:

![Workflow Configuration_Select Trigger Mode](https://static-docs.nocobase.com/317809c48b2f2a2d38aedc7d08abdadc.png)

Di mana:

*   Mode lokal hanya terpicu pada tombol aksi yang telah mengikat alur kerja ini. Mengklik tombol tanpa alur kerja ini tidak akan memicunya. Anda dapat memutuskan apakah akan mengikat alur kerja ini berdasarkan apakah formulir dengan tujuan berbeda harus memicu proses yang sama.
*   Mode global terpicu pada semua tombol aksi yang dikonfigurasi dari koleksi, terlepas dari formulir asalnya, dan tidak perlu mengikat alur kerja yang sesuai.

Dalam mode lokal, tombol aksi yang saat ini mendukung pengikatan adalah sebagai berikut:

*   Tombol "Kirim" dan "Simpan" di formulir tambah.
*   Tombol "Kirim" dan "Simpan" di formulir perbarui.
*   Tombol "Perbarui data" di baris data (tabel, daftar, kanban, dll.).

### Memilih Jenis Aksi

Jika Anda memilih mode global, Anda juga perlu memilih jenis aksi. Saat ini, "Aksi buat data" dan "Aksi perbarui data" didukung. Kedua aksi ini memicu alur kerja setelah aksi berhasil.

### Memilih Data Relasi yang Dimuat Awal

Jika Anda perlu menggunakan data terkait dari data pemicu dalam proses selanjutnya, Anda dapat memilih bidang relasi yang akan dimuat awal:

![Workflow Configuration_Preload Association](https://static-docs.nocobase.com/5cded063509c7ba1d34f49bec8d68227.png)

Setelah terpicu, Anda dapat langsung menggunakan data terkait ini dalam proses.

## Konfigurasi Aksi

Untuk aksi dalam mode pemicu lokal, setelah konfigurasi alur kerja selesai, Anda perlu kembali ke antarmuka pengguna dan mengikat alur kerja ini ke tombol aksi formulir dari blok data yang sesuai.

Alur kerja yang dikonfigurasi untuk tombol "Kirim" (termasuk tombol "Simpan data") akan terpicu setelah pengguna mengirimkan formulir yang sesuai dan aksi data selesai.

![Post-Action Event_Submit Button](https://static-docs.nocobase.com/ae12d219b8400d75b395880ec4cb2bda.png)

Pilih "Ikat alur kerja" dari menu konfigurasi tombol untuk membuka pop-up konfigurasi ikatan. Dalam pop-up, Anda dapat mengonfigurasi sejumlah alur kerja yang akan dipicu. Jika tidak ada yang dikonfigurasi, berarti tidak perlu ada pemicu. Untuk setiap alur kerja, Anda perlu terlebih dahulu menentukan apakah data pemicu adalah data seluruh formulir atau data dari bidang relasi tertentu dalam formulir. Kemudian, berdasarkan koleksi yang sesuai dengan model data yang dipilih, pilih alur kerja formulir yang telah dikonfigurasi untuk mencocokkan model koleksi tersebut.

![Post-Action Event_Bind Workflow Configuration_Context Selection](https://static-docs.nocobase.com/358315fc175849a7fbadbe3276ac6fed.png)

![Post-Action Event_Bind Workflow Configuration_Workflow Selection](https://static-docs.nocobase.com/175a71a61b93540cce62a1cb124eb0b5.png)

:::info{title="Catatan"}
Alur kerja harus diaktifkan sebelum dapat dipilih di antarmuka di atas.
:::

## Contoh

Berikut adalah demonstrasi menggunakan aksi penambahan data.

Misalkan ada skenario "Permohonan Penggantian Biaya". Kita perlu melakukan peninjauan otomatis untuk jumlah dan peninjauan manual untuk jumlah yang melebihi batas setelah karyawan mengajukan permohonan penggantian biaya. Hanya permohonan yang lolos peninjauan yang disetujui, dan kemudian diserahkan kepada departemen keuangan untuk diproses.

Pertama, kita bisa membuat koleksi "Penggantian Biaya" dengan bidang-bidang berikut:

- Nama Proyek: Teks Baris Tunggal
- Pemohon: Banyak-ke-Satu (Pengguna)
- Jumlah: Angka
- Status: Pilihan Tunggal ("Disetujui", "Selesai Diproses")

Kemudian, buat alur kerja bertipe "Event Pasca-Aksi" dan konfigurasikan model koleksi di pemicu menjadi koleksi "Penggantian Biaya":

![Example_Trigger Configuration_Select Collection](https://static-docs.nocobase.com/6e1abb5c3e1198038676115943714f07.png)

Setelah alur kerja diatur ke status aktif, node pemrosesan spesifik dari proses akan dikonfigurasi nanti.

Kemudian, kita membuat blok tabel untuk koleksi "Penggantian Biaya" di antarmuka, dan menambahkan tombol "Tambah" ke bilah alat, mengonfigurasi bidang formulir yang sesuai. Lalu, di opsi konfigurasi tombol aksi "Kirim" formulir, buka dialog konfigurasi "Ikat alur kerja" tombol, pilih seluruh data formulir sebagai konteks, dan pilih alur kerja yang telah kita buat sebelumnya:

![Example_Form Button Configuration_Bind Workflow](https://static-docs.nocobase.com/fc00bdcdb975bb8850e5cab235f854f3.png)

Setelah konfigurasi formulir selesai, kembali ke orkestrasi logika alur kerja. Misalnya, kita memerlukan peninjauan manual oleh administrator jika jumlahnya lebih besar dari 500, jika tidak langsung disetujui. Setelah disetujui, catatan penggantian biaya baru dibuat dan diproses lebih lanjut oleh departemen keuangan (dihilangkan).

![Example_Processing Flow](https://static-docs.nocobase.com/059e8e3d5ffb34cc2da6880fa3dc490b.png)

Mengabaikan pemrosesan keuangan selanjutnya, konfigurasi proses permohonan penggantian biaya kini selesai. Ketika seorang karyawan mengisi dan mengirimkan permohonan penggantian biaya, alur kerja yang sesuai akan terpicu. Jika jumlah biaya kurang dari 500, catatan akan otomatis dibuat dan menunggu pemrosesan lebih lanjut oleh keuangan. Jika tidak, akan ditinjau oleh supervisor, dan setelah disetujui, catatan juga akan dibuat dan diserahkan kepada keuangan untuk diproses.

Proses dalam contoh ini juga dapat dikonfigurasi pada tombol "Kirim" biasa. Anda dapat memutuskan apakah akan membuat catatan terlebih dahulu sebelum menjalankan proses selanjutnya berdasarkan skenario bisnis spesifik.

## Panggilan Eksternal

Pemicuan event pasca-aksi tidak terbatas pada operasi antarmuka pengguna; ini juga dapat dipicu melalui panggilan HTTP API.

:::info{title="Catatan"}
Saat memicu event pasca-aksi melalui panggilan HTTP API, Anda juga perlu memperhatikan status aktif alur kerja dan apakah konfigurasi koleksi cocok, jika tidak, panggilan mungkin tidak berhasil atau terjadi kesalahan.
:::

Untuk alur kerja yang terikat secara lokal pada tombol aksi, Anda dapat memanggilnya seperti ini (menggunakan tombol buat koleksi `posts` sebagai contoh):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Di mana parameter URL `triggerWorkflows` adalah kunci alur kerja, dengan beberapa alur kerja dipisahkan oleh koma. Kunci ini dapat diperoleh dengan mengarahkan kursor mouse ke nama alur kerja di bagian atas kanvas alur kerja:

![Workflow_Key_View Method](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan di atas berhasil, event pasca-aksi dari koleksi `posts` yang sesuai akan terpicu.

:::info{title="Catatan"}
Karena panggilan eksternal juga perlu didasarkan pada identitas pengguna, saat memanggil melalui HTTP API, sama seperti permintaan yang dikirim dari antarmuka normal, informasi autentikasi harus disediakan, termasuk header permintaan `Authorization` atau parameter `token` (token yang diperoleh saat masuk), dan header permintaan `X-Role` (nama peran pengguna saat ini).
:::

Jika Anda perlu memicu event untuk data relasi satu-ke-satu (satu-ke-banyak belum didukung) dalam aksi ini, Anda dapat menggunakan `!` dalam parameter untuk menentukan data pemicu dari bidang relasi:

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

Setelah panggilan di atas berhasil, event pasca-aksi dari koleksi `categories` yang sesuai akan terpicu.

:::info{title="Catatan"}
Jika event dikonfigurasi dalam mode global, Anda tidak perlu menggunakan parameter URL `triggerWorkflows` untuk menentukan alur kerja yang sesuai. Cukup memanggil aksi koleksi yang sesuai akan memicunya.
:::

## Pertanyaan Umum

### Perbedaan dengan Event Pra-Aksi

*   Event Pra-Aksi: Terpicu sebelum suatu aksi (seperti menambah, memperbarui, dll.) dieksekusi. Sebelum aksi dieksekusi, data yang diminta dapat divalidasi atau diproses dalam alur kerja. Jika alur kerja dihentikan (permintaan dicegat), aksi tersebut (menambah, memperbarui, dll.) tidak akan dieksekusi.
*   Event Pasca-Aksi: Terpicu setelah aksi pengguna berhasil. Pada titik ini, data telah berhasil dikirim dan disimpan ke database, dan proses terkait dapat terus diproses berdasarkan hasil yang berhasil.

Seperti yang ditunjukkan pada gambar di bawah ini:

![Action Execution Order](https://static-docs.nocobase.com/7c901be2282067d785205b70391332b7.png)

### Perbedaan dengan Event Koleksi

Event pasca-aksi dan event koleksi memiliki kesamaan, dari segi efek keduanya adalah proses yang terpicu setelah perubahan data. Namun, tingkat implementasinya berbeda. Event pasca-aksi menargetkan tingkat API, sedangkan event koleksi menargetkan perubahan data dalam koleksi.

Event koleksi lebih dekat ke lapisan dasar sistem. Dalam beberapa kasus, perubahan data yang disebabkan oleh satu event dapat memicu event lain, menciptakan reaksi berantai. Terutama ketika data di beberapa koleksi terkait juga berubah selama operasi koleksi saat ini, event yang terkait dengan koleksi terkait juga dapat dipicu.

Pemicuan event koleksi tidak menyertakan informasi terkait pengguna. Sementara itu, event pasca-aksi lebih dekat ke sisi pengguna, merupakan hasil dari aksi pengguna, dan konteks alur kerja juga akan menyertakan informasi terkait pengguna, sehingga cocok untuk menangani proses aksi pengguna. Dalam desain NocoBase di masa mendatang, lebih banyak event pasca-aksi yang dapat digunakan untuk memicu mungkin akan diperluas, jadi **lebih disarankan untuk menggunakan event pasca-aksi** untuk menangani proses di mana perubahan data disebabkan oleh aksi pengguna.

Perbedaan lainnya adalah event pasca-aksi dapat diikat secara lokal pada tombol formulir tertentu. Jika ada beberapa formulir, pengiriman dari sebagian formulir dapat memicu event ini, sementara yang lain tidak. Sedangkan event koleksi adalah untuk perubahan data di seluruh koleksi, dan tidak dapat diikat secara lokal.