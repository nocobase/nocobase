---
pkg: '@nocobase/plugin-workflow-cc'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Salinan Karbon <Badge>v1.8.2+</Badge>

## Pendahuluan

Node Salinan Karbon digunakan untuk mengirimkan konten kontekstual tertentu dari proses eksekusi alur kerja kepada pengguna yang ditentukan, untuk informasi dan peninjauan mereka. Misalnya, dalam proses persetujuan atau alur kerja lainnya, informasi relevan dapat disalin karbon kepada peserta lain agar mereka dapat tetap mengetahui perkembangan pekerjaan.

Anda dapat mengatur beberapa node Salinan Karbon dalam sebuah alur kerja. Ketika eksekusi alur kerja mencapai node tersebut, informasi relevan akan dikirimkan kepada penerima yang ditentukan.

Konten yang disalin karbon akan ditampilkan di menu "CC untuk Saya" di Pusat Tugas. Pengguna dapat melihat semua konten yang disalin karbon kepada mereka di sini. Sistem juga akan memberi tahu pengguna tentang konten salinan karbon yang belum dilihat berdasarkan status belum dibaca. Setelah melihatnya, pengguna dapat secara aktif menandainya sebagai sudah dibaca.

## Membuat Node

Pada antarmuka konfigurasi alur kerja, klik tombol plus ('+') dalam alur untuk menambahkan node "Salinan Karbon":

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Konfigurasi Node

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

Pada antarmuka konfigurasi node, Anda dapat mengatur parameter berikut:

### Penerima

Penerima adalah koleksi pengguna target untuk salinan karbon, yang bisa berupa satu atau lebih pengguna. Sumber yang dipilih dapat berupa nilai statis yang dipilih dari daftar pengguna, nilai dinamis yang ditentukan oleh variabel, atau hasil dari kueri pada koleksi pengguna.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Antarmuka Pengguna

Penerima perlu melihat konten salinan karbon di menu "CC untuk Saya" di Pusat Tugas. Anda dapat mengonfigurasi hasil dari pemicu dan node apa pun dalam konteks alur kerja sebagai blok konten.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Judul Tugas

Judul tugas adalah judul yang ditampilkan di Pusat Tugas. Anda dapat menggunakan variabel dari konteks alur kerja untuk menghasilkan judul secara dinamis.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Pusat Tugas

Pengguna dapat melihat dan mengelola semua konten yang disalin karbon kepada mereka di Pusat Tugas, serta memfilter dan melihatnya berdasarkan status baca.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Setelah melihatnya, Anda dapat menandainya sebagai sudah dibaca, dan jumlah yang belum dibaca akan berkurang.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)