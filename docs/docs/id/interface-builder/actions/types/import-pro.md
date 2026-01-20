---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Import Pro

## Pendahuluan

Plugin Import Pro menyediakan fitur-fitur yang disempurnakan di atas fungsionalitas import standar.

## Instalasi

Plugin ini bergantung pada plugin Manajemen Tugas Asinkron. Anda perlu mengaktifkan plugin Manajemen Tugas Asinkron sebelum menggunakannya.

## Peningkatan Fitur

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Mendukung operasi import asinkron, dieksekusi dalam thread terpisah, dan mendukung import data dalam jumlah besar.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Mendukung opsi import lanjutan.

## Panduan Pengguna

### Import Asinkron

Setelah Anda menjalankan import, proses import akan berjalan di thread latar belakang terpisah tanpa memerlukan konfigurasi manual dari pengguna. Di antarmuka pengguna, setelah memulai operasi import, tugas import yang sedang berjalan akan ditampilkan di sudut kanan atas, menunjukkan progres tugas secara real-time.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Setelah import selesai, Anda dapat melihat hasilnya di tugas import.

#### Tentang Performa

Untuk mengevaluasi performa import data skala besar, kami melakukan uji perbandingan di berbagai skenario, tipe bidang, dan konfigurasi pemicu (hasil dapat bervariasi tergantung pada konfigurasi server dan database, hanya sebagai referensi):

| Volume Data | Tipe Bidang | Konfigurasi Import | Waktu Pemrosesan |
|------|---------|---------|---------|
| 1 juta catatan | String, Angka, Tanggal, Email, Teks Panjang | • Pemicu Alur Kerja: Tidak<br>• Pengidentifikasi Duplikat: Tidak Ada | Sekitar 1 menit |
| 500.000 catatan | String, Angka, Tanggal, Email, Teks Panjang, Banyak-ke-Banyak | • Pemicu Alur Kerja: Tidak<br>• Pengidentifikasi Duplikat: Tidak Ada | Sekitar 16 menit|
| 500.000 catatan | String, Angka, Tanggal, Email, Teks Panjang, Banyak-ke-Banyak, Banyak-ke-Satu | • Pemicu Alur Kerja: Tidak<br>• Pengidentifikasi Duplikat: Tidak Ada | Sekitar 22 menit |
| 500.000 catatan | String, Angka, Tanggal, Email, Teks Panjang, Banyak-ke-Banyak, Banyak-ke-Satu | • Pemicu Alur Kerja: Notifikasi pemicu asinkron<br>• Pengidentifikasi Duplikat: Tidak Ada | Sekitar 22 menit |
| 500.000 catatan | String, Angka, Tanggal, Email, Teks Panjang, Banyak-ke-Banyak, Banyak-ke-Satu | • Pemicu Alur Kerja: Notifikasi pemicu asinkron<br>• Pengidentifikasi Duplikat: Perbarui duplikat, dengan 50.000 catatan duplikat | Sekitar 3 jam |

Berdasarkan hasil uji performa di atas dan beberapa desain yang ada, berikut adalah beberapa penjelasan dan saran mengenai faktor-faktor yang memengaruhi:

1.  **Mekanisme Penanganan Catatan Duplikat**: Saat memilih opsi **Perbarui catatan duplikat** atau **Hanya perbarui catatan duplikat**, sistem akan melakukan operasi kueri dan pembaruan baris demi baris, yang secara signifikan mengurangi efisiensi import. Jika file Excel Anda berisi data duplikat yang tidak perlu, ini akan semakin memengaruhi kecepatan import. Disarankan untuk membersihkan data duplikat yang tidak perlu di file Excel (misalnya, menggunakan alat deduplikasi profesional) sebelum mengimportnya ke sistem untuk menghindari pemborosan waktu.

2.  **Efisiensi Pemrosesan Bidang Relasi**: Sistem memproses bidang relasi dengan mengueri asosiasi baris demi baris, yang dapat menjadi hambatan performa dalam skenario data besar. Untuk struktur relasi sederhana (seperti asosiasi satu-ke-banyak antara dua koleksi), strategi import multi-langkah disarankan: pertama import data dasar koleksi utama, lalu bangun relasi antar koleksi setelah selesai. Jika kebutuhan bisnis mengharuskan import data relasi secara bersamaan, silakan merujuk pada hasil uji performa di tabel di atas untuk merencanakan waktu import Anda secara wajar.

3.  **Mekanisme Pemicu Alur Kerja**: Tidak disarankan untuk mengaktifkan pemicu alur kerja dalam skenario import data skala besar, terutama berdasarkan dua pertimbangan berikut:
    -   Meskipun status tugas import menunjukkan 100%, tugas tersebut tidak segera berakhir. Sistem masih memerlukan waktu tambahan untuk membuat rencana eksekusi alur kerja. Selama fase ini, sistem menghasilkan rencana eksekusi alur kerja yang sesuai untuk setiap catatan yang diimport, yang akan menggunakan thread import tetapi tidak memengaruhi penggunaan data yang sudah diimport.
    -   Setelah tugas import selesai sepenuhnya, eksekusi bersamaan dari sejumlah besar alur kerja dapat membebani sumber daya sistem, memengaruhi kecepatan respons sistem secara keseluruhan dan pengalaman pengguna.

Ketiga faktor yang memengaruhi di atas akan dipertimbangkan untuk optimasi lebih lanjut di masa mendatang.

### Konfigurasi Import

#### Opsi Import - Pemicu Alur Kerja

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Anda dapat memilih apakah akan memicu alur kerja saat import. Jika opsi ini dicentang dan koleksi tersebut terikat pada alur kerja (event koleksi), import akan memicu eksekusi alur kerja untuk setiap baris.

#### Opsi Import - Identifikasi Catatan Duplikat

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Centang opsi ini dan pilih mode yang sesuai untuk mengidentifikasi dan memproses catatan duplikat selama import.

Opsi dalam konfigurasi import akan diterapkan sebagai nilai default. Administrator dapat mengontrol apakah pengunggah diizinkan untuk mengubah opsi-opsi ini (kecuali untuk opsi pemicu alur kerja).

**Pengaturan Izin Pengunggah**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Izinkan pengunggah mengubah opsi import

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Nonaktifkan pengunggah mengubah opsi import

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Deskripsi Mode

- Lewati catatan duplikat: Mengueri catatan yang ada berdasarkan konten "bidang pengidentifikasi". Jika catatan sudah ada, baris ini dilewati; jika tidak ada, diimport sebagai catatan baru.
- Perbarui catatan duplikat: Mengueri catatan yang ada berdasarkan konten "bidang pengidentifikasi". Jika catatan sudah ada, catatan ini diperbarui; jika tidak ada, diimport sebagai catatan baru.
- Hanya perbarui catatan duplikat: Mengueri catatan yang ada berdasarkan konten "bidang pengidentifikasi". Jika catatan sudah ada, catatan ini diperbarui; jika tidak ada, dilewati.

##### Bidang Pengidentifikasi

Sistem mengidentifikasi apakah suatu baris adalah catatan duplikat berdasarkan nilai bidang ini.

- [Aturan Keterkaitan](/interface-builder/actions/action-settings/linkage-rule): Menampilkan/menyembunyikan tombol secara dinamis;
- [Tombol Edit](/interface-builder/actions/action-settings/edit-button): Mengedit judul, tipe, dan ikon tombol;