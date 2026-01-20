---
pkg: '@nocobase/plugin-workflow-request-interceptor'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Event Pra-Aksi

## Pendahuluan

Plugin Event Pra-Aksi menyediakan mekanisme interupsi untuk aksi, yang dapat dipicu setelah permintaan untuk aksi pembuatan, pembaruan, atau penghapusan dikirimkan, namun sebelum diproses.

Jika node "Akhiri alur kerja" dieksekusi dalam alur kerja yang dipicu, atau jika node lain gagal dieksekusi (karena kesalahan atau kondisi tidak selesai lainnya), maka aksi formulir tersebut akan diinterupsi. Jika tidak, aksi yang dimaksud akan dieksekusi secara normal.

Dengan menggunakan node "Pesan respons", Anda dapat mengonfigurasi pesan respons yang akan dikembalikan ke klien, memberikan informasi atau petunjuk yang sesuai. Event Pra-Aksi dapat digunakan untuk validasi bisnis atau pemeriksaan logika, baik untuk menyetujui maupun menginterupsi permintaan aksi pembuatan, pembaruan, dan penghapusan yang dikirimkan oleh klien.

## Konfigurasi Pemicu

### Membuat Pemicu

Saat membuat alur kerja, pilih jenis "Event Pra-Aksi":

![Membuat Event Pra-Aksi](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Memilih Koleksi

Dalam pemicu alur kerja interupsi, hal pertama yang perlu dikonfigurasi adalah koleksi yang sesuai dengan aksi:

![Konfigurasi Event Interupsi_Koleksi](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Kemudian pilih mode interupsi. Anda dapat memilih untuk menginterupsi hanya tombol aksi yang terikat pada alur kerja ini, atau menginterupsi semua aksi terpilih untuk koleksi ini (terlepas dari formulir asalnya, dan tanpa perlu mengikat alur kerja yang sesuai):

### Mode Interupsi

![Konfigurasi Event Interupsi_Mode Interupsi](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Jenis aksi yang saat ini didukung adalah "Buat", "Perbarui", dan "Hapus". Beberapa jenis aksi dapat dipilih secara bersamaan.

## Konfigurasi Aksi

Jika mode "Picu interupsi hanya saat formulir yang terikat pada alur kerja ini dikirimkan" dipilih dalam konfigurasi pemicu, Anda juga perlu kembali ke antarmuka formulir dan mengikat alur kerja ini ke tombol aksi yang sesuai:

![Tambah Pesanan_Ikat Alur Kerja](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Dalam konfigurasi ikatan alur kerja, pilih alur kerja yang sesuai. Biasanya, konteks default untuk memicu data, yaitu "Seluruh data formulir", sudah cukup:

![Pilih Alur Kerja yang Akan Diikat](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Catatan}
Tombol yang dapat diikat ke Event Pra-Aksi saat ini hanya mendukung tombol "Kirim" (atau "Simpan"), "Perbarui data", dan "Hapus" dalam formulir pembuatan atau pembaruan. Tombol "Picu alur kerja" tidak didukung (tombol ini hanya dapat diikat ke "Event Pasca-Aksi").
:::

## Kondisi untuk Interupsi

Dalam "Event Pra-Aksi", ada dua kondisi yang akan menyebabkan aksi terkait diinterupsi:

1. Alur kerja dieksekusi hingga node "Akhiri alur kerja" mana pun. Mirip dengan instruksi sebelumnya, ketika data yang memicu alur kerja tidak memenuhi kondisi yang telah ditetapkan dalam node "Kondisi", ia akan masuk ke cabang "Tidak" dan mengeksekusi node "Akhiri alur kerja". Pada titik ini, alur kerja akan berakhir, dan aksi yang diminta akan diinterupsi.
2. Node mana pun dalam alur kerja gagal dieksekusi, termasuk kesalahan eksekusi node, atau situasi anomali lainnya. Dalam kasus ini, alur kerja akan berakhir dengan status yang sesuai, dan aksi yang diminta juga akan diinterupsi. Misalnya, jika alur kerja memanggil data eksternal melalui "Permintaan HTTP" dan permintaan tersebut gagal, alur kerja akan berakhir dengan status gagal sekaligus menginterupsi permintaan aksi yang sesuai.

Setelah kondisi interupsi terpenuhi, aksi terkait tidak akan lagi dieksekusi. Misalnya, jika pengiriman pesanan diinterupsi, data pesanan yang sesuai tidak akan dibuat.

## Parameter Terkait untuk Aksi yang Sesuai

Dalam alur kerja jenis "Event Pra-Aksi", data yang berbeda dari pemicu dapat digunakan sebagai variabel dalam alur kerja untuk aksi yang berbeda:

| Jenis Aksi \ Variabel | "Operator" | "Pengidentifikasi peran operator" | Parameter Aksi: "ID" | Parameter Aksi: "Objek data yang dikirimkan" |
| ---------------------- | ---------- | -------------------------- | ---------------------- | ----------------------------------------- |
| Membuat satu catatan | ✓ | ✓ | - | ✓ |
| Memperbarui satu catatan | ✓ | ✓ | ✓ | ✓ |
| Menghapus satu atau beberapa catatan | ✓ | ✓ | ✓ | - |

:::info{title=Catatan}
Variabel "Data pemicu / Parameter aksi / Objek data yang dikirimkan" dalam Event Pra-Aksi bukanlah data aktual dari basis data, melainkan hanya parameter terkait yang dikirimkan bersama aksi. Jika Anda memerlukan data aktual dari basis data, Anda harus mengkuerinya menggunakan node "Kueri data" di dalam alur kerja.

Selain itu, untuk aksi penghapusan, "ID" dalam parameter aksi adalah nilai tunggal saat menargetkan satu catatan, tetapi merupakan array saat menargetkan beberapa catatan.
:::

## Mengeluarkan Pesan Respons

Setelah mengonfigurasi pemicu, Anda dapat menyesuaikan logika penilaian yang relevan dalam alur kerja. Biasanya, Anda akan menggunakan mode cabang dari node "Kondisi" untuk memutuskan apakah akan "Akhiri alur kerja" dan mengembalikan "Pesan respons" yang telah ditetapkan berdasarkan hasil kondisi bisnis tertentu:

![Konfigurasi Alur Kerja Interupsi](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Pada titik ini, konfigurasi alur kerja yang sesuai telah selesai. Anda sekarang dapat mencoba mengirimkan data yang tidak memenuhi kondisi yang dikonfigurasi dalam node kondisi alur kerja untuk memicu logika interupsi. Anda kemudian akan melihat pesan respons yang dikembalikan:

![Pesan Respons Kesalahan](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Status Pesan Respons

Jika node "Akhiri alur kerja" dikonfigurasi untuk keluar dengan status "Berhasil", permintaan aksi akan tetap diinterupsi saat node ini dieksekusi, tetapi pesan respons yang dikembalikan akan ditampilkan dengan status "Berhasil" (bukan "Kesalahan"):

![Pesan Respons Status Berhasil](https://static-docs.nocobase.com/9559bbf5607144759451294b18c790e.png)

## Contoh

Menggabungkan instruksi dasar di atas, mari kita ambil skenario "Pengiriman Pesanan" sebagai contoh. Misalkan kita perlu memeriksa stok semua produk yang dipilih oleh pengguna saat mereka mengirimkan pesanan. Jika stok salah satu produk yang dipilih tidak mencukupi, pengiriman pesanan akan diinterupsi, dan pesan pemberitahuan yang sesuai akan dikembalikan. Alur kerja akan berulang dan memeriksa setiap produk hingga stok semua produk mencukupi, pada titik tersebut akan dilanjutkan dan membuat data pesanan untuk pengguna.

Langkah-langkah lainnya sama dengan yang dijelaskan dalam instruksi. Namun, karena satu pesanan melibatkan beberapa produk, selain menambahkan hubungan banyak-ke-banyak "Pesanan" <-- M:1 -- "Detail Pesanan" -- 1:M --> "Produk" dalam pemodelan data, Anda juga perlu menambahkan node "Perulangan" dalam alur kerja "Event Pra-Aksi" untuk memeriksa secara iteratif apakah stok setiap produk mencukupi:

![Contoh_Alur Kerja Pemeriksaan Perulangan](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Objek untuk perulangan dipilih sebagai array "Detail Pesanan" dari data pesanan yang dikirimkan:

![Contoh_Konfigurasi Objek Perulangan](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Node kondisi dalam alur perulangan digunakan untuk menentukan apakah stok objek produk saat ini dalam perulangan mencukupi:

![Contoh_Kondisi dalam Perulangan](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Konfigurasi lainnya sama dengan penggunaan dasar. Saat pesanan akhirnya dikirimkan, jika ada produk yang stoknya tidak mencukupi, pengiriman pesanan akan diinterupsi, dan pesan pemberitahuan yang sesuai akan dikembalikan. Saat pengujian, coba kirimkan pesanan dengan beberapa produk, di mana satu produk memiliki stok tidak mencukupi dan produk lain memiliki stok mencukupi. Anda dapat melihat pesan respons yang dikembalikan:

![Contoh_Pesan Respons setelah Pengiriman](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Seperti yang Anda lihat, pesan respons tidak menunjukkan bahwa produk pertama "iPhone 15 pro" kehabisan stok, melainkan hanya produk kedua "iPhone 14 pro" yang kehabisan stok. Ini karena dalam perulangan, produk pertama memiliki stok yang cukup, sehingga tidak diinterupsi, sedangkan produk kedua memiliki stok yang tidak mencukupi, yang menginterupsi pengiriman pesanan.

## Pemanggilan Eksternal

Event Pra-Aksi sendiri disuntikkan selama fase pemrosesan permintaan, sehingga juga mendukung pemicuan melalui panggilan HTTP API.

Untuk alur kerja yang terikat secara lokal pada tombol aksi, Anda dapat memanggilnya seperti ini (menggunakan tombol buat dari koleksi `posts` sebagai contoh):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Parameter URL `triggerWorkflows` adalah kunci dari alur kerja; beberapa kunci alur kerja dipisahkan oleh koma. Kunci ini dapat diperoleh dengan mengarahkan kursor mouse ke nama alur kerja di bagian atas kanvas alur kerja:

![Alur Kerja_Kunci_Cara Melihat](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan di atas dilakukan, Event Pra-Aksi untuk koleksi `posts` yang sesuai akan dipicu. Setelah alur kerja yang sesuai diproses secara sinkron, data akan dibuat dan dikembalikan secara normal.

Jika alur kerja yang dikonfigurasi mencapai "node Akhir", logikanya sama dengan aksi antarmuka: permintaan akan diinterupsi, dan tidak ada data yang akan dibuat. Jika status node akhir dikonfigurasi sebagai gagal, kode status respons yang dikembalikan adalah `400`; jika berhasil, `200`.

Jika node "Pesan respons" juga dikonfigurasi sebelum node akhir, pesan yang dihasilkan juga akan dikembalikan dalam hasil respons. Struktur untuk kesalahan adalah:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Struktur pesan ketika "node Akhir" dikonfigurasi untuk berhasil adalah:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Catatan}
Karena beberapa node "Pesan respons" dapat ditambahkan dalam alur kerja, struktur data pesan yang dikembalikan adalah array.
:::

Jika Event Pra-Aksi dikonfigurasi dalam mode global, Anda tidak perlu menggunakan parameter URL `triggerWorkflows` untuk menentukan alur kerja yang sesuai saat memanggil HTTP API. Cukup memanggil aksi koleksi yang sesuai akan memicunya.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Catatan"}
Saat memicu event pra-aksi melalui panggilan HTTP API, Anda juga perlu memperhatikan status aktif alur kerja dan apakah konfigurasi koleksi cocok, jika tidak, panggilan mungkin tidak berhasil atau dapat menyebabkan kesalahan.
:::