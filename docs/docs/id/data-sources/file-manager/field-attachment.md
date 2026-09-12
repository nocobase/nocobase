---
title: "Lampiran"
description: "Field lampiran digunakan untuk mengunggah dan mengaitkan file, sedangkan metadata file disimpan dalam tabel file."
keywords: "Lampiran,attachment,unggah file,tabel file,NocoBase"
---

# Lampiran (deprecated)

## Pengenalan

:::warning Perhatian

Field lampiran sudah tidak digunakan lagi. Disarankan menggunakan field [Tabel file](./file-collection.md) atau [URL lampiran](../field-attachment-url/index.md).

:::

Di NocoBase, **Lampiran (Attachment)** digunakan untuk mengunggah file dan mengaitkan catatan file dengan catatan bisnis saat ini.

Field lampiran biasanya dikaitkan dengan tabel file. File fisik disimpan oleh mesin penyimpanan file, sedangkan metadata seperti nama file, ukuran, URL, dan tipe MIME disimpan dalam tabel file.

Jika hanya perlu menyimpan tautan file eksternal, pilih [URL lampiran](../field-attachment-url/index.md) atau [URL](../data-modeling/collection-fields/basic/url.md).

## Skenario yang sesuai

Lampiran cocok untuk skenario bisnis berikut:

- Lampiran kontrak, file faktur, bukti penggantian biaya
- Foto produk, dokumen identitas karyawan, dokumen proyek
- Tangkapan layar tiket kerja, lampiran masalah
- Beberapa file yang terkait dengan catatan bisnis

## Pembuatan dan konfigurasi

Di halaman «Configure fields» pada tabel data, klik «Add field», lalu pilih «Lampiran» untuk membuat field lampiran.

![20240512180916](https://static-docs.nocobase.com/20251031000729.png)

| Konfigurasi | Deskripsi |
| --- | --- |
| Field interface | Jenis antarmuka field. Lampiran menggunakan `attachment`, yang menentukan cara input dan tampilan di halaman. |
| Field display name | Nama yang ditampilkan field di antarmuka, misalnya «Lampiran kontrak», «File faktur», atau «Foto produk». Sebaiknya gunakan nama yang dapat langsung dipahami oleh staf bisnis. |
| Field name | Nama identifikasi field yang digunakan untuk referensi internal seperti API, field relasi, izin, dan alur kerja. Biasanya tidak diubah lagi setelah dibuat, hanya mendukung huruf, angka, dan garis bawah, serta harus diawali huruf. |
| Field type | Tipe field pada lapisan data. Field lampiran biasanya merupakan field relasi yang mengaitkan catatan file dalam tabel file. |
| Default value | Nilai default. Saat menambahkan catatan, nilai default dapat diisi otomatis jika pengguna tidak mengisinya. |
| Validation rules | Aturan validasi. Dapat membatasi apakah field wajib diisi; jumlah, ukuran, dan tipe file biasanya dikontrol melalui komponen unggah atau konfigurasi penyimpanan file. |
| Description | Deskripsi field. Cocok digunakan untuk menjelaskan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Nama field akan direferensikan oleh blok halaman, izin, alur kerja, dan API. Pastikan penamaannya sebelum membuat field untuk menghindari biaya penyesuaian konfigurasi di kemudian hari.

:::

## Fitur field

Perilaku default field lampiran adalah sebagai berikut:

| Fitur | Deskripsi |
| --- | --- |
| Default Field interface | `attachment`. |
| Default Field type | `belongsToMany`. |
| Field type opsional | `belongsToMany` dan tipe relasi lainnya, sesuai dengan konfigurasi field file. |
| Komponen halaman | Mode edit menggunakan komponen unggah lampiran. |
| Filter | Biasanya memfilter berdasarkan apakah field kosong atau memiliki file terkait. |
| Pengurutan | Biasanya tidak digunakan untuk pengurutan. |
| Validasi | Mendukung validasi dasar seperti wajib diisi; batasan unggahan mengikuti konfigurasi komponen. |

## Edit konfigurasi

Setelah dibuat, klik «Edit» di sebelah kanan field untuk mengedit konfigurasi field lampiran. Pengeditan field terutama digunakan untuk menyesuaikan cara field ditampilkan dan digunakan di NocoBase, seperti mengubah nama tampilan, deskripsi, nilai default, aturan validasi, atau konfigurasi khusus field.

Jika field berasal dari tabel yang sudah disinkronkan dalam database utama, pengeditan biasanya dilakukan sebagai pemetaan field—memetakan field database menjadi Field type dan Field interface NocoBase.

| Konfigurasi | Dapat diedit | Deskripsi |
| --- | --- | --- |
| Field display name | Ya | Mengubah nama tampilan field di antarmuka tanpa mengubah nama identifikasi field. |
| Field name | Tidak | Nama identifikasi field biasanya tidak dapat diubah melalui formulir edit setelah field dibuat. |
| Field interface | Didukung secara kondisional | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Penyesuaian ini akan memengaruhi cara input, tampilan, dan validasi di halaman. |
| Field type | Didukung secara kondisional | Field database utama atau field tersinkronisasi dapat disesuaikan saat pemetaan field. Sebelum menyesuaikannya, pastikan data yang ada dapat digunakan dengan tipe baru. |
| Default value | Ya | Menyesuaikan nilai default saat menambahkan catatan baru. |
| Validation rules | Ya | Menyesuaikan aturan validasi field. |
| Description | Ya | Menambahkan arti field, persyaratan pengisian, sumber data, atau penanggung jawab pemeliharaan. |

:::warning Perhatian

Mengganti Field type atau Field interface bukan sekadar mengubah nama tampilan. Hal ini akan memengaruhi cara penyimpanan field, komponen input, aturan validasi, kondisi filter, dan cara penggunaan variabel alur kerja. Jika jumlah data yang ada cukup banyak, pastikan terlebih dahulu format data sesuai.

:::

## Hapus field

Klik «Delete» di sebelah kanan field untuk menghapus field lampiran. Dalam database utama, Anda juga dapat memilih beberapa field lalu menghapusnya secara massal.

Saat menghapus field lampiran yang dibuat di database utama, kolom sebenarnya dalam database beserta data yang sudah ada di kolom tersebut biasanya akan ikut dihapus. Saat menghapus field yang disinkronkan dari database atau dipetakan dari sumber data eksternal, cakupan dampaknya bergantung pada sumber data dan asal field terkait.

:::danger Peringatan

Penghapusan field dapat memengaruhi blok halaman, formulir, filter, izin, alur kerja, API, impor dan ekspor, serta data yang sudah ada. Pastikan terlebih dahulu apakah field masih digunakan oleh konfigurasi bisnis.

:::

## Penggunaan dalam konfigurasi halaman

Field lampiran cocok digunakan dalam skenario formulir, detail, dan manajemen file.
![20260709231642](https://static-docs.nocobase.com/20260709231642.png)

| Skenario | Kegunaan |
| --- | --- |
| Blok formulir | Mengunggah satu atau beberapa file. |
| Blok detail | Melihat, melihat pratinjau, atau mengunduh lampiran. |
| Blok tabel | Menampilkan jumlah lampiran atau akses lampiran. |
| Alur kerja | Menggunakan lampiran sebagai file terkait untuk persetujuan, pemberitahuan, atau ekspor. |

## Link terkait

- [Field](../index.md) — Memahami fungsi, klasifikasi, dan logika pemetaan field
- [Tabel biasa](../data-source-main/general-collection.md) — Membuat dan mengelola field dalam tabel biasa
- [Tabel file](./file-collection.md) — Memahami cara penyimpanan metadata file
- [URL lampiran](../field-attachment-url/index.md) — Menyimpan alamat file eksternal
- [URL](../data-modeling/collection-fields/basic/url.md) — Menyimpan tautan biasa
