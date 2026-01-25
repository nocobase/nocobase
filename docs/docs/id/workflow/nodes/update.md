:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperbarui Data

Digunakan untuk memperbarui data dalam sebuah **koleksi** yang memenuhi kondisi tertentu.

Bagian **koleksi** dan penetapan nilai bidang (field) sama dengan node "Buat Catatan Baru". Perbedaan utama pada node "Memperbarui Data" adalah penambahan kondisi filter dan kebutuhan untuk memilih mode pembaruan. Selain itu, hasil dari node "Memperbarui Data" akan mengembalikan jumlah baris data yang berhasil diperbarui. Ini hanya dapat dilihat di riwayat eksekusi dan tidak dapat digunakan sebagai variabel di node selanjutnya.

## Membuat Node

Pada antarmuka konfigurasi **alur kerja**, klik tombol plus ("+") di dalam alur untuk menambahkan node "Memperbarui Data":

![更新数据_添加](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Konfigurasi Node

![更新节点_节点配置](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Koleksi

Pilih **koleksi** tempat data perlu diperbarui.

### Mode Pembaruan

Ada dua mode pembaruan:

*   **Pembaruan Massal**: Tidak akan memicu event **koleksi** untuk setiap catatan yang diperbarui. Mode ini menawarkan kinerja yang lebih baik dan cocok untuk operasi pembaruan data dalam jumlah besar.
*   **Pembaruan Satu per Satu**: Akan memicu event **koleksi** untuk setiap catatan yang diperbarui. Namun, mode ini dapat menyebabkan masalah kinerja pada volume data yang besar dan harus digunakan dengan hati-hati.

Pilihan mode ini biasanya bergantung pada data target yang akan diperbarui dan apakah event **alur kerja** lain perlu dipicu. Jika Anda memperbarui satu catatan berdasarkan kunci utama, "Pembaruan Satu per Satu" direkomendasikan. Jika Anda memperbarui beberapa catatan berdasarkan kondisi, "Pembaruan Massal" direkomendasikan.

### Kondisi Filter

Mirip dengan kondisi filter pada kueri **koleksi** biasa, Anda dapat menggunakan variabel konteks dari **alur kerja**.

### Nilai Bidang

Mirip dengan penetapan nilai bidang pada node "Buat Catatan Baru", Anda dapat menggunakan variabel konteks dari **alur kerja** atau mengisi nilai statis secara manual.

Catatan: Data yang diperbarui oleh node "Memperbarui Data" dalam **alur kerja** tidak secara otomatis menangani data "Terakhir Dimodifikasi Oleh". Anda perlu mengonfigurasi nilai bidang ini sendiri sesuai kebutuhan.

## Contoh

Sebagai contoh, ketika sebuah "Artikel" baru dibuat, Anda perlu secara otomatis memperbarui bidang "Jumlah Artikel" di **koleksi** "Kategori Artikel". Ini dapat dicapai dengan menggunakan node "Memperbarui Data":

![更新节点_示例_节点配置](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Setelah **alur kerja** dipicu, bidang "Jumlah Artikel" pada **koleksi** "Kategori Artikel" akan secara otomatis diperbarui menjadi jumlah artikel saat ini + 1.