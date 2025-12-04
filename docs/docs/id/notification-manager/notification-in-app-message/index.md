---
pkg: '@nocobase/plugin-notification-in-app-message'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Notifikasi: Pesan Dalam Aplikasi

## Pendahuluan

Memungkinkan pengguna untuk menerima notifikasi pesan secara real-time langsung di dalam aplikasi NocoBase.

## Instalasi

Plugin ini adalah plugin bawaan, sehingga tidak perlu instalasi tambahan.

## Menambahkan Saluran Pesan Dalam Aplikasi

Buka Manajemen Notifikasi, klik tombol Tambah, lalu pilih Pesan Dalam Aplikasi.
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Setelah memasukkan nama dan deskripsi saluran, klik Kirim.
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

Saluran baru akan muncul di daftar.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Contoh Skenario Penggunaan

Untuk membantu Anda memahami lebih baik cara menggunakan pesan dalam aplikasi, berikut adalah contoh "Tindak Lanjut Prospek Pemasaran".

Bayangkan tim Anda sedang menjalankan kampanye pemasaran besar yang bertujuan untuk melacak respons dan kebutuhan dari calon klien. Dengan menggunakan pesan dalam aplikasi, Anda dapat:

**Membuat Saluran Notifikasi**: Pertama, di Manajemen Notifikasi, konfigurasikan saluran pesan dalam aplikasi bernama "Marketing Clue" untuk memastikan anggota tim dapat dengan jelas mengidentifikasi tujuan saluran tersebut.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Mengonfigurasi alur kerja**: Buat sebuah alur kerja yang secara otomatis memicu notifikasi ketika ada prospek pemasaran baru. Anda dapat menambahkan node notifikasi ke dalam alur kerja, memilih saluran "Marketing Clue" yang telah Anda buat sebelumnya, dan mengonfigurasi konten pesan sesuai kebutuhan. Contoh:

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Menerima Notifikasi Real-Time**: Setelah alur kerja terpicu, semua personel yang relevan akan menerima notifikasi secara real-time, memastikan tim dapat merespons dan bertindak dengan cepat.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Manajemen dan Pelacakan Pesan**: Pesan dalam aplikasi akan dikelompokkan berdasarkan nama saluran pengirimnya. Anda dapat memfilter pesan berdasarkan status sudah dibaca atau belum dibaca untuk melihat informasi penting dengan cepat. Mengklik tombol "Lihat" akan mengarahkan Anda ke halaman tautan yang telah dikonfigurasi untuk tindakan lebih lanjut.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)