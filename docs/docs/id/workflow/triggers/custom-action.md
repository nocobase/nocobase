---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Peristiwa Aksi Kustom

## Pendahuluan

NocoBase memiliki aksi data umum bawaan (tambah, hapus, perbarui, lihat, dll.). Ketika aksi-aksi ini tidak dapat memenuhi kebutuhan bisnis yang kompleks, Anda dapat menggunakan peristiwa aksi kustom dalam sebuah alur kerja. Dengan mengikat peristiwa ini ke tombol "Picu Alur Kerja" di blok halaman, sebuah alur kerja aksi kustom akan terpicu saat pengguna mengkliknya.

## Membuat Alur Kerja

Saat membuat alur kerja, pilih "Peristiwa Aksi Kustom":

![Membuat alur kerja "Peristiwa Aksi Kustom"](https://static-docs.nocobase.com/20240509091820.png)

## Konfigurasi Pemicu

### Tipe Konteks

> v.1.6.0+

Tipe konteks yang berbeda akan menentukan tombol-tombol blok mana yang dapat diikatkan ke alur kerja ini:

*   Tanpa Konteks: Sebuah peristiwa global yang dapat diikatkan ke tombol aksi di Bilah Aksi dan blok data.
*   Satu Baris Data: Dapat diikatkan ke tombol aksi di blok data seperti baris tabel, formulir, dan detail.
*   Beberapa Baris Data: Dapat diikatkan ke tombol aksi massal di sebuah tabel.

![Konfigurasi Pemicu_Tipe Konteks](https://static-docs.nocobase.com/20250215135808.png)

### Koleksi

Ketika tipe konteks adalah Satu Baris Data atau Beberapa Baris Data, Anda perlu memilih koleksi untuk mengikat model data:

![Konfigurasi Pemicu_Pilih Koleksi](https://static-docs.nocobase.com/20250215135919.png)

### Data Asosiasi yang Akan Digunakan

Jika Anda perlu menggunakan data asosiasi dari baris data pemicu dalam alur kerja, Anda dapat memilih bidang asosiasi mendalam di sini:

![Konfigurasi Pemicu_Pilih Data Asosiasi yang Akan Digunakan](https://static-docs.nocobase.com/20250215135955.png)

Bidang-bidang ini akan secara otomatis dimuat sebelumnya ke dalam konteks alur kerja setelah peristiwa terpicu, sehingga tersedia untuk digunakan dalam alur kerja.

## Konfigurasi Aksi

Konfigurasi tombol aksi di blok yang berbeda bervariasi tergantung pada tipe konteks yang dikonfigurasi dalam alur kerja.

### Tanpa Konteks

> v.1.6.0+

Di Bilah Aksi dan blok data lainnya, Anda dapat menambahkan tombol "Picu Alur Kerja":

![Tambahkan Tombol Aksi ke Blok_Bilah Aksi](https://static-docs.nocobase.com/20250215221738.png)

![Tambahkan Tombol Aksi ke Blok_Kalender](https://static-docs.nocobase.com/20250215221942.png)

![Tambahkan Tombol Aksi ke Blok_Diagram Gantt](https://static-docs.nocobase.com/20250215221810.png)

Setelah menambahkan tombol, ikat alur kerja tanpa konteks yang telah dibuat sebelumnya. Berikut adalah contoh menggunakan tombol di Bilah Aksi:

![Ikat Alur Kerja ke Tombol_Bilah Aksi](https://static-docs.nocobase.com/20250215222120.png)

![Pilih Alur Kerja untuk Diikat_Tanpa Konteks](https://static-docs.nocobase.com/20250215222234.png)

### Satu Baris Data

Di blok data mana pun, tombol "Picu Alur Kerja" dapat ditambahkan ke bilah aksi untuk satu baris data, seperti di formulir, baris tabel, detail, dll.:

![Tambahkan Tombol Aksi ke Blok_Formulir](https://static-docs.nocobase.com/20240509165428.png)

![Tambahkan Tombol Aksi ke Blok_Baris Tabel](https://static-docs.nocobase.com/20240509165340.png)

![Tambahkan Tombol Aksi ke Blok_Detail](https://static-docs.nocobase.com/20240509165545.png)

Setelah menambahkan tombol, ikat alur kerja yang telah dibuat sebelumnya:

![Ikat Alur Kerja ke Tombol](https://static-docs.nocobase.com/20240509165631.png)

![Pilih Alur Kerja untuk Diikat](https://static-docs.nocobase.com/20240509165658.png)

Setelah itu, mengklik tombol ini akan memicu peristiwa aksi kustom.

![Hasil Mengklik Tombol](https://static-docs.nocobase.com/20240509170453.png)

### Beberapa Baris Data

> v.1.6.0+

Di bilah aksi blok tabel, saat menambahkan tombol "Picu Alur Kerja", ada opsi tambahan untuk memilih tipe konteks: "Tanpa Konteks" atau "Beberapa Baris Data":

![Tambahkan Tombol Aksi ke Blok_Tabel](https://static-docs.nocobase.com/20250215222507.png)

Ketika "Tanpa Konteks" dipilih, ini adalah peristiwa global dan hanya dapat diikatkan ke alur kerja tipe tanpa konteks.

Ketika "Beberapa Baris Data" dipilih, Anda dapat mengikat alur kerja tipe beberapa baris data, yang dapat digunakan untuk aksi massal setelah memilih beberapa baris data (saat ini hanya didukung oleh tabel). Alur kerja yang tersedia terbatas pada yang dikonfigurasi agar sesuai dengan koleksi blok data saat ini:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Saat mengklik tombol untuk memicu, beberapa baris data dalam tabel harus sudah dicentang; jika tidak, alur kerja tidak akan terpicu:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Contoh

Sebagai contoh, kita memiliki koleksi "Sampel". Untuk sampel dengan status "Terkumpul", kita perlu menyediakan aksi "Kirim untuk Inspeksi". Aksi ini akan terlebih dahulu memeriksa informasi dasar sampel, kemudian menghasilkan "Catatan Inspeksi", dan akhirnya mengubah status sampel menjadi "Terkirim". Serangkaian proses ini tidak dapat diselesaikan dengan klik tombol "tambah, hapus, perbarui, lihat" sederhana, jadi peristiwa aksi kustom dapat digunakan untuk mengimplementasikannya.

Pertama, buat koleksi "Sampel" dan koleksi "Catatan Inspeksi", lalu masukkan beberapa data uji dasar ke dalam koleksi Sampel:

![Contoh_Koleksi Sampel](https://static-docs.nocobase.com/20240509172234.png)

Kemudian, buat alur kerja "Peristiwa Aksi Kustom". Jika Anda membutuhkan umpan balik yang cepat dari proses operasi, Anda dapat memilih mode sinkron (dalam mode sinkron, Anda tidak dapat menggunakan node asinkron seperti pemrosesan manual):

![Contoh_Membuat Alur Kerja](https://static-docs.nocobase.com/20240509173106.png)

Dalam konfigurasi pemicu, pilih "Sampel" untuk koleksi:

![Contoh_Konfigurasi Pemicu](https://static-docs.nocobase.com/20240509173148.png)

Atur logika dalam proses sesuai dengan kebutuhan bisnis. Misalnya, izinkan pengiriman untuk inspeksi hanya jika parameter indikator lebih besar dari `90`; jika tidak, tampilkan pesan yang relevan:

![Contoh_Pengaturan Logika Bisnis](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Petunjuk}
Node "[Pesan Respons](../nodes/response-message.md)" dapat digunakan dalam peristiwa aksi kustom sinkron untuk mengembalikan pesan prompt kepada klien. Node ini tidak dapat digunakan dalam mode asinkron.
:::

Setelah mengonfigurasi dan mengaktifkan alur kerja, kembali ke antarmuka tabel dan tambahkan tombol "Picu Alur Kerja" di kolom aksi tabel:

![Contoh_Menambahkan Tombol Aksi](https://static-docs.nocobase.com/20240509174525.png)

Kemudian, di menu konfigurasi tombol, pilih untuk mengikat alur kerja dan buka pop-up konfigurasi:

![Contoh_Membuka Pop-up Ikatan Alur Kerja](https://static-docs.nocobase.com/20240509174633.png)

Tambahkan alur kerja yang sebelumnya diaktifkan:

![Contoh_Memilih Alur Kerja](https://static-docs.nocobase.com/20240509174723.png)

Setelah mengirimkan, ubah teks tombol menjadi nama aksi, seperti "Kirim untuk Inspeksi". Proses konfigurasi kini selesai.

Untuk menggunakannya, pilih data sampel apa pun di tabel dan klik tombol "Kirim untuk Inspeksi" untuk memicu peristiwa aksi kustom. Sesuai dengan logika yang diatur sebelumnya, jika parameter indikator sampel kurang dari 90, prompt berikut akan ditampilkan setelah mengklik:

![Contoh_Indikator Tidak Memenuhi Kriteria Pengiriman](https://static-docs.nocobase.com/20240509175026.png)

Jika parameter indikator lebih besar dari 90, proses akan dieksekusi secara normal, menghasilkan "Catatan Inspeksi" dan mengubah status sampel menjadi "Terkirim":

![Contoh_Pengiriman Berhasil](https://static-docs.nocobase.com/20240509175247.png)

Pada titik ini, sebuah peristiwa aksi kustom sederhana telah selesai. Demikian pula, untuk bisnis dengan operasi kompleks seperti pemrosesan pesanan atau pengiriman laporan, peristiwa aksi kustom dapat digunakan untuk implementasi.

## Panggilan Eksternal

Pemicuan peristiwa aksi kustom tidak terbatas pada aksi antarmuka pengguna; ini juga dapat dipicu melalui panggilan HTTP API. Secara khusus, peristiwa aksi kustom menyediakan tipe aksi baru untuk semua aksi koleksi untuk memicu alur kerja: `trigger`, yang dapat dipanggil menggunakan API aksi standar NocoBase.

Alur kerja yang dipicu oleh tombol, seperti dalam contoh, dapat dipanggil seperti ini:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Karena aksi ini untuk satu baris data, saat memanggilnya pada data yang sudah ada, Anda perlu menentukan ID baris data, mengganti bagian `<:id>` di URL.

Jika dipanggil untuk formulir (seperti untuk membuat atau memperbarui), Anda dapat menghilangkan ID untuk formulir yang membuat data baru, tetapi Anda harus meneruskan data yang dikirimkan sebagai konteks eksekusi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Untuk formulir pembaruan, Anda perlu meneruskan ID baris data dan data yang diperbarui secara bersamaan:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "indicator": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Jika ID dan data diteruskan secara bersamaan, baris data yang sesuai dengan ID akan dimuat terlebih dahulu, dan kemudian properti dari objek data yang diteruskan akan digunakan untuk menimpa baris data asli untuk mendapatkan konteks data pemicu akhir.

:::warning{title="Perhatian"}
Jika data asosiasi diteruskan, itu juga akan ditimpa. Berhati-hatilah saat menangani data yang masuk jika pramuat item data asosiasi dikonfigurasi, untuk menghindari penimpaan data asosiasi yang tidak terduga.
:::

Selain itu, parameter URL `triggerWorkflows` adalah kunci alur kerja; beberapa kunci alur kerja dipisahkan oleh koma. Kunci ini dapat diperoleh dengan mengarahkan kursor mouse ke nama alur kerja di bagian atas kanvas alur kerja:

![Alur Kerja_Kunci_Cara Melihat](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan berhasil, peristiwa aksi kustom untuk koleksi `samples` yang sesuai akan terpicu.

:::info{title=Petunjuk}
Karena panggilan eksternal juga perlu didasarkan pada identitas pengguna, saat memanggil melalui HTTP API, sama seperti permintaan yang dikirim dari antarmuka biasa, Anda perlu menyediakan informasi autentikasi. Ini termasuk header permintaan `Authorization` atau parameter `token` (token yang diperoleh saat login), dan header permintaan `X-Role` (nama peran pengguna saat ini).
:::

Jika Anda perlu memicu peristiwa untuk data asosiasi satu-ke-satu (satu-ke-banyak saat ini tidak didukung) dalam aksi ini, Anda dapat menggunakan `!` dalam parameter untuk menentukan data pemicu dari bidang asosiasi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/posts:trigger/<:id>?triggerWorkflows=workflowKey!category"
```

Setelah panggilan berhasil, peristiwa aksi kustom untuk koleksi `categories` yang sesuai akan terpicu.

:::info{title=Petunjuk}
Saat memicu peristiwa aksi melalui panggilan HTTP API, Anda juga perlu memperhatikan status aktif alur kerja dan apakah konfigurasi koleksi cocok; jika tidak, panggilan mungkin tidak berhasil atau mungkin terjadi kesalahan.
:::