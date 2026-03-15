---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/workflow/triggers/custom-action).
:::

# Peristiwa Aksi Kustom

## Pengantar

NocoBase memiliki operasi data bawaan yang umum (tambah, hapus, ubah, kueri, dll.). Ketika operasi ini tidak dapat memenuhi kebutuhan bisnis yang kompleks, Anda dapat menggunakan peristiwa aksi kustom dalam alur kerja dan mengikat peristiwa tersebut ke tombol "Picu Alur Kerja" pada blok halaman. Setelah pengguna mengkliknya, alur kerja aksi kustom akan dipicu.

## Membuat Alur Kerja

Saat membuat alur kerja, pilih "Peristiwa Aksi Kustom":

![Membuat alur kerja "Peristiwa Aksi Kustom"](https://static-docs.nocobase.com/20240509091820.png)

## Konfigurasi Pemicu

### Tipe Konteks

> v.1.6.0+

Perbedaan tipe konteks akan menentukan pada tombol blok mana alur kerja tersebut dapat diikat:

* Tanpa konteks: Merupakan peristiwa global, dapat diikat pada panel operasi atau tombol operasi di blok data;
* Satu baris data: Dapat diikat pada tombol operasi di baris data tabel, formulir, detail, dan blok data lainnya;
* Beberapa baris data: Dapat diikat pada tombol operasi massal di tabel.

![Konfigurasi pemicu_Tipe konteks](https://static-docs.nocobase.com/20250215135808.png)

### Tabel Data

Ketika tipe konteks adalah satu baris data atau beberapa baris data, Anda perlu memilih koleksi tabel data yang akan diikat dengan model data:

![Konfigurasi pemicu_Pilih tabel data](https://static-docs.nocobase.com/20250215135919.png)

### Data Hubungan yang Akan Digunakan

Jika Anda perlu menggunakan data hubungan dari baris data pemicu dalam alur kerja, Anda dapat memilih bidang hubungan yang lebih dalam di sini:

![Konfigurasi pemicu_Pilih data hubungan yang akan digunakan](https://static-docs.nocobase.com/20250215135955.png)

Bidang-bidang ini akan secara otomatis dimuat sebelumnya ke dalam konteks alur kerja setelah peristiwa dipicu, sehingga dapat digunakan dalam alur kerja.

## Konfigurasi Operasi

Berdasarkan tipe konteks yang dikonfigurasi dalam alur kerja, konfigurasi tombol operasi pada blok yang berbeda juga memiliki perbedaan.

### Tanpa Konteks

> v1.6.0+

Pada panel operasi dan blok data lainnya, tombol "Picu Alur Kerja" dapat ditambahkan:

![Blok menambahkan tombol operasi_Panel operasi](https://static-docs.nocobase.com/20250215221738.png)

![Blok menambahkan tombol operasi_Kalender](https://static-docs.nocobase.com/20250215221942.png)

![Blok menambahkan tombol operasi_Gantt](https://static-docs.nocobase.com/20250215221810.png)

Setelah menambahkan tombol, ikat alur kerja tanpa konteks yang telah dibuat sebelumnya, mengambil contoh tombol pada panel operasi:

![Tombol mengikat alur kerja_Panel operasi](https://static-docs.nocobase.com/20250215222120.png)

![Pilih alur kerja yang akan diikat_Tanpa konteks](https://static-docs.nocobase.com/20250215222234.png)

### Satu Baris Data

Dalam blok data apa pun, tombol "Picu Alur Kerja" dapat ditambahkan pada kolom operasi untuk satu baris data, seperti formulir, baris data tabel, detail, dll.:

![Blok menambahkan tombol operasi_Formulir](https://static-docs.nocobase.com/20240509165428.png)

![Blok menambahkan tombol operasi_Baris tabel](https://static-docs.nocobase.com/20240509165340.png)

![Blok menambahkan tombol operasi_Detail](https://static-docs.nocobase.com/20240509165545.png)

Setelah menambahkan tombol, ikat alur kerja yang telah dibuat sebelumnya:

![Tombol mengikat alur kerja](https://static-docs.nocobase.com/20240509165631.png)

![Pilih alur kerja yang akan diikat](https://static-docs.nocobase.com/20240509165658.png)

Setelah itu, klik tombol ini untuk memicu peristiwa aksi kustom tersebut:

![Hasil pemicuan klik tombol](https://static-docs.nocobase.com/20240509170453.png)

### Beberapa Baris Data

> v1.6.0+

Dalam bilah operasi blok tabel, saat menambahkan tombol "Picu Alur Kerja", akan ada opsi tambahan untuk memilih tipe konteks antara "Tanpa konteks" atau "Beberapa baris data":

![Blok menambahkan tombol operasi_Tabel](https://static-docs.nocobase.com/20250215222507.png)

Ketika memilih "Tanpa konteks", itu adalah peristiwa global dan hanya dapat mengikat alur kerja tipe tanpa konteks.

Ketika memilih "Beberapa baris data", Anda dapat mengikat alur kerja tipe beberapa baris data, yang dapat digunakan untuk operasi massal setelah memilih beberapa data (saat ini hanya didukung oleh tabel). Pada saat ini, cakupan alur kerja yang dapat dipilih hanya alur kerja yang dikonfigurasi cocok dengan koleksi tabel data blok data saat ini:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Saat mengklik tombol untuk memicu, beberapa baris data dalam tabel harus sudah dicentang, jika tidak, alur kerja tidak akan dipicu:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Contoh

Sebagai contoh, kita memiliki koleksi tabel data "Sampel". Untuk sampel yang "Telah Dikumpulkan" (status), perlu disediakan operasi "Kirim untuk Inspeksi". Pengiriman akan memeriksa informasi dasar sampel terlebih dahulu, kemudian menghasilkan data "Catatan Inspeksi", lalu mengubah status sampel menjadi "Telah Dikirim". Serangkaian proses ini tidak dapat diselesaikan melalui klik tombol "tambah, hapus, ubah, kueri" sederhana, sehingga peristiwa aksi kustom dapat digunakan untuk mencapainya.

Pertama, buat koleksi tabel data "Sampel" dan koleksi tabel data "Catatan Inspeksi", lalu masukkan data pengujian dasar untuk tabel sampel:

![Contoh_Tabel data sampel](https://static-docs.nocobase.com/20240509172234.png)

Kemudian buat alur kerja "Peristiwa Aksi Kustom". Jika proses operasi memerlukan umpan balik yang tepat waktu, Anda dapat memilih mode sinkron (dalam mode sinkron, node tipe asinkron seperti pemrosesan manual tidak dapat digunakan):

![Contoh_Membuat alur kerja](https://static-docs.nocobase.com/20240509173106.png)

Dalam konfigurasi pemicu, pilih "Sampel" untuk tabel data:

![Contoh_Konfigurasi pemicu](https://static-docs.nocobase.com/20240509173148.png)

Susun logika dalam alur kerja sesuai kebutuhan bisnis, misalnya pengiriman hanya diizinkan jika parameter indikator lebih besar dari `90`, jika tidak, berikan pesan masalah terkait:

![Contoh_Penyusunan logika bisnis](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Petunjuk}
Node "[Pesan Respons](../nodes/response-message.md)" dapat digunakan dalam peristiwa aksi kustom sinkron untuk mengembalikan informasi petunjuk ke klien. Tidak dapat digunakan dalam mode asinkron.
:::

Setelah alur kerja dikonfigurasi dan diaktifkan, kembali ke antarmuka tabel, tambahkan tombol "Picu Alur Kerja" pada kolom operasi tabel:

![Contoh_Menambahkan tombol operasi](https://static-docs.nocobase.com/20240509174525.png)

Kemudian pilih untuk mengikat alur kerja pada menu konfigurasi tombol untuk membuka jendela konfigurasi:

![Contoh_Membuka jendela ikat alur kerja](https://static-docs.nocobase.com/20240509174633.png)

Tambahkan alur kerja yang telah diaktifkan sebelumnya:

![Contoh_Memilih alur kerja](https://static-docs.nocobase.com/20240509174723.png)

Setelah dikirim, ubah teks tombol menjadi nama operasi, seperti kata "Kirim untuk Inspeksi", dan proses konfigurasi selesai.

Saat digunakan, pilih salah satu data sampel dalam tabel dan klik tombol "Kirim untuk Inspeksi" untuk memicu peristiwa aksi kustom. Seperti logika yang disusun sebelumnya, jika parameter indikator sampel kurang dari 90, petunjuk berikut akan muncul setelah diklik:

![Contoh_Indikator tidak memenuhi syarat pengiriman](https://static-docs.nocobase.com/20240509175026.png)

Jika parameter indikator lebih besar dari 90, alur kerja akan berjalan normal, menghasilkan data "Catatan Inspeksi", dan mengubah status sampel menjadi "Telah Dikirim":

![Contoh_Pengiriman berhasil](https://static-docs.nocobase.com/20240509175247.png)

Sampai di sini, sebuah peristiwa aksi kustom sederhana telah selesai. Demikian pula, untuk bisnis dengan operasi kompleks serupa seperti pemrosesan pesanan, pengiriman laporan, dll., semuanya dapat dicapai melalui peristiwa aksi kustom.

## Panggilan Eksternal

Pemicuan peristiwa aksi kustom tidak terbatas pada operasi antarmuka pengguna, tetapi juga dapat dipicu melalui panggilan HTTP API. Secara khusus, peristiwa aksi kustom menyediakan tipe operasi baru untuk semua operasi tabel data guna memicu alur kerja: `trigger`, yang dapat dipanggil dengan mengikuti API operasi standar NocoBase.

:::info{title="Petunjuk"}
Karena panggilan eksternal juga perlu didasarkan pada identitas pengguna, saat memanggil melalui HTTP API, permintaan harus konsisten dengan permintaan yang dikirim dari antarmuka biasa, yaitu perlu menyediakan informasi autentikasi, termasuk header permintaan `Authorization` atau parameter `token` (token yang diperoleh saat login), serta header permintaan `X-Role` (nama peran pengguna saat ini).
:::

### Tanpa Konteks

Alur kerja tanpa konteks perlu melakukan operasi pemicuan terhadap sumber daya workflows:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Satu Baris Data

Serupa dengan alur kerja yang dipicu oleh tombol dalam contoh, dapat dipanggil seperti ini:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Karena operasi ini ditujukan untuk satu baris data, saat memanggil data yang sudah ada, Anda perlu menentukan ID baris data untuk mengganti bagian `<:id>` dalam URL.

Jika dipanggil untuk formulir (seperti penambahan atau pembaruan), untuk formulir penambahan data baru, ID tidak perlu dikirimkan, tetapi data yang dikirimkan perlu disertakan sebagai konteks data eksekusi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Untuk formulir pembaruan, ID baris data serta data yang diperbarui perlu dikirimkan secara bersamaan:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Jika ID dan data dikirimkan secara bersamaan, baris data yang sesuai dengan ID akan dimuat terlebih dahulu, kemudian atribut dalam objek data yang dikirimkan akan digunakan untuk menimpa baris data asli guna mendapatkan konteks data pemicu akhir.

:::warning{title="Perhatian"}
Jika data hubungan dikirimkan, data tersebut juga akan ditimpa, terutama saat dikonfigurasi untuk menggunakan pramuat item data hubungan, penanganan data yang dikirimkan harus dilakukan dengan hati-hati agar data hubungan tidak ditimpa secara tidak sengaja.
:::

Selain itu, parameter URL `triggerWorkflows` adalah kunci (key) alur kerja, beberapa alur kerja dipisahkan dengan koma. Kunci tersebut dapat diperoleh dengan mengarahkan kursor ke nama alur kerja di bagian atas kanvas alur kerja:

![Cara melihat kunci alur kerja](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan di atas berhasil, peristiwa aksi kustom untuk tabel `samples` yang sesuai akan dipicu.

:::info{title="Petunjuk"}
Saat memicu peristiwa setelah operasi melalui panggilan HTTP API, perhatikan juga status aktif alur kerja serta apakah konfigurasi tabel data cocok, jika tidak, panggilan mungkin tidak berhasil atau terjadi kesalahan.
:::

### Beberapa Baris Data

Serupa dengan cara pemanggilan satu baris data, tetapi data yang dikirimkan hanya memerlukan beberapa parameter kunci utama (`filterByTk[]`), dan tidak perlu mengirimkan bagian data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Panggilan ini akan memicu peristiwa aksi kustom mode beberapa baris data, dan menggunakan data dengan id 1 dan 2 sebagai data dalam konteks pemicu.