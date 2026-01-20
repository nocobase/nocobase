:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Hapus Data

Digunakan untuk menghapus data dari sebuah koleksi yang memenuhi kondisi tertentu.

Penggunaan dasar node hapus mirip dengan node perbarui, hanya saja node hapus tidak memerlukan penetapan nilai kolom. Anda hanya perlu memilih koleksi dan kondisi filter. Hasil dari node hapus akan mengembalikan jumlah baris data yang berhasil dihapus, yang hanya dapat dilihat di riwayat eksekusi dan tidak dapat digunakan sebagai variabel di node selanjutnya.

:::info{title=Catatan}
Saat ini, node hapus tidak mendukung penghapusan satu per satu; ini melakukan penghapusan secara massal. Oleh karena itu, ini tidak akan memicu peristiwa lain untuk setiap data yang dihapus.
:::

## Buat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") di alur untuk menambahkan node "Hapus data":

![Buat node hapus data](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Konfigurasi Node

![Node hapus_Konfigurasi Node](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Koleksi

Pilih koleksi tempat data akan dihapus.

### Kondisi Filter

Mirip dengan kondisi filter untuk kueri koleksi biasa, Anda dapat menggunakan variabel konteks alur kerja.

## Contoh

Misalnya, untuk membersihkan data pesanan historis yang dibatalkan dan tidak valid secara berkala, Anda dapat menggunakan node hapus:

![Node hapus_Contoh_Konfigurasi Node](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Alur kerja akan dipicu secara berkala dan akan menghapus semua data pesanan historis yang dibatalkan dan tidak valid.