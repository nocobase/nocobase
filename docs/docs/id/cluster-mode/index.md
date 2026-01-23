:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mode Klaster

## Pendahuluan

NocoBase mendukung menjalankan aplikasi dalam mode klaster mulai dari versi v1.6.0. Ketika aplikasi berjalan dalam mode klaster, ia dapat meningkatkan kinerja dalam menangani akses konkuren dengan menggunakan beberapa instans dan mode multi-inti.

## Arsitektur Sistem

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Klaster Aplikasi**: Sebuah klaster yang terdiri dari beberapa instans aplikasi NocoBase. Klaster ini dapat di-deploy pada beberapa server atau dijalankan sebagai beberapa proses dalam mode multi-inti pada satu server.
*   **Basis Data**: Menyimpan data aplikasi. Dapat berupa basis data *single-node* atau basis data terdistribusi.
*   **Penyimpanan Bersama**: Digunakan untuk menyimpan berkas dan data aplikasi, mendukung akses baca/tulis dari beberapa instans.
*   **Middleware**: Meliputi komponen seperti *cache*, sinyal sinkronisasi, antrean pesan, dan kunci terdistribusi untuk mendukung komunikasi dan koordinasi dalam klaster aplikasi.
*   **Penyeimbang Beban**: Bertanggung jawab untuk mendistribusikan permintaan klien ke instans yang berbeda dalam klaster aplikasi, serta melakukan pemeriksaan kesehatan dan *failover*.

## Pelajari Lebih Lanjut

Dokumen ini hanya memperkenalkan konsep dasar dan komponen mode klaster NocoBase. Untuk detail *deployment* spesifik dan opsi konfigurasi lebih lanjut, silakan lihat dokumen-dokumen berikut:

- Deployment
    - [Persiapan](./preparations)
    - [Deployment Kubernetes](./kubernetes)
    - [Operasi](./operations)
- Lanjutan
    - [Pemecahan Layanan](./services-splitting)
- [Referensi Pengembangan](./development)