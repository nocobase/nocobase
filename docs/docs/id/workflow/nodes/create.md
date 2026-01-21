:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menambah Data

Digunakan untuk menambah data baru ke sebuah koleksi.

Nilai-nilai kolom untuk data baru dapat menggunakan variabel dari konteks alur kerja. Untuk menetapkan nilai ke kolom relasi, Anda dapat langsung mereferensikan variabel data yang sesuai dalam konteks, yang bisa berupa objek atau nilai kunci asing. Jika tidak menggunakan variabel, Anda perlu mengisi nilai kunci asing secara manual. Untuk beberapa nilai kunci asing dalam relasi banyak, nilai-nilai tersebut harus dipisahkan dengan koma.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") di alur untuk menambahkan node "Menambah Data":

![Membuat node Menambah Data](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Konfigurasi Node

![Node Menambah Data_Contoh_Konfigurasi Node](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Koleksi

Pilih koleksi tempat Anda ingin menambah data baru.

### Nilai Kolom

Tetapkan nilai ke kolom-kolom koleksi. Anda dapat menggunakan variabel dari konteks alur kerja atau mengisi nilai statis secara manual.

:::info{title="Catatan"}
Data yang dibuat oleh node "Menambah Data" dalam alur kerja tidak secara otomatis menangani data pengguna seperti "Dibuat oleh" dan "Terakhir diubah oleh". Anda perlu mengonfigurasi nilai-nilai untuk kedua kolom ini sendiri sesuai kebutuhan.
:::

### Pra-muat Data Relasi

Jika kolom-kolom data baru menyertakan kolom relasi dan Anda ingin menggunakan data relasi yang sesuai di langkah-langkah alur kerja berikutnya, Anda dapat mencentang kolom relasi yang sesuai di konfigurasi pra-muat. Dengan cara ini, setelah data baru dibuat, data relasi yang sesuai akan secara otomatis dimuat dan disimpan bersama dalam data hasil node.

## Contoh

Misalnya, ketika data di koleksi "Artikel" dibuat atau diperbarui, data "Versi Artikel" perlu dibuat secara otomatis untuk mencatat riwayat perubahan artikel. Anda dapat menggunakan node "Menambah Data" untuk mencapai hal ini:

![Node Menambah Data_Contoh_Konfigurasi Alur Kerja](https://static-docs.nocobase.com/dfd4820d49c145fa331883fc09c9161f.png)

![Node Menambah Data_Contoh_Konfigurasi Node](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Setelah mengaktifkan alur kerja dengan konfigurasi ini, ketika data di koleksi "Artikel" diubah, data "Versi Artikel" akan secara otomatis dibuat untuk mencatat riwayat perubahan artikel.