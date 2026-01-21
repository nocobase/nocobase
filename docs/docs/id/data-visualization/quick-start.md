:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mulai Cepat

Panduan ini akan memandu Anda mengonfigurasi sebuah bagan dari awal menggunakan fitur-fitur penting. Kemampuan opsional akan dibahas di bab-bab selanjutnya.

Prasyarat:
- Sebuah sumber data dan koleksi (tabel) telah diatur, dan Anda memiliki izin baca.

## Menambahkan Blok Bagan

Di desainer halaman, klik “Tambahkan blok”, pilih “Bagan”, lalu tambahkan sebuah blok bagan.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Setelah ditambahkan, klik “Konfigurasi” di kanan atas blok.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Panel konfigurasi bagan akan terbuka di sebelah kanan. Panel ini terdiri dari tiga bagian: Kueri Data, Opsi Bagan, dan Peristiwa.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Mengonfigurasi Kueri Data

Di panel Kueri Data, Anda dapat mengonfigurasi sumber data, filter kueri, dan opsi terkait lainnya.

- Pertama, pilih sumber data dan koleksi
  - Di panel “Kueri Data”, pilih sumber data dan koleksi sebagai dasar kueri.
  - Jika koleksi tidak dapat dipilih atau kosong, periksa terlebih dahulu apakah koleksi tersebut sudah dibuat dan apakah pengguna saat ini memiliki izin.

- Mengonfigurasi Ukuran (Measures)
  - Pilih satu atau lebih bidang numerik sebagai ukuran.
  - Atur agregasi untuk setiap ukuran: Sum / Count / Avg / Max / Min.

- Mengonfigurasi Dimensi (Dimensions)
  - Pilih satu atau lebih bidang sebagai dimensi pengelompokan (tanggal, kategori, wilayah, dll.).
  - Untuk bidang tanggal/waktu, Anda dapat mengatur format (misalnya, `YYYY-MM`, `YYYY-MM-DD`) agar tampilan tetap konsisten.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

Opsi lain seperti filter, pengurutan, dan paginasi bersifat opsional.

## Menjalankan Kueri dan Melihat Data

- Klik “Jalankan Kueri” untuk mengambil data dan menampilkan pratinjau bagan secara langsung di sisi kiri.
- Anda dapat mengklik “Lihat Data” untuk melihat pratinjau hasil data yang dikembalikan; Anda dapat beralih antara format Tabel dan JSON. Klik lagi untuk menutup pratinjau data.
- Jika hasil data kosong atau tidak sesuai harapan, kembali ke panel kueri dan periksa izin koleksi, pemetaan bidang untuk ukuran/dimensi, dan tipe data.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Mengonfigurasi Opsi Bagan

Di panel Opsi Bagan, Anda dapat memilih jenis bagan dan mengonfigurasi opsinya.

- Pertama, pilih jenis bagan (garis/area, kolom/batang, pai/donat, sebar, dll.).
- Selesaikan pemetaan bidang inti:
  - Garis/area/kolom/batang: `xField` (dimensi), `yField` (ukuran), `seriesField` (seri, opsional)
  - Pai/donat: `Category` (dimensi kategorikal), `Value` (ukuran)
  - Sebar: `xField`, `yField` (dua ukuran atau dimensi)
  - Untuk pengaturan bagan lainnya, Anda dapat merujuk ke dokumentasi ECharts: [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Setelah mengklik “Jalankan Kueri” sebelumnya, pemetaan bidang akan otomatis selesai secara default. Jika Anda mengubah dimensi/ukuran, harap konfirmasi ulang pemetaannya.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Pratinjau dan Simpan

Perubahan konfigurasi akan otomatis memperbarui pratinjau secara *real-time* di sisi kiri, namun perubahan tersebut belum benar-benar tersimpan sampai Anda mengklik tombol “Simpan”.

Anda juga dapat menggunakan tombol-tombol di bagian bawah:

- Pratinjau: Perubahan konfigurasi akan otomatis memperbarui pratinjau secara *real-time*. Anda juga dapat mengklik tombol “Pratinjau” di bagian bawah untuk memicu pembaruan secara manual.
- Batalkan: Jika Anda tidak ingin menyimpan perubahan konfigurasi saat ini, Anda dapat mengklik tombol “Batalkan” di bagian bawah, atau menyegarkan halaman, untuk membatalkan perubahan ini dan kembali ke status terakhir yang disimpan.
- Simpan: Klik “Simpan” untuk benar-benar menyimpan semua konfigurasi kueri dan bagan saat ini ke dalam basis data, sehingga berlaku untuk semua pengguna.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Tips Umum

- Konfigurasi minimal yang dapat digunakan: Pilih sebuah koleksi + setidaknya satu ukuran; disarankan untuk menambahkan dimensi agar tampilan dapat dikelompokkan.
- Untuk dimensi tanggal, disarankan untuk mengatur format yang sesuai (misalnya, untuk statistik bulanan pilih `YYYY-MM`) untuk menghindari sumbu X yang tidak berkesinambungan atau berantakan.
- Jika kueri kosong atau bagan tidak ditampilkan:
  - Periksa koleksi/izin dan pemetaan bidang.
  - Gunakan “Lihat Data” untuk mengonfirmasi apakah nama kolom dan tipe data cocok dengan pemetaan bagan.
- Pratinjau bersifat sementara: Ini hanya untuk validasi dan penyesuaian. Perubahan hanya akan berlaku secara resmi setelah Anda mengklik “Simpan”.