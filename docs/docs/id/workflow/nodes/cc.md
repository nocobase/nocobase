---
pkg: '@nocobase/plugin-workflow-cc'
---

:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/workflow/nodes/cc).
:::

# CC <Badge>v1.8.2+</Badge>

## Pendahuluan

Node CC digunakan untuk mengirimkan konten kontekstual tertentu dari proses eksekusi Workflow kepada pengguna yang ditentukan, untuk informasi dan peninjauan mereka. Misalnya, dalam proses persetujuan atau alur kerja lainnya, informasi relevan dapat di-CC kepada peserta lain agar mereka dapat tetap mengetahui perkembangan pekerjaan.

Anda dapat mengatur beberapa node CC dalam sebuah Workflow. Ketika eksekusi Workflow mencapai node tersebut, informasi relevan akan dikirimkan kepada penerima yang ditentukan.

Konten yang disalin karbon akan ditampilkan di menu "CC untuk Saya" di Pusat Tugas. Pengguna dapat melihat semua konten yang disalin karbon kepada mereka di sini. Sistem juga akan memberi tahu pengguna tentang konten salinan karbon yang belum dilihat berdasarkan status belum dibaca. Setelah melihatnya, pengguna dapat secara aktif menandainya sebagai sudah dibaca.

## Membuat Node

Pada antarmuka konfigurasi Workflow, klik tombol plus ('+') dalam alur untuk menambahkan node "CC":

![抄送_添加](https://static-docs.nocobase.com/20250710222842.png)

## Konfigurasi Node

![节点配置](https://static-docs.nocobase.com/20250710224041.png)

Pada antarmuka konfigurasi node, Anda dapat mengatur parameter berikut:

### Penerima

Penerima adalah koleksi pengguna target untuk salinan karbon, yang bisa berupa satu atau lebih pengguna. Sumber yang dipilih dapat berupa nilai statis yang dipilih dari daftar pengguna, nilai dinamis yang ditentukan oleh variabel, atau hasil dari kueri pada Collection pengguna.

![接收者配置](https://static-docs.nocobase.com/20250710224421.png)

### Antarmuka Pengguna

Penerima perlu melihat konten salinan karbon di menu "CC untuk Saya" di Pusat Tugas. Anda dapat mengonfigurasi hasil dari pemicu dan node apa pun dalam konteks Workflow sebagai blok konten.

![用户界面](https://static-docs.nocobase.com/20250710225400.png)

### Kartu Tugas <Badge>2.0+</Badge>

Dapat digunakan untuk mengonfigurasi kartu tugas dalam daftar "CC Me" di Workflow Center.

![20260213010947](https://static-docs.nocobase.com/20260213010947.png)

Anda dapat secara bebas mengonfigurasi bidang bisnis yang ingin ditampilkan dalam kartu (kecuali Association Field).

Setelah tugas CC Workflow dibuat, kartu tugas kustom akan terlihat di daftar Workflow Center:

![20260214124325](https://static-docs.nocobase.com/20260214124325.png)

### Judul Tugas

Judul tugas adalah judul yang ditampilkan di Workflow Center. Anda dapat menggunakan variabel dari konteks Workflow untuk menghasilkan judul secara dinamis.

![任务标题](https://static-docs.nocobase.com/20250710225603.png)

## Workflow Center

Pengguna dapat melihat dan mengelola semua konten yang di-CC kepada mereka di Workflow Center, serta memfilter dan melihatnya berdasarkan status baca.

![20250710232932](https://static-docs.nocobase.com/20250710232932.png)

![20250710233032](https://static-docs.nocobase.com/20250710233032.png)

Setelah melihatnya, Anda dapat menandainya sebagai sudah dibaca, dan jumlah yang belum dibaca akan berkurang.

![20250710233102](https://static-docs.nocobase.com/20250710233102.png)