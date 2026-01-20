:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kalkulasi

Node Kalkulasi dapat mengevaluasi sebuah ekspresi, dan hasilnya akan disimpan dalam hasil node terkait untuk digunakan oleh node-node berikutnya. Ini adalah alat untuk menghitung, memproses, dan mengubah data. Sampai batas tertentu, ini dapat menggantikan fungsi pemanggilan fungsi pada suatu nilai dan penetapan ke variabel dalam bahasa pemrograman.

## Membuat Node

Pada antarmuka konfigurasi alur kerja, klik tombol plus (“+”) di alur untuk menambahkan node “Kalkulasi”:

![Calculation Node_Add](https://static-docs.nocobase.com/58a455540d26945251cd143eb4b16579.png)

## Konfigurasi Node

![Calculation Node_Configuration](https://static-docs.nocobase.com/6a155de3f6a883d8cd1881b2d9c33874.png)

### Mesin Kalkulasi

Mesin kalkulasi menentukan sintaks yang didukung oleh ekspresi. Mesin kalkulasi yang saat ini didukung adalah [Math.js](https://mathjs.org/) dan [Formula.js](https://formulajs.info/). Setiap mesin memiliki banyak fungsi umum bawaan dan metode operasi data. Untuk penggunaan spesifik, Anda dapat merujuk ke dokumentasi resminya.

:::info{title=Tips}
Perlu diperhatikan bahwa mesin yang berbeda memiliki perbedaan dalam akses indeks array. Indeks Math.js dimulai dari `1`, sedangkan Formula.js dimulai dari `0`.
:::

Selain itu, jika Anda memerlukan penggabungan string sederhana, Anda dapat langsung menggunakan “Template String”. Mesin ini akan mengganti variabel dalam ekspresi dengan nilai yang sesuai, lalu mengembalikan string yang digabungkan.

### Ekspresi

Ekspresi adalah representasi string dari formula kalkulasi, yang dapat terdiri dari variabel, konstanta, operator, dan fungsi yang didukung. Anda dapat menggunakan variabel dari konteks alur, seperti hasil dari node sebelumnya dari node kalkulasi, atau variabel lokal dari sebuah loop.

Jika input ekspresi tidak sesuai dengan sintaks, kesalahan akan ditampilkan dalam konfigurasi node. Jika variabel tidak ada atau tipe tidak cocok selama eksekusi, atau jika fungsi yang tidak ada digunakan, node kalkulasi akan berhenti lebih awal dengan status kesalahan.

## Contoh

### Menghitung Total Harga Pesanan

Biasanya, sebuah pesanan mungkin berisi beberapa item, dan setiap item memiliki harga serta kuantitas yang berbeda. Total harga pesanan perlu dihitung dari jumlah perkalian harga dan kuantitas semua item. Setelah memuat daftar detail pesanan (untuk dataset relasi banyak-ke-banyak), Anda dapat menggunakan node kalkulasi untuk menghitung total harga pesanan:

![Calculation Node_Example_Configuration](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Di sini, fungsi `SUMPRODUCT` dari Formula.js dapat menghitung jumlah perkalian setiap baris dari dua array dengan panjang yang sama, dan totalnya akan menghasilkan total harga pesanan.