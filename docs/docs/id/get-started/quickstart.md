---
versions:
  - label: Terbaru (Stabil)
    features: Fitur stabil, telah diuji dengan baik, hanya perbaikan bug.
    audience: Pengguna yang menginginkan pengalaman stabil dan penerapan di lingkungan produksi.
    stability: ★★★★★
    production_recommendation: Direkomendasikan
  - label: Beta (Uji Coba)
    features: Mencakup fitur-fitur yang akan datang, telah melalui pengujian awal, mungkin ada beberapa masalah kecil.
    audience: Pengguna yang ingin mencoba fitur baru lebih awal dan memberikan masukan.
    stability: ★★★★☆
    production_recommendation: Gunakan dengan hati-hati
  - label: Alpha (Pengembangan)
    features: Versi dalam pengembangan, fitur terbaru namun mungkin belum lengkap atau tidak stabil.
    audience: Pengguna teknis dan kontributor yang tertarik pada pengembangan mutakhir.
    stability: ★★☆☆☆
    production_recommendation: Gunakan dengan hati-hati

install_methods:
  - label: Instalasi Docker (Direkomendasikan)
    features: Tidak perlu menulis kode, instalasi mudah, cocok untuk uji coba cepat.
    scenarios: Pengguna tanpa kode, pengguna yang ingin segera menerapkan ke server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Tarik image terbaru dan mulai ulang kontainer.
  - label: Instalasi create-nocobase-app
    features: Kode aplikasi independen, mendukung ekstensi plugin dan kustomisasi antarmuka.
    scenarios: Pengembang front-end/full-stack, proyek tim, pengembangan low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Perbarui dependensi menggunakan yarn.
  - label: Instalasi Kode Sumber Git
    features: Dapatkan kode sumber terbaru secara langsung, cocok untuk kontribusi dan debugging.
    scenarios: Pengembang teknis, pengguna yang ingin mencoba versi yang belum dirilis.
    technical_requirement: ★★★★★
    upgrade_method: Sinkronkan pembaruan melalui proses Git.

---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Perbandingan Metode Instalasi dan Versi

Anda dapat menginstal NocoBase dengan berbagai cara.

## Perbandingan Versi

| Item | **Terbaru (Stabil)** | **Beta (Uji Coba)** | **Alpha (Pengembangan)** |
|------|------------------------|----------------------|-----------------------|
| **Fitur** | Fitur stabil, telah diuji dengan baik, hanya perbaikan bug. | Mencakup fitur-fitur yang akan datang, telah melalui pengujian awal, mungkin ada beberapa masalah kecil. | Versi dalam pengembangan, fitur terbaru namun mungkin belum lengkap atau tidak stabil. |
| **Audiens** | Pengguna yang menginginkan pengalaman stabil dan penerapan di lingkungan produksi. | Pengguna yang ingin mencoba fitur baru lebih awal dan memberikan masukan. | Pengguna teknis dan kontributor yang tertarik pada pengembangan mutakhir. |
| **Stabilitas** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Direkomendasikan untuk Produksi** | Direkomendasikan | Gunakan dengan hati-hati | Gunakan dengan hati-hati |

## Perbandingan Metode Instalasi

| Item | **Instalasi Docker (Direkomendasikan)** | **Instalasi create-nocobase-app** | **Instalasi Kode Sumber Git** |
|------|--------------------------|------------------------------|------------------|
| **Fitur** | Tidak perlu menulis kode, instalasi mudah, cocok untuk uji coba cepat. | Kode aplikasi independen, mendukung ekstensi plugin dan kustomisasi antarmuka. | Dapatkan kode sumber terbaru secara langsung, cocok untuk kontribusi dan debugging. |
| **Skenario Penggunaan** | Pengguna tanpa kode, pengguna yang ingin segera menerapkan ke server. | Pengembang front-end/full-stack, proyek tim, pengembangan low-code. | Pengembang teknis, pengguna yang ingin mencoba versi yang belum dirilis. |
| **Persyaratan Teknis** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Metode Peningkatan** | Tarik image terbaru dan mulai ulang kontainer. | Perbarui dependensi menggunakan yarn. | Sinkronkan pembaruan melalui proses Git. |
| **Tutorial** | [<code>Instalasi</code>](#) [<code>Peningkatan</code>](#) [<code>Penerapan</code>](#) | [<code>Instalasi</code>](#) [<code>Peningkatan</code>](#) [<code>Penerapan</code>](#) | [<code>Instalasi</code>](#) [<code>Peningkatan</code>](#) [<code>Penerapan</code>](#) |