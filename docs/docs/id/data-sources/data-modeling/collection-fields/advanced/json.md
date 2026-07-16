---
title: "JSON"
description: "Field JSON digunakan untuk menyimpan objek terstruktur, array, cuplikan respons API, dan data semi-terstruktur lainnya."
keywords: "JSON,json,data terstruktur,NocoBase"
---

# JSON

## Pengenalan

Di NocoBase, **JSON（JSON）** digunakan untuk menyimpan data terstruktur atau semi-terstruktur.

Field JSON cocok untuk menyimpan cuplikan respons API eksternal, konfigurasi tambahan, properti dinamis, dan data lain yang strukturnya tidak tetap. Field ini fleksibel, tetapi tidak semudah field biasa untuk difilter, divalidasi, dan ditampilkan.

Jika struktur field stabil, sebaiknya pecah menjadi field yang jelas agar lebih mudah digunakan dalam konfigurasi halaman, izin, filter, dan alur kerja.

## Skenario penggunaan

JSON cocok untuk skenario bisnis berikut:

- Respons asli dari API eksternal
- Properti tambahan yang dinamis
- Objek konfigurasi yang kompleks
- Menyimpan sementara data yang tidak dapat dipecah menjadi struktur

## Membuat konfigurasi

Pada halaman 「Configure fields」 di tabel data, klik 「Add field」, lalu pilih 「JSON」 untuk membuat field JSON.

![20240512173905](https://static-docs.nocobase.com/20240512173905.png)

| Konfigurasi | Penjelasan |
| --- | --- |
| Field interface | Jenis antarmuka field. JSON sesuai dengan `json`, yang menentukan cara memasukkan dan menampilkan data di halaman. |
| Field display name | Nama yang ditampilkan untuk field di antarmuka, misalnya 「Informasi tambahan」「Respons API」「Konfigurasi」. Sebaiknya gunakan nama yang dapat langsung dipahami oleh pengguna bisnis. |
| Field name | Nama pengenal field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Setelah dibuat, biasanya tidak dapat diubah lagi. Hanya mendukung huruf, angka, dan garis bawah, serta harus diawali dengan huruf. |
| Field type | Jenis field pada lapisan data. Field JSON biasanya menggunakan `json` atau `jsonb`. |
| Default value | Nilai default. Saat menambahkan record, nilai default dapat otomatis diisi jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Biasanya digunakan untuk memeriksa apakah JSON valid atau apakah field wajib diisi. |
| Description | Deskripsi field. Cocok untuk menjelaskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan digunakan sebagai referensi oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Sifat field

Perilaku default field JSON adalah sebagai berikut:

| Sifat | Penjelasan |
| --- | --- |
| Default Field interface | `json`。 |
| Default Field type | `json`。 |
| Field type opsional | `json`、`jsonb`, bergantung pada kemampuan database. |
| Komponen halaman | Mode edit menggunakan komponen editor JSON atau komponen input teks. |
| Filter | Kemampuan filter bergantung pada database dan pemetaan field, sehingga biasanya tidak digunakan sebagai field filter utama. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi JSON yang valid, field wajib diisi, dan validasi lainnya. |

## Mengedit konfigurasi

Setelah dibuat, klik 「Edit」 di sebelah kanan field untuk mengedit konfigurasi field JSON. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang telah disinkronkan di database utama, pengeditan biasanya dilakukan sebagai pemetaan field—memetakan field database menjadi Field type dan Field interface di NocoBase.

| Konfigurasi | Dapat diedit | Penjelasan |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama yang ditampilkan untuk field di antarmuka tanpa mengubah nama pengenal field. |
| Field name | Tidak | Nama pengenal field biasanya tidak dapat diubah melalui formulir edit setelah dibuat. |
| Field interface | Dengan syarat tertentu | Field database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Dengan syarat tertentu | Field database utama atau field yang disinkronkan dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan tipe baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan record baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Menghapus field

Klik 「Delete」 di sebelah kanan field untuk menghapus field JSON. Di database utama, Anda juga dapat memilih beberapa field, lalu menghapusnya secara massal.

Saat menghapus field JSON yang dibuat di database utama, kolom sebenarnya di database beserta data yang ada di kolom tersebut biasanya juga akan dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Sebelum menghapus, pastikan field tersebut tidak lagi digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field JSON cocok digunakan dalam skenario integrasi dan konfigurasi tambahan.
![20260710151854](https://static-docs.nocobase.com/20260710151854.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Memasukkan atau mengedit data JSON. |
| Blok detail | Menampilkan konten terstruktur. |
| Alur kerja | Menyimpan atau membaca cuplikan respons dari API eksternal. |
| API | Mengirimkan atau mengembalikan objek tambahan. |

## Tautan terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../../../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Teks multi-baris](../basic/textarea.md) — Menyimpan konten teks panjang biasa
- [Rumus](../../../field-formula/index.md) — Menghitung hasil berdasarkan field
