:::tip{title="Pemberitahuan Terjemahan AI"}
Dokumen ini diterjemahkan oleh AI. Untuk informasi yang akurat, silakan merujuk ke [versi bahasa Inggris](/get-started/system-requirements).
:::

# Persyaratan Sistem

Persyaratan sistem yang dijelaskan dalam dokumen ini berlaku **hanya untuk layanan aplikasi NocoBase itu sendiri**, dan mencakup sumber daya komputasi serta memori yang diperlukan oleh proses aplikasi. Persyaratan ini **tidak mencakup layanan pihak ketiga yang bergantung**, termasuk namun tidak terbatas pada:

- API gateway / reverse proxy
- Layanan database (seperti MySQL, PostgreSQL)
- Layanan cache (seperti Redis)
- Middleware seperti antrean pesan (message queue), penyimpanan objek, dll.

Kecuali untuk validasi fungsi atau skenario eksperimental, **sangat disarankan untuk menyebarkan (deploy) layanan pihak ketiga di atas secara terpisah** pada server atau kontainer khusus, atau langsung menggunakan layanan cloud terkait.

Konfigurasi sistem dan perencanaan kapasitas untuk layanan terkait harus dievaluasi dan dioptimalkan secara terpisah berdasarkan **volume data aktual, beban bisnis, dan skala konkurensi**.

## Mode Deployment Node Tunggal

Mode deployment node tunggal berarti layanan aplikasi NocoBase hanya berjalan pada satu server atau instans kontainer.

### Persyaratan Perangkat Keras Minimum

| Sumber Daya | Persyaratan |
|---|---|
| CPU | 1 Core |
| Memori | 2 GB |

**Skenario penggunaan**:

- Bisnis mikro
- Validasi fungsi (POC)
- Lingkungan pengembangan / pengujian
- Skenario dengan hampir tidak ada akses konkuren

:::info{title=Tips}

- Konfigurasi ini hanya menjamin sistem dapat berjalan, tidak menjamin pengalaman performa.
- Ketika volume data atau permintaan konkuren meningkat, sumber daya sistem dapat dengan cepat menjadi hambatan (bottleneck).
- Untuk skenario **pengembangan kode sumber, pengembangan plugin, atau membangun dan menyebarkan dari kode sumber**, disarankan untuk menyediakan **memori kosong minimal 4 GB** untuk memastikan proses instalasi dependensi, kompilasi, dan pembangunan selesai dengan sukses.

:::

### Persyaratan Perangkat Keras yang Direkomendasikan

| Sumber Daya | Konfigurasi Rekomendasi |
|---|---|
| CPU | 2 Core |
| Memori | ≥ 4 GB |

**Skenario penggunaan**:

Cocok untuk bisnis skala kecil hingga menengah dan lingkungan produksi dengan sedikit konkurensi.

:::info{title=Tips}

- Dengan konfigurasi ini, sistem dapat menangani operasi administrasi rutin dan beban bisnis ringan.
- Ketika kompleksitas bisnis, akses konkuren, atau tugas latar belakang meningkat, pertimbangkan untuk meningkatkan spesifikasi perangkat keras atau bermigrasi ke mode klaster.

:::

## Mode Klaster

Cocok untuk skenario bisnis skala menengah hingga besar dengan konkurensi tinggi, di mana skalabilitas horizontal dapat digunakan untuk meningkatkan ketersediaan sistem dan throughput bisnis (untuk detailnya, silakan merujuk ke: [Mode Klaster](/cluster-mode)).

### Persyaratan Perangkat Keras Node

Dalam mode klaster, konfigurasi perangkat keras yang disarankan untuk setiap node aplikasi (Pod / instans) sama dengan mode deployment node tunggal.

**Konfigurasi minimum per node:**

- CPU: 1 Core
- Memori: 2 GB

**Konfigurasi rekomendasi per node:**

- CPU: 2 Core
- Memori: 4 GB

### Perencanaan Jumlah Node

- Jumlah node dalam klaster dapat diperluas sesuai kebutuhan (2–N).
- Jumlah node aktual yang dibutuhkan bergantung pada:
  - Volume akses konkuren
  - Kompleksitas logika bisnis
  - Tugas latar belakang dan beban pemrosesan asinkron
  - Kemampuan respons layanan dependensi eksternal

Saran untuk lingkungan produksi:

- Sesuaikan skala node secara dinamis berdasarkan metrik pemantauan (CPU, memori, latensi permintaan, dll.).
- Sediakan redundansi sumber daya tertentu untuk menangani lonjakan lalu lintas.