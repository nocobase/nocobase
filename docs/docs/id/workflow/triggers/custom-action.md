---
pkg: '@nocobase/plugin-workflow-custom-action-trigger'
title: "Event Action Kustom"
description: "Trigger event action kustom: ikat tombol action kustom, picu Workflow saat diklik, mewujudkan otomasi yang digerakkan oleh tombol."
keywords: "Workflow,event action kustom,Custom Action,picu tombol,ikat Workflow,NocoBase"
---
# Event Action Kustom

## Pengantar

NocoBase memiliki operasi data umum bawaan (tambah, hapus, perbarui, kueri, dll.). Ketika operasi-operasi ini tidak dapat memenuhi kebutuhan bisnis kompleks, Anda dapat menggunakan event action kustom dalam Workflow, dan ikat event ini pada tombol "Picu Workflow" di Block halaman. Setelah pengguna klik, akan memicu Workflow operasi kustom.

## Membuat Workflow

Saat membuat Workflow, pilih "Event Action Kustom":

![Buat Workflow "Event Action Kustom"](https://static-docs.nocobase.com/20240509091820.png)

## Konfigurasi Trigger

### Tipe Konteks

> v.1.6.0+

Tipe konteks yang berbeda akan menentukan tombol Block mana yang dapat diikat dengan Workflow ini:

* Tanpa Konteks: yaitu event global, dapat diikat pada tombol operasi panel operasi, tombol operasi Block data;
* Single Row Data: dapat diikat pada tombol operasi pada baris data table, formulir, detail, dan Block data lainnya;
* Multi Row Data: dapat diikat pada tombol operasi batch table.

![Konfigurasi Trigger_tipe konteks](https://static-docs.nocobase.com/20250215135808.png)

### Tabel Data

Ketika tipe konteks adalah single row data atau multi row data, Anda perlu memilih tabel data yang akan diikat dengan model datanya:

![Konfigurasi Trigger_pilih tabel data](https://static-docs.nocobase.com/20250215135919.png)

### Data Relasi yang Akan Digunakan

Jika perlu menggunakan data terkait dari baris data pemicu dalam Workflow, Anda dapat memilih field relasi tingkat dalam di sini:

![Konfigurasi Trigger_pilih data relasi yang akan digunakan](https://static-docs.nocobase.com/20250215135955.png)

Field-field ini akan otomatis di-preload ke konteks Workflow setelah event dipicu, untuk digunakan dalam Workflow.

## Konfigurasi Operasi

Berdasarkan tipe konteks Workflow yang dikonfigurasi berbeda, konfigurasi tombol operasi pada Block yang berbeda juga berbeda.

### Tanpa Konteks

> v1.6.0+

Pada panel operasi dan Block data lainnya, semua dapat menambahkan tombol "Picu Workflow":

![Block tambah tombol operasi_panel operasi](https://static-docs.nocobase.com/20250215221738.png)

![Block tambah tombol operasi_kalender](https://static-docs.nocobase.com/20250215221942.png)

![Block tambah tombol operasi_Gantt chart](https://static-docs.nocobase.com/20250215221810.png)

Setelah menambahkan tombol, ikat dengan Workflow tanpa konteks yang sebelumnya dibuat, contoh tombol di panel operasi:

![Tombol ikat Workflow_panel operasi](https://static-docs.nocobase.com/20250215222120.png)

![Pilih Workflow yang akan diikat_tanpa konteks](https://static-docs.nocobase.com/20250215222234.png)

### Single Record

Pada Block data apa pun, pada bilah operasi data single row dapat menambahkan tombol "Picu Workflow", seperti formulir, baris data table, detail, dll.:

![Block tambah tombol operasi_formulir](https://static-docs.nocobase.com/20240509165428.png)

![Block tambah tombol operasi_baris table](https://static-docs.nocobase.com/20240509165340.png)

![Block tambah tombol operasi_detail](https://static-docs.nocobase.com/20240509165545.png)

Setelah menambahkan tombol, ikat dengan Workflow yang sebelumnya dibuat:

![Tombol ikat Workflow](https://static-docs.nocobase.com/20240509165631.png)

![Pilih Workflow yang akan diikat](https://static-docs.nocobase.com/20240509165658.png)

Setelah itu klik tombol ini akan memicu event action kustom tersebut:

![Hasil pemicuan klik tombol](https://static-docs.nocobase.com/20240509170453.png)

### Multi Record

> v1.6.0+

Pada bilah operasi Block table, saat menambahkan tombol "Picu Workflow" akan ada opsi tambahan, pilih tipe konteks "Tanpa Konteks" atau "Multi Row Data":

![Block tambah tombol operasi_table](https://static-docs.nocobase.com/20250215222507.png)

Saat memilih "Tanpa Konteks", yaitu event global, hanya dapat mengikat Workflow tipe tanpa konteks.

Saat memilih "Multi Row Data", dapat mengikat Workflow tipe multi row data, dapat digunakan untuk operasi batch setelah multi-select data (saat ini hanya didukung table). Saat ini lingkup Workflow yang dapat dipilih hanya Workflow yang dikonfigurasi cocok dengan tabel data Block data saat ini:

![20250215224436](https://static-docs.nocobase.com/20250215224436.png)

Saat klik tombol untuk memicu, harus sudah memilih sebagian baris data dalam table, jika tidak Workflow tidak akan dipicu:

![20250215224736](https://static-docs.nocobase.com/20250215224736.png)

## Contoh

Misalnya, kita memiliki tabel data "Sampel", untuk sampel "Sudah Dikumpulkan" (status), perlu menyediakan operasi "Kirim untuk Pemeriksaan". Pengiriman pemeriksaan akan memeriksa informasi dasar sampel terlebih dahulu, kemudian menghasilkan satu data "Record Pengiriman Pemeriksaan", lalu mengubah status sampel menjadi "Sudah Dikirim untuk Pemeriksaan". Sedangkan rangkaian proses ini tidak dapat diselesaikan dengan klik tombol "tambah, hapus, perbarui, kueri" sederhana, saat ini dapat menggunakan event action kustom untuk implementasi.

Buat dulu satu tabel data "Sampel" dan satu tabel data "Record Pengiriman Pemeriksaan", masukkan data uji dasar ke tabel sampel:

![Contoh_tabel data sampel](https://static-docs.nocobase.com/20240509172234.png)

Kemudian buat sebuah Workflow "Event Action Kustom", jika perlu alur operasi memberikan umpan balik yang relatif tepat waktu, dapat memilih mode sinkron (pada mode sinkron tidak dapat menggunakan Node tipe asinkron seperti penanganan manual):

![Contoh_buat Workflow](https://static-docs.nocobase.com/20240509173106.png)

Pada konfigurasi Trigger, tabel data pilih "Sampel":

![Contoh_konfigurasi Trigger](https://static-docs.nocobase.com/20240509173148.png)

Berdasarkan kebutuhan bisnis, orkestrasikan logika dalam alur, misalnya hanya mengizinkan kirim pemeriksaan saat parameter indikator lebih besar dari `90`, jika tidak menampilkan masalah terkait:

![Contoh_orkestrasi logika bisnis](https://static-docs.nocobase.com/20240509174159.png)

:::info{title=Tips}
Node "[Response Message](../nodes/response-message.md)" dapat digunakan dalam event action kustom sinkron, untuk mengembalikan informasi tip ke client. Tidak dapat digunakan pada mode asinkron.
:::

Setelah alur dikonfigurasi dan diaktifkan, kembali ke antarmuka table, tambahkan tombol "Picu Workflow" di kolom operasi table:

![Contoh_tambah tombol operasi](https://static-docs.nocobase.com/20240509174525.png)

Kemudian pada menu konfigurasi tombol pilih ikat Workflow, buka dialog konfigurasi:

![Contoh_buka dialog ikat Workflow](https://static-docs.nocobase.com/20240509174633.png)

Tambahkan Workflow yang sebelumnya diaktifkan:

![Contoh_pilih Workflow](https://static-docs.nocobase.com/20240509174723.png)

Setelah dikirim, ubah teks tombol menjadi nama operasi, seperti kata "Kirim untuk Pemeriksaan", konfigurasi alur sudah selesai.

Saat menggunakan, di table pilih satu data sampel, dan klik tombol "Kirim untuk Pemeriksaan", akan memicu event action kustom. Seperti logika orkestrasi sebelumnya, jika parameter indikator sampel kurang dari 90, setelah klik akan menampilkan tip seperti berikut:

![Contoh_indikator tidak memenuhi pengiriman pemeriksaan](https://static-docs.nocobase.com/20240509175026.png)

Jika parameter indikator lebih besar dari 90, akan mengeksekusi alur secara normal, menghasilkan data "Record Pengiriman Pemeriksaan", dan mengubah status sampel menjadi "Sudah Dikirim untuk Pemeriksaan":

![Contoh_pengiriman pemeriksaan sukses](https://static-docs.nocobase.com/20240509175247.png)

Sampai di sini, sebuah event action kustom sederhana sudah selesai. Sama halnya, untuk bisnis serupa dengan operasi kompleks, seperti pemrosesan pesanan, pengiriman laporan, dll., semuanya dapat diimplementasikan melalui event action kustom.

## Panggilan Eksternal

Pemicuan event action kustom tidak terbatas pada operasi antarmuka pengguna, juga dapat dipicu melalui panggilan API HTTP. Khususnya, event action kustom menyediakan tipe operasi baru `trigger` untuk semua operasi tabel data untuk memicu Workflow, dapat dipanggil dengan API operasi standar NocoBase.

:::info{title="Tips"}
Karena panggilan eksternal juga perlu berbasis identitas pengguna, jadi saat memanggil melalui API HTTP, sama dengan request yang dikirim antarmuka biasa, perlu menyediakan informasi autentikasi, termasuk request header `Authorization` atau parameter `token` (token yang diperoleh saat login), serta request header `X-Role` (nama peran pengguna saat ini).
:::

### Tanpa Konteks

Workflow tanpa konteks perlu memicu operasi terhadap resource workflows:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/workflows:trigger?triggerWorkflows=workflowKey"
```

### Single Record

Mirip dengan Workflow yang dipicu tombol di contoh, dapat dipanggil seperti ini:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Karena operasi ini ditujukan untuk single record, jadi saat memanggil untuk data yang sudah ada, perlu menentukan ID baris data, ganti bagian `<:id>` dalam URL.

Jika ditujukan untuk panggilan formulir (seperti tambah atau perbarui), untuk formulir tambah data dapat tidak memasukkan ID, tetapi perlu memasukkan data yang dikirim, sebagai data konteks eksekusi:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger?triggerWorkflows=workflowKey"
```

Untuk formulir perbarui, perlu memasukkan ID baris data sekaligus, dan data yang diperbarui:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Sample 1",
    "id": 91
  }'
  "http://localhost:3000/api/samples:trigger/<:id>?triggerWorkflows=workflowKey"
```

Jika memasukkan ID dan data sekaligus, akan terlebih dahulu memuat baris data yang sesuai dengan ID, kemudian menggunakan properti dalam objek data yang dimasukkan untuk menimpa baris data asli untuk mendapatkan konteks data pemicu akhir.

:::warning{title="Perhatian"}
Jika memasukkan data relasi, juga akan dilakukan penimpaan, terutama saat dikonfigurasi pre-load menggunakan item data relasi, perlu hati-hati menangani data yang dimasukkan, agar data relasi tidak ditimpa secara tidak sesuai harapan.
:::

Selain itu, parameter URL `triggerWorkflows` adalah key Workflow, beberapa Workflow dipisahkan dengan koma. Key tersebut dapat diperoleh dengan hover mouse di nama Workflow di bagian atas kanvas Workflow:

![Workflow_key_cara melihat](https://static-docs.nocobase.com/20240426135108.png)

Setelah panggilan di atas sukses, akan memicu event action kustom dari tabel `samples` yang sesuai.

:::info{title="Tips"}
Saat memicu event setelah action melalui panggilan API HTTP, juga perlu memperhatikan status aktivasi Workflow, dan apakah konfigurasi tabel data cocok, jika tidak mungkin tidak akan terpanggil sukses, atau muncul error.
:::

### Multi Record

Mirip dengan cara panggilan single record, tetapi data yang dimasukkan hanya perlu beberapa parameter primary key (`filterByTk[]`), dan tidak perlu memasukkan bagian data:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/samples:trigger?filterByTk[]=1&filterByTk[]=2&triggerWorkflows=workflowKey"
```

Panggilan ini akan memicu event action kustom mode multi record, dan menggunakan data dengan id 1 dan 2 sebagai data dalam konteks Trigger.
