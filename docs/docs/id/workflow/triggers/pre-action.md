---
pkg: '@nocobase/plugin-workflow-request-interceptor'
title: "Event Sebelum Action"
description: "Trigger event sebelum action: memicu Workflow sebelum action dieksekusi, seperti validasi sebelum kirim, pemrosesan sebelum operasi batch, dapat memblokir atau memodifikasi action."
keywords: "Workflow,event sebelum action,Pre Action,validasi sebelum kirim,intersepsi request,NocoBase"
---
# Event Sebelum Action

## Pengantar

Plugin event sebelum action menyediakan mekanisme intersepsi terhadap action, dapat dipicu setelah request operasi tambah, perbarui, dan hapus dikirim, sebelum diproses.

Jika dalam alur setelah pemicuan ada Node "Akhir Alur" yang dieksekusi, atau Node lainnya gagal dieksekusi (error atau kondisi lain yang tidak dapat menyelesaikan eksekusi), maka operasi formulir tersebut akan diintersep, jika tidak operasi yang dijadwalkan akan dieksekusi secara normal.

Kombinasi dengan Node "Response Message" dapat mengonfigurasi pesan respons yang dikembalikan ke client untuk alur ini, untuk memberikan informasi tip yang sesuai kepada client. Event sebelum action dapat digunakan untuk melakukan validasi bisnis atau pemeriksaan logika, untuk meloloskan atau mengintersep request operasi seperti pembuatan, pembaruan, dan penghapusan yang dikirim oleh client.

## Konfigurasi Trigger

### Membuat Trigger

Saat membuat Workflow, pilih tipe "Event Sebelum Action":

![Buat event sebelum action](https://static-docs.nocobase.com/2add03f2bdb0a836baae5fe9864fc4b6.png)

### Pilih Tabel Data

Trigger Workflow intersepsi pertama-tama yang perlu dikonfigurasi adalah tabel data yang sesuai dengan operasi:

![Konfigurasi event intersepsi_tabel data](https://static-docs.nocobase.com/8f7122caca8159d334cf776f838d53d6.png)

Kemudian pilih mode intersepsi, Anda dapat memilih hanya untuk tombol operasi yang terikat dengan Workflow ini, atau juga dapat memilih untuk mengintersep semua operasi yang dipilih untuk tabel data tersebut (tanpa membedakan dari formulir mana, juga tidak perlu mengikat Workflow yang sesuai):

### Mode Intersepsi

![Konfigurasi event intersepsi_mode intersepsi](https://static-docs.nocobase.com/145a7f7c3ba440bb6ca93a5ee84f16e2.png)

Tipe operasi yang saat ini didukung adalah "Buat", "Perbarui", dan "Hapus", dapat memilih beberapa tipe operasi sekaligus.

## Konfigurasi Operasi

Jika konfigurasi Trigger memilih mode "Hanya picu intersepsi saat formulir terikat Workflow ini dikirim", Anda juga perlu kembali ke antarmuka formulir, dan mengikat Workflow ini pada tombol operasi yang sesuai:

![Tambah pesanan_ikat Workflow](https://static-docs.nocobase.com/bae3931e60f9bcc51bbc222e40e891e5.png)

Pada konfigurasi pengikatan Workflow, pilih Workflow yang sesuai. Biasanya konteks data pemicu cukup pilih default "Seluruh Data Formulir":

![Pilih Workflow yang akan diikat](https://static-docs.nocobase.com/78e2f023029bd570c91ee4cd19b7a0a7.png)

:::info{title=Tips}
Tombol yang akan diikat dengan event sebelum action saat ini hanya mendukung penggunaan tombol "Kirim" (atau "Simpan"), "Perbarui Data", dan "Hapus" dalam formulir tambah atau perbarui, tidak mendukung penggunaan tombol "Picu Workflow" (tombol tersebut hanya dapat diikat dengan "Event Setelah Action").
:::

## Kondisi yang Memenuhi Intersepsi

Pada "Event Sebelum Action" ada dua kondisi yang akan menyebabkan operasi yang sesuai diintersep:

1. Alur dieksekusi sampai Node "Akhir Alur" mana pun, mirip dengan instruksi penggunaan sebelumnya, ketika data yang memicu alur tidak memenuhi kondisi yang ditentukan dalam Node "Penilaian Kondisi", akan masuk ke cabang "Tidak" dan mengeksekusi Node "Akhir Alur". Saat ini alur akan berakhir, dan operasi yang diminta akan diintersep.
2. Node mana pun dalam alur gagal dieksekusi, termasuk Node yang error saat dieksekusi, atau kondisi abnormal lainnya. Saat ini alur akan berakhir dengan status yang sesuai, dan operasi yang diminta juga akan diintersep. Misalnya jika ada panggilan data eksternal melalui "HTTP Request" dalam alur, jika request gagal, alur ini berakhir dengan status gagal sambil juga mengintersep request operasi yang sesuai.

Setelah kondisi intersepsi terpenuhi, operasi yang sesuai tidak akan dieksekusi lagi, misalnya setelah pengiriman pesanan diintersep, data pesanan yang sesuai tidak akan dihasilkan.

## Parameter Terkait Operasi yang Sesuai

Pada Workflow tipe "Event Sebelum Action", untuk operasi yang berbeda, Trigger memiliki data berbeda yang dapat digunakan sebagai variabel dalam alur:

| Tipe Operasi \\ Variabel       | "Operator" | "Identifier Peran Operator" | Parameter Operasi: "ID" | Parameter Operasi: "Objek Data yang Dikirim" |
| ------------------------------ | ---------- | --------------------------- | ----------------------- | -------------------------------------------- |
| Buat satu record               | ✓          | ✓                           | -                       | ✓                                            |
| Perbarui satu record           | ✓          | ✓                           | ✓                       | ✓                                            |
| Hapus satu atau beberapa record | ✓         | ✓                           | ✓                       | -                                            |

:::info{title=Tips}
Variabel "Data Trigger / Parameter Operasi / Objek Data yang Dikirim" dari event sebelum action bukan data aktual di database, hanya parameter terkait yang dikirim operasi. Jika perlu data aktual di database, perlu mengkuerikan data terkait melalui Node "Kueri Data" dalam alur.

Selain itu untuk operasi hapus, saat untuk single record, "ID" dalam parameter operasi adalah nilai sederhana, sedangkan saat untuk multiple records, "ID" dalam parameter operasi adalah array.
:::

## Output Pesan Respons

Setelah Trigger dikonfigurasi, Anda dapat menyesuaikan logika penilaian terkait dalam Workflow. Biasanya akan menggunakan mode cabang dari Node "Penilaian Kondisi", berdasarkan hasil penilaian kondisi bisnis spesifik, pilih apakah "Akhir Alur", dan kembalikan "Pesan Respons" yang ditentukan:

![Konfigurasi alur intersepsi](https://static-docs.nocobase.com/cfddda5d8012fd3d0ca09f04ea610539.png)

Sampai di sini konfigurasi Workflow yang sesuai sudah selesai, dan Anda dapat mencoba mengirimkan data yang tidak memenuhi konfigurasi penilaian kondisi dalam alur, untuk memicu logika intersepsi interceptor. Saat ini Anda dapat melihat pesan respons yang dikembalikan:

![Pesan respons error](https://static-docs.nocobase.com/06bd4a6b6ec499c853f0c39987f63a6a.png)

### Status Pesan Respons

Jika dalam Node "Akhir Alur" dikonfigurasi keluar dengan status "Sukses", dan dieksekusi sampai Node "Akhir Alur" tersebut, request operasi tersebut tetap akan diintersep, tetapi pesan respons yang dikembalikan akan ditampilkan dengan status "Sukses" (bukan "Error"):

![Pesan respons status sukses](https://static-docs.nocobase.com/9559bbf56067144759451294b18c790e.png)

## Contoh

Menggabungkan instruksi penggunaan dasar di atas, mari ambil contoh skenario "Pengiriman Pesanan", asumsikan kita perlu memvalidasi stok semua produk yang dipilih pengguna saat pengguna mengirim pesanan. Jika stok salah satu produk yang dipilih tidak mencukupi, intersep pengiriman pesanan dan kembalikan informasi tip yang sesuai; loop pemeriksaan setiap produk sampai stok semua produk mencukupi, baru lulus, hasilkan data pesanan untuk pengguna.

Langkah lainnya sama dengan dalam instruksi, tetapi karena satu pesanan ditujukan untuk beberapa produk, selain menambahkan relasi many-to-many "Pesanan" <-- m:1 -- "Detail Pesanan" -- 1:m --> "Produk" saat pemodelan data, perlu juga menambahkan Node "Loop" dalam Workflow "Event Sebelum Action", untuk loop memeriksa apakah stok setiap produk mencukupi:

![Contoh_alur deteksi loop](https://static-docs.nocobase.com/8307de47d5629595ab6cf00f8aa898e3.png)

Objek loop pilih array "Detail Pesanan" dalam data pesanan yang dikirim:

![Contoh_konfigurasi objek loop](https://static-docs.nocobase.com/ed662b54cc1f5425e2b472053f89baba.png)

Node penilaian kondisi dalam alur loop digunakan untuk menilai apakah stok objek produk loop saat ini mencukupi:

![Contoh_penilaian kondisi dalam loop](https://static-docs.nocobase.com/4af91112934b0a04a4ce55e657c0833b.png)

Konfigurasi lainnya sama dengan konfigurasi dalam penggunaan dasar, akhirnya saat mengirim pesanan, jika stok salah satu produk tidak mencukupi, akan mengintersep pengiriman pesanan dan mengembalikan informasi tip yang sesuai. Saat menguji juga coba kirim beberapa produk dalam satu pesanan, salah satu produk stoknya tidak mencukupi, produk lainnya stoknya mencukupi, Anda dapat melihat pesan respons yang dikembalikan:

![Contoh_pesan respons setelah pengiriman](https://static-docs.nocobase.com/dd9e81084aa237bda0241d399ac19270.png)

Anda dapat melihat, pesan respons tidak menunjukkan stok produk pertama "iPhone 15 pro" tidak mencukupi, hanya menunjukkan stok produk kedua "iPhone 14 pro" tidak mencukupi. Ini karena dalam loop, produk pertama stoknya mencukupi sehingga tidak diintersep, sedangkan produk kedua stoknya tidak mencukupi, sehingga pengiriman pesanan diintersep.

## Panggilan Eksternal

Event sebelum action sendiri diinjeksikan dalam tahap pemrosesan request, sehingga juga mendukung pemicuan melalui panggilan API HTTP.

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

Setelah panggilan di atas dikirim, akan memicu event sebelum action dari tabel `posts` yang sesuai. Setelah pemrosesan sinkron Workflow yang sesuai selesai, data dibuat secara normal dan dikembalikan.

Jika dalam Workflow yang dikonfigurasi mencapai "Node Akhir", maka sama dengan logika operasi antarmuka, request akan diintersep, data tidak akan dibuat. Ketika status dalam Node Akhir dikonfigurasi sebagai gagal, status code respons yang dikembalikan adalah `400`, saat sukses adalah `200`.

Jika di depan Node Akhir juga dikonfigurasi Node "Response Message", pesan yang dihasilkan juga akan dikembalikan dalam hasil respons, struktur saat error adalah:

```json
{
  "errors": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

Struktur pesan saat "Node Akhir" dikonfigurasi sebagai sukses adalah:

```json
{
  "messages": [
    {
      "message": "message from 'Response message' node"
    }
  ]
}
```

:::info{title=Tips}
Karena Node "Response Message" dapat ditambahkan beberapa dalam alur, struktur data pesan yang dikembalikan adalah array.
:::

Jika event sebelum action dikonfigurasi sebagai mode global, maka saat memanggil API HTTP, tidak perlu menggunakan parameter URL `triggerWorkflows` untuk menentukan Workflow yang sesuai, langsung memanggil operasi tabel data yang sesuai akan memicu.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create"
```

:::info{title="Tips"}
Saat memicu event setelah action melalui panggilan API HTTP, juga perlu memperhatikan status aktivasi Workflow, dan apakah konfigurasi tabel data cocok, jika tidak mungkin tidak akan terpanggil sukses, atau muncul error.
:::
