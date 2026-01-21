:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Kondisi

## Pendahuluan

Mirip dengan pernyataan `if` dalam bahasa pemrograman, ini menentukan arah alur kerja selanjutnya berdasarkan hasil evaluasi kondisi yang telah dikonfigurasi.

## Membuat Node

Node Kondisi memiliki dua mode: "Lanjutkan jika benar" dan "Cabangkan jika benar/salah". Anda harus memilih salah satu mode ini saat membuat node, dan mode tersebut tidak dapat diubah setelahnya dalam konfigurasi node.

![Kondisi_Pilihan_Mode](https://static-docs.nocobase.com/3de27308c1179523d8606c66bf3a5fb4.png)

Dalam mode "Lanjutkan jika benar", ketika hasil kondisi adalah "benar", alur kerja akan terus mengeksekusi node-node berikutnya. Jika tidak, alur kerja akan berhenti dan keluar lebih awal dengan status gagal.

!["Mode Lanjutkan jika benar"](https://static-docs.nocobase.com/0f6ae1afe61d501f8eb1f6dedb3d4ad7.png)

Mode ini cocok untuk skenario di mana alur kerja tidak boleh dilanjutkan jika kondisi tidak terpenuhi. Contohnya, tombol pengiriman formulir untuk mengirimkan pesanan terikat pada "Event sebelum aksi". Jika stok produk untuk pesanan tidak mencukupi, proses pembuatan pesanan tidak boleh dilanjutkan, melainkan harus gagal dan keluar.

Dalam mode "Cabangkan jika benar/salah", node kondisi akan membuat dua cabang alur kerja berikutnya, yang masing-masing sesuai dengan hasil "benar" dan "salah" dari kondisi. Setiap cabang dapat dikonfigurasi dengan node-node berikutnya sendiri. Setelah salah satu cabang selesai dieksekusi, ia akan secara otomatis bergabung kembali ke cabang induk dari node kondisi untuk melanjutkan eksekusi node-node berikutnya.

!["Mode Cabangkan jika benar/salah"](https://static-docs.nocobase.com/974a1fcd8603629b64ffce6c55d59282.png)

Mode ini cocok untuk skenario di mana tindakan berbeda perlu dilakukan tergantung pada apakah kondisi terpenuhi atau tidak. Contohnya, memeriksa apakah suatu data ada: jika tidak ada, buat data baru; jika ada, perbarui data tersebut.

## Konfigurasi Node

### Mesin Perhitungan

Saat ini, tiga mesin didukung:

- **Dasar**: Mendapatkan hasil logis melalui perhitungan biner sederhana dan pengelompokan "DAN"/"ATAU".
- **Math.js**: Menghitung ekspresi yang didukung oleh mesin [Math.js](https://mathjs.org/) untuk mendapatkan hasil logis.
- **Formula.js**: Menghitung ekspresi yang didukung oleh mesin [Formula.js](https://formulajs.info/) untuk mendapatkan hasil logis.

Dalam ketiga jenis perhitungan ini, variabel dari konteks alur kerja dapat digunakan sebagai parameter.