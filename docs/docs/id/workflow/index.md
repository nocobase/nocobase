---
pkg: '@nocobase/plugin-workflow'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Gambaran Umum

## Pendahuluan

**Plugin alur kerja** membantu Anda mengatur proses bisnis otomatis di NocoBase, seperti persetujuan harian, sinkronisasi data, pengingat, dan tugas lainnya. Dalam sebuah alur kerja, Anda dapat mengimplementasikan logika bisnis yang kompleks hanya dengan mengonfigurasi pemicu dan node terkait melalui antarmuka visual, tanpa perlu menulis kode.

### Contoh

Setiap alur kerja diatur dengan sebuah pemicu dan beberapa node. Pemicu mewakili sebuah peristiwa dalam sistem, dan setiap node mewakili langkah eksekusi. Bersama-sama, keduanya menjelaskan logika bisnis yang perlu diproses setelah peristiwa terjadi. Gambar berikut menunjukkan proses pengurangan stok yang umum setelah pesanan produk ditempatkan:

![Contoh Alur Kerja](https://static-docs.nocobase.com/20251029222146.png)

Ketika pengguna mengirimkan pesanan, alur kerja secara otomatis memeriksa stok. Jika stok mencukupi, sistem akan mengurangi stok dan melanjutkan pembuatan pesanan; jika tidak, proses akan berakhir.

### Kasus Penggunaan

Dari perspektif yang lebih umum, alur kerja dalam aplikasi NocoBase dapat menyelesaikan masalah dalam berbagai skenario:

-   **Mengotomatiskan tugas berulang**: Tinjauan pesanan, sinkronisasi stok, pembersihan data, perhitungan skor, dan lain-lain tidak lagi memerlukan operasi manual.
-   **Mendukung kolaborasi manusia-mesin**: Atur persetujuan atau tinjauan pada node-node penting, dan lanjutkan dengan langkah-langkah berikutnya berdasarkan hasilnya.
-   **Menghubungkan ke sistem eksternal**: Kirim permintaan HTTP, terima dorongan dari layanan eksternal, dan capai otomatisasi lintas sistem.
-   **Beradaptasi cepat dengan perubahan bisnis**: Sesuaikan struktur proses, kondisi, atau konfigurasi node lainnya, dan publikasikan tanpa rilis baru.

## Instalasi

Alur kerja adalah **plugin** bawaan NocoBase. Tidak diperlukan instalasi atau konfigurasi tambahan.

## Pelajari Lebih Lanjut

-   [Memulai Cepat](./getting-started)
-   [Pemicu](./triggers/index)
-   [Node](./nodes/index)
-   [Menggunakan Variabel](./advanced/variables)
-   [Eksekusi](./advanced/executions)
-   [Manajemen Versi](./advanced/revisions)
-   [Konfigurasi Lanjutan](./advanced/options)
-   [Pengembangan Ekstensi](./development/index)