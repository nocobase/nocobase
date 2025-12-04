---
pkg: '@nocobase/plugin-workflow-variable'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Variabel

## Pendahuluan

Anda dapat mendeklarasikan variabel dalam sebuah alur kerja atau menetapkan nilai ke variabel yang sudah dideklarasikan. Ini biasanya digunakan untuk menyimpan data sementara dalam alur kerja.

## Membuat Node

Pada antarmuka konfigurasi alur kerja, klik tombol plus ("+") di alur kerja untuk menambahkan node "Variabel":

![Menambahkan Node Variabel](https://static-docs.nocobase.com/53b1e48e777bfff7f2a08271526ef3ee.png)

## Mengonfigurasi Node

### Mode

Node variabel mirip dengan variabel dalam pemrograman; node ini harus dideklarasikan terlebih dahulu sebelum dapat digunakan dan diberi nilai. Oleh karena itu, saat membuat node variabel, Anda perlu memilih modenya. Ada dua mode yang dapat dipilih:

![Memilih Mode](https://static-docs.nocobase.com/49d8b7b501de6faef6f303262aa14550.png)

- Mendeklarasikan variabel baru: Membuat variabel baru.
- Menetapkan nilai ke variabel yang sudah ada: Menetapkan nilai ke variabel yang telah dideklarasikan sebelumnya dalam alur kerja, yang setara dengan memodifikasi nilai variabel tersebut.

Ketika node yang dibuat adalah node variabel pertama dalam alur kerja, Anda hanya dapat memilih mode deklarasi, karena belum ada variabel yang tersedia untuk penetapan nilai.

Saat Anda memilih untuk menetapkan nilai ke variabel yang sudah dideklarasikan, Anda juga perlu memilih variabel target, yaitu node tempat variabel tersebut dideklarasikan:

![Memilih variabel yang akan diberi nilai](https://static-docs.nocobase.com/1ce8911548d7347e693d8cc8ac1953eb.png)

### Nilai

Nilai variabel dapat berupa tipe apa pun. Ini bisa berupa konstanta, seperti string, angka, nilai boolean, atau tanggal, atau bisa juga variabel lain dari alur kerja.

Dalam mode deklarasi, menetapkan nilai variabel setara dengan memberinya nilai awal.

![Mendeklarasikan nilai awal](https://static-docs.nocobase.com/4ce2c50896565ad537343013758c6a4.png)

Dalam mode penetapan nilai, menetapkan nilai variabel setara dengan memodifikasi nilai variabel target yang sudah dideklarasikan menjadi nilai baru. Penggunaan selanjutnya akan mengambil nilai baru ini.

![Menetapkan variabel pemicu ke variabel yang sudah dideklarasikan](https://static-docs.nocobase.com/858bae180712ad279ae6a964a77a7659.png)

## Menggunakan Nilai Variabel

Pada node-node selanjutnya setelah node variabel, Anda dapat menggunakan nilai variabel dengan memilih variabel yang sudah dideklarasikan dari grup "Variabel Node". Misalnya, dalam node kueri, gunakan nilai variabel sebagai kondisi kueri:

![Menggunakan nilai variabel sebagai kondisi filter kueri](https://static-docs.nocobase.com/1ca91c295254ff85999a1751499f14bc.png)

## Contoh

Skenario yang lebih berguna untuk node variabel adalah dalam cabang, di mana nilai-nilai baru dihitung atau digabungkan dengan nilai-nilai sebelumnya (mirip dengan `reduce`/`concat` dalam pemrograman), dan kemudian digunakan setelah cabang berakhir. Berikut adalah contoh penggunaan cabang perulangan dan node variabel untuk menggabungkan string penerima.

Pertama, buat alur kerja yang dipicu oleh koleksi yang aktif saat data "Artikel" diperbarui, dan muat data relasi "Penulis" terkait (untuk mendapatkan penerima):

![Mengonfigurasi Pemicu](https://static-docs.nocobase.com/93327530a93c695c637d74cdfdcd5cde.png)

Kemudian, buat node variabel untuk menyimpan string penerima:

![Node variabel penerima](https://static-docs.nocobase.com/d26fa4a7e7ee4f34e0d8392a51c6666e.png)

Selanjutnya, buat node cabang perulangan untuk mengulang penulis artikel dan menggabungkan informasi penerima mereka ke dalam variabel penerima:

![Mengulang penulis dalam artikel](https://static-docs.nocobase.com/083fe62c943c17a643dc47ec2872e07c.png)

Di dalam cabang perulangan, pertama buat node perhitungan untuk menggabungkan penulis saat ini dengan string penulis yang sudah tersimpan:

![Menggabungkan string penerima](https://static-docs.nocobase.com/5d21a990162f32cb8818d27b16fd1bcd.png)

Setelah node perhitungan, buat node variabel lain. Pilih mode penetapan nilai, pilih node variabel penerima sebagai target penetapan nilai, dan pilih hasil dari node perhitungan sebagai nilainya:

![Menetapkan string penerima yang digabungkan ke node penerima](https://static-docs.nocobase.com/fc40ed95dd9b61d924b7ca11b23f9482.png)

Dengan demikian, setelah cabang perulangan selesai, variabel penerima akan menyimpan string penerima dari semua penulis artikel. Kemudian, setelah perulangan, Anda dapat menggunakan node Permintaan HTTP untuk memanggil API pengiriman email, meneruskan nilai variabel penerima sebagai parameter penerima ke API tersebut:

![Mengirim email ke penerima melalui node permintaan](https://static-docs.nocobase.com/37f71aa1a63e172bcb2dce10a250947e.png)

Dengan demikian, fitur pengiriman email massal sederhana telah diimplementasikan menggunakan perulangan dan node variabel.