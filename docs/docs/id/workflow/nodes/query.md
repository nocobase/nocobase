:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kueri Data

Digunakan untuk mengueri dan mengambil catatan data dari sebuah koleksi yang memenuhi kondisi tertentu.

Anda dapat mengonfigurasi kueri untuk satu atau beberapa catatan. Hasil kueri dapat digunakan sebagai variabel di node-node selanjutnya. Saat mengueri beberapa catatan, hasilnya adalah sebuah array. Jika hasil kueri kosong, Anda dapat memilih apakah akan melanjutkan eksekusi node-node selanjutnya.

## Membuat Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") pada alur untuk menambahkan node "Kueri Data":

![Menambahkan Node Kueri Data](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Konfigurasi Node

![Konfigurasi Node Kueri](https://static-docs.nocobase.com/20240520131324.png)

### Koleksi

Pilih koleksi tempat Anda ingin mengueri data.

### Tipe Hasil

Tipe hasil dibagi menjadi "Satu Catatan" dan "Beberapa Catatan":

-   Satu Catatan: Hasilnya adalah sebuah objek, yaitu hanya catatan pertama yang cocok, atau `null`.
-   Beberapa Catatan: Hasilnya akan berupa sebuah array yang berisi catatan-catatan yang cocok dengan kondisi. Jika tidak ada catatan yang cocok, maka akan menjadi array kosong. Anda dapat memprosesnya satu per satu menggunakan node Loop.

### Kondisi Filter

Mirip dengan kondisi filter dalam kueri koleksi biasa, Anda dapat menggunakan variabel konteks alur kerja.

### Urutkan

Saat mengueri satu atau beberapa catatan, Anda dapat menggunakan aturan pengurutan untuk mengontrol hasil yang diinginkan. Misalnya, untuk mengueri catatan terbaru, Anda dapat mengurutkan berdasarkan bidang "Waktu Pembuatan" secara menurun.

### Paginasi

Ketika kumpulan hasil mungkin sangat besar, Anda dapat menggunakan paginasi untuk mengontrol jumlah hasil kueri. Misalnya, untuk mengueri 10 catatan terbaru, Anda dapat mengurutkan berdasarkan bidang "Waktu Pembuatan" secara menurun, lalu mengatur paginasi menjadi 1 halaman dengan 10 catatan.

### Penanganan Hasil Kosong

Dalam mode satu catatan, jika tidak ada data yang memenuhi kondisi, hasil kueri akan menjadi `null`. Dalam mode beberapa catatan, hasilnya akan menjadi array kosong (`[]`). Anda dapat memilih apakah akan mencentang "Keluar dari alur kerja saat hasil kueri kosong". Jika dicentang, dan hasil kueri kosong, node-node selanjutnya tidak akan dieksekusi, dan alur kerja akan keluar lebih awal dengan status gagal.