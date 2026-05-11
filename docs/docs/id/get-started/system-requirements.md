---
title: "Persyaratan Sistem NocoBase"
description: "Persyaratan perangkat keras deployment NocoBase: minimum 1 core 2GB per node tunggal, rekomendasi 2 core 4GB, konfigurasi mode cluster, saran deployment terpisah untuk database/Redis dan layanan pihak ketiga lainnya."
keywords: "Persyaratan Sistem,Persyaratan Hardware,CPU,Memori,Deployment Node Tunggal,Deployment Cluster,Lingkungan Produksi,NocoBase"
---

# Persyaratan Sistem

Persyaratan sistem yang dijelaskan di sini adalah untuk **layanan aplikasi NocoBase itu sendiri**, hanya mencakup sumber daya komputasi dan memori yang dibutuhkan oleh proses aplikasi. **Tidak termasuk layanan pihak ketiga yang menjadi dependensi**, termasuk tetapi tidak terbatas pada:

- API Gateway / Reverse Proxy
- Layanan Database (seperti MySQL, PostgreSQL)
- Layanan Cache (seperti Redis)
- Message Queue, Object Storage, dan middleware lainnya

Kecuali untuk skenario verifikasi fungsi atau eksperimental, **sangat disarankan untuk men-deploy layanan pihak ketiga di atas secara terpisah** pada server atau container yang terpisah, atau langsung menggunakan layanan cloud terkait.

Konfigurasi sistem dan perencanaan kapasitas untuk layanan terkait harus dievaluasi dan dioptimalkan secara terpisah berdasarkan **volume data aktual, beban bisnis, dan skala konkurensi**.

## Mode Deployment Node Tunggal

Mode deployment node tunggal mengacu pada layanan aplikasi NocoBase yang hanya berjalan pada satu instans server atau container.

### Persyaratan Hardware Minimum

| Sumber Daya | Persyaratan |
|---|---|
| CPU | 1 core |
| Memori | 2 GB |

**Skenario yang Sesuai**:

- Bisnis mikro
- Verifikasi fungsi (POC)
- Lingkungan pengembangan / pengujian
- Skenario dengan hampir tidak ada akses konkuren

:::info{title=Tips}

- Konfigurasi ini hanya menjamin sistem dapat berjalan, tidak menjamin pengalaman performa.
- Ketika volume data atau permintaan konkuren bertambah, sumber daya sistem dapat dengan cepat menjadi bottleneck.
- Untuk skenario **pengembangan source code, pengembangan plugin, atau build dan deployment dari source code**, disarankan untuk menyediakan **lebih dari 4 GB memori bebas** untuk memastikan proses instalasi dependensi, kompilasi, dan build berjalan lancar.

:::

### Persyaratan Hardware yang Direkomendasikan

| Sumber Daya | Konfigurasi yang Direkomendasikan |
|---|---|
| CPU | 2 core |
| Memori | ≥ 4 GB |

**Skenario yang Sesuai**:

Cocok untuk lingkungan produksi bisnis kecil hingga menengah dengan konkurensi rendah.

:::info{title=Tips}

- Pada konfigurasi ini, sistem dapat memenuhi operasi backend manajemen rutin dan beban bisnis ringan.
- Ketika kompleksitas bisnis, akses konkuren, atau tugas backend bertambah, pertimbangkan untuk meningkatkan spesifikasi hardware atau bermigrasi ke mode cluster.

:::

## Mode Cluster

Cocok untuk skenario bisnis berskala menengah hingga besar dengan konkurensi tinggi, dan dapat meningkatkan ketersediaan sistem dan throughput bisnis melalui penskalaan horizontal (untuk detail, lihat: [Mode Cluster](/cluster-mode)).

### Persyaratan Hardware Node

Pada mode cluster, konfigurasi hardware untuk setiap node aplikasi (Pod / instans) disarankan sama dengan mode deployment node tunggal.

**Konfigurasi Minimum Node Tunggal:**

- CPU: 1 core
- Memori: 2 GB

**Konfigurasi yang Direkomendasikan Node Tunggal:**

- CPU: 2 core
- Memori: 4 GB

### Perencanaan Jumlah Node

- Jumlah node dalam cluster dapat diskalakan sesuai kebutuhan (2–N)
- Jumlah node yang sebenarnya dibutuhkan tergantung pada:
  - Volume akses konkuren
  - Kompleksitas logika bisnis
  - Beban tugas backend dan pemrosesan asinkron
  - Kapasitas respons layanan dependensi eksternal

Disarankan dalam lingkungan produksi:

- Sesuaikan ukuran node secara dinamis berdasarkan metrik monitoring (CPU, memori, latensi permintaan, dll.)
- Sediakan redundansi sumber daya tertentu untuk mengantisipasi fluktuasi traffic
