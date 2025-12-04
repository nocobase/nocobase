:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Akhiri Alur Kerja

Ketika node ini dieksekusi, ia akan segera mengakhiri alur kerja yang sedang berjalan dengan status yang dikonfigurasi pada node tersebut. Ini biasanya digunakan untuk mengontrol alur berdasarkan logika tertentu, yaitu keluar dari alur kerja saat ini ketika kondisi tertentu terpenuhi dan menghentikan eksekusi proses selanjutnya. Ini mirip dengan instruksi `return` dalam bahasa pemrograman, yang digunakan untuk keluar dari fungsi yang sedang berjalan.

## Menambahkan Node

Di antarmuka konfigurasi alur kerja, klik tombol plus ("+") pada alur untuk menambahkan node "Akhiri Alur Kerja":

![结束流程_添加](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Konfigurasi Node

![结束流程_节点配置](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### Status Akhir

Status akhir akan memengaruhi status akhir eksekusi alur kerja. Ini dapat dikonfigurasi sebagai "Berhasil" atau "Gagal". Ketika eksekusi alur kerja mencapai node ini, ia akan segera keluar dengan status yang dikonfigurasi.

:::info{title=Catatan}
Ketika digunakan dalam alur kerja tipe "Peristiwa sebelum tindakan" (Before action event), ini akan mencegat permintaan yang memulai tindakan tersebut. Untuk detailnya, silakan lihat [Penggunaan "Peristiwa sebelum tindakan"](../triggers/pre-action).

Selain mencegat permintaan yang memulai tindakan, konfigurasi status akhir juga akan memengaruhi status umpan balik dalam "pesan respons" untuk jenis alur kerja ini.
:::