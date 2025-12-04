:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Percabangan Multi-kondisi <Badge>v2.0.0+</Badge>

## Pendahuluan

Mirip dengan pernyataan `switch / case` atau `if / else if` dalam bahasa pemrograman. Sistem akan mengevaluasi beberapa kondisi yang telah dikonfigurasi secara berurutan. Setelah satu kondisi terpenuhi, alur kerja akan menjalankan cabang yang sesuai dan melewati pemeriksaan kondisi berikutnya. Jika tidak ada kondisi yang terpenuhi, cabang "Lainnya" akan dieksekusi.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") pada alur untuk menambahkan node "Percabangan Multi-kondisi":

![Membuat Node Percabangan Multi-kondisi](https://static-docs.nocobase.com/20251123222134.png)

## Manajemen Cabang

### Cabang Default

Setelah dibuat, node ini secara default menyertakan dua cabang:

1.  **Cabang Kondisi**: Untuk mengonfigurasi kondisi penilaian spesifik.
2.  **Cabang Lainnya**: Dimasuki ketika tidak ada cabang kondisi yang terpenuhi; tidak memerlukan konfigurasi kondisi.

Klik tombol "Tambah cabang" di bawah node untuk menambahkan lebih banyak cabang kondisi.

![20251123222540](https://static-docs.nocobase.com/20251123222540.png)

### Menambah Cabang

Setelah mengklik "Tambah cabang", cabang baru akan ditambahkan sebelum cabang "Lainnya".

![20251123222805](https://static-docs.nocobase.com/20251123222805.png)

### Menghapus Cabang

Ketika ada beberapa cabang kondisi, klik ikon tempat sampah di sebelah kanan cabang untuk menghapusnya. Jika hanya tersisa satu cabang kondisi, cabang tersebut tidak dapat dihapus.

![20251123223127](https://static-docs.nocobase.com/20251123223127.png)

:::info{title=Catatan}
Menghapus cabang juga akan menghapus semua node di dalamnya; harap berhati-hati saat melakukan tindakan ini.

Cabang "Lainnya" adalah cabang bawaan dan tidak dapat dihapus.
:::

## Konfigurasi Node

### Konfigurasi Kondisi

Klik nama kondisi di bagian atas cabang untuk mengedit detail kondisi spesifik:

![20251123223352](https://static-docs.nocobase.com/20251123223352.png)

#### Label Kondisi

Mendukung label kustom. Setelah diisi, label ini akan ditampilkan sebagai nama kondisi dalam diagram alur. Jika tidak dikonfigurasi (atau dibiarkan kosong), secara default akan ditampilkan sebagai "Kondisi 1", "Kondisi 2", dan seterusnya, secara berurutan.

![20251123224209](https://static-docs.nocobase.com/20251123224209.png)

#### Mesin Perhitungan

Saat ini mendukung tiga mesin:

-   **Dasar**: Menggunakan perbandingan logis sederhana (misalnya, sama dengan, berisi) dan kombinasi "DAN"/"ATAU" untuk menentukan hasil.
-   **Math.js**: Mendukung perhitungan ekspresi menggunakan sintaks [Math.js](https://mathjs.org/).
-   **Formula.js**: Mendukung perhitungan ekspresi menggunakan sintaks [Formula.js](https://formulajs.info/) (mirip dengan rumus Excel).

Ketiga mode ini mendukung penggunaan variabel konteks alur kerja sebagai parameter.

### Ketika Tidak Ada Kondisi yang Terpenuhi

Di panel konfigurasi node, Anda dapat mengatur tindakan selanjutnya ketika tidak ada kondisi yang terpenuhi:

![20251123224348](https://static-docs.nocobase.com/20251123224348.png)

*   **Akhiri alur kerja dengan kegagalan (Default)**: Menandai status alur kerja sebagai gagal dan menghentikan proses.
*   **Lanjutkan eksekusi node berikutnya**: Setelah node saat ini selesai dieksekusi, alur kerja akan melanjutkan eksekusi node berikutnya.

:::info{title=Catatan}
Terlepas dari metode penanganan yang dipilih, ketika tidak ada kondisi yang terpenuhi, alur akan terlebih dahulu masuk ke cabang "Lainnya" untuk mengeksekusi node di dalamnya.
:::

## Riwayat Eksekusi

Dalam riwayat eksekusi alur kerja, node Percabangan Multi-kondisi mengidentifikasi hasil penilaian setiap kondisi menggunakan warna yang berbeda:

-   **Hijau**: Kondisi terpenuhi; masuk ke cabang ini untuk dieksekusi.
-   **Merah**: Kondisi tidak terpenuhi (atau terjadi kesalahan perhitungan); cabang ini dilewati.
-   **Biru**: Penilaian tidak dieksekusi (dilewati karena kondisi sebelumnya sudah terpenuhi).

![20251123225455](https://static-docs.nocobase.com/20251123225455.png)

Jika kesalahan konfigurasi menyebabkan pengecualian perhitungan kondisi, selain ditampilkan berwarna merah, mengarahkan kursor mouse ke nama kondisi akan menampilkan informasi kesalahan spesifik:

![20251123231014](https://static-docs.nocobase.com/20251123231014.png)

Ketika terjadi pengecualian perhitungan kondisi, node Percabangan Multi-kondisi akan berakhir dengan status "Error" dan tidak akan melanjutkan eksekusi node berikutnya.