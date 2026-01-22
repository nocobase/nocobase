:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Manajemen Rilis

## Pendahuluan

Dalam aplikasi nyata, untuk memastikan keamanan data dan stabilitas aplikasi, kita biasanya perlu mendeploy beberapa lingkungan, seperti lingkungan pengembangan, lingkungan pra-rilis, dan lingkungan produksi. Dokumen ini akan memberikan contoh dua proses pengembangan tanpa kode yang umum dan menjelaskan secara rinci cara menerapkan manajemen rilis di NocoBase.

## Instalasi

Tiga plugin ini esensial untuk manajemen rilis. Pastikan semua plugin berikut sudah diaktifkan.

### Variabel Lingkungan

- Plugin bawaan, diinstal dan diaktifkan secara default.
- Menyediakan konfigurasi dan manajemen terpusat untuk variabel lingkungan dan kunci rahasia, digunakan untuk penyimpanan data sensitif, penggunaan kembali data konfigurasi, isolasi konfigurasi berbasis lingkungan, dll. ([Lihat Dokumentasi](#)).

### Manajer Cadangan

- Plugin ini hanya tersedia di edisi Profesional atau yang lebih tinggi ([Pelajari lebih lanjut](https://www.nocobase.com/en/commercial)).
- Menyediakan fungsi pencadangan dan pemulihan, mendukung pencadangan terjadwal, memastikan keamanan data dan pemulihan cepat. ([Lihat Dokumentasi](../backup-manager/index.mdx)).

### Manajer Migrasi

- Plugin ini hanya tersedia di edisi Profesional atau yang lebih tinggi ([Pelajari lebih lanjut](https://www.nocobase.com/en/commercial)).
- Digunakan untuk memigrasikan konfigurasi aplikasi dari satu lingkungan aplikasi ke lingkungan aplikasi lainnya ([Lihat Dokumentasi](../migration-manager/index.md)).

## Proses Pengembangan Tanpa Kode yang Umum

### Lingkungan Pengembangan Tunggal, Rilis Satu Arah

Pendekatan ini cocok untuk proses pengembangan yang sederhana. Terdapat satu lingkungan pengembangan, satu lingkungan pra-rilis, dan satu lingkungan produksi. Perubahan mengalir dari lingkungan pengembangan ke lingkungan pra-rilis dan akhirnya di-deploy ke lingkungan produksi. Dalam proses ini, hanya lingkungan pengembangan yang dapat memodifikasi konfigurasi—lingkungan pra-rilis maupun produksi tidak mengizinkan modifikasi.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

Saat mengonfigurasi aturan migrasi, pilih aturan **"Timpa Prioritas"** untuk tabel bawaan di inti dan plugin jika diperlukan; untuk yang lainnya, Anda dapat mempertahankan pengaturan default jika tidak ada persyaratan khusus.

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

### Lingkungan Pengembangan Berganda, Rilis Gabungan

Pendekatan ini cocok untuk kolaborasi multi-orang atau skenario proyek yang kompleks. Beberapa lingkungan pengembangan paralel dapat digunakan secara independen, dan semua perubahan digabungkan ke dalam satu lingkungan pra-rilis untuk pengujian dan verifikasi sebelum di-deploy ke produksi. Dalam proses ini, juga hanya lingkungan pengembangan yang dapat memodifikasi konfigurasi—lingkungan pra-rilis maupun produksi tidak mengizinkan modifikasi.

![20250107103829](https://static-docs.nocobase.com/20250107103829.png)

Saat mengonfigurasi aturan migrasi, pilih aturan **"Sisipkan atau Perbarui Prioritas"** untuk tabel bawaan di inti dan plugin jika diperlukan; untuk yang lainnya, Anda dapat mempertahankan pengaturan default jika tidak ada persyaratan khusus.

![20250105194942](https://static-docs.nocobase.com/20250105194942.png)

## Rollback

Sebelum menjalankan migrasi, sistem secara otomatis membuat cadangan aplikasi saat ini. Jika migrasi gagal atau hasilnya tidak sesuai harapan, Anda dapat melakukan rollback dan pemulihan melalui [Manajer Cadangan](../backup-manager/index.mdx).

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)