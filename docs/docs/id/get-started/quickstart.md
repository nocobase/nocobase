---
title: "Perbandingan Metode Instalasi dan Versi NocoBase"
description: "Tiga metode instalasi NocoBase: Docker (direkomendasikan), create-nocobase-app, source code Git; perbedaan versi Latest/Beta/Alpha, skenario yang sesuai dan cara upgrade."
keywords: "Instalasi NocoBase,Instalasi Docker,create-nocobase-app,Source Code Git,Latest,Beta,Alpha,Perbandingan Versi,NocoBase"
versions:
  - label: Latest (Versi Stabil)
    features: Fitur stabil, pengujian menyeluruh, hanya melakukan perbaikan bug.
    audience: Pengguna yang menginginkan pengalaman stabil, deployment lingkungan produksi.
    stability: ★★★★★
    production_recommendation: Direkomendasikan
  - label: Beta (Versi Uji Coba)
    features: Berisi fitur baru yang akan dirilis, telah melalui pengujian awal, mungkin masih ada beberapa masalah.
    audience: Pengguna yang ingin mencoba fitur baru lebih awal dan memberikan umpan balik.
    stability: ★★★★☆
    production_recommendation: Gunakan dengan hati-hati
  - label: Alpha (Versi Pengembangan)
    features: Versi dalam pengembangan, fitur terbaru tetapi mungkin tidak lengkap atau tidak stabil.
    audience: Pengguna teknis yang tertarik dengan pengembangan terdepan, kontributor.
    stability: ★★☆☆☆
    production_recommendation: Gunakan dengan hati-hati

install_methods:
  - label: Instalasi Docker (Direkomendasikan)
    features: Tidak perlu menulis kode, instalasi sederhana, cocok untuk pengalaman cepat.
    scenarios: Pengguna no-code, pengguna yang ingin deployment cepat ke server.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Tarik image terbaru dan restart container
  - label: Instalasi create-nocobase-app
    features: Kode bisnis independen, mendukung ekstensi plugin dan kustomisasi antarmuka.
    scenarios: Developer frontend/fullstack, proyek tim, pengembangan low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Gunakan yarn untuk memperbarui dependencies
  - label: Instalasi Source Code Git
    features: Mendapatkan source code terbaru langsung, dapat berkontribusi dan melakukan debug.
    scenarios: Developer teknis, pengguna yang ingin mencoba versi yang belum dirilis.
    technical_requirement: ★★★★★
    upgrade_method: Sinkronisasi pembaruan melalui alur Git
---

# Perbandingan Metode Instalasi dan Versi

Anda dapat menginstal NocoBase dengan berbagai cara.

## Perbandingan Versi

| Item | **Latest (Versi Stabil)** | **Beta (Versi Uji Coba)** | **Alpha (Versi Pengembangan)** |
|------|------------------------|----------------------|-----------------------|
| **Karakteristik** | Fitur stabil, pengujian menyeluruh, hanya melakukan perbaikan bug. | Berisi fitur baru yang akan dirilis, telah melalui pengujian awal, mungkin masih ada beberapa masalah. | Versi dalam pengembangan, fitur terbaru tetapi mungkin tidak lengkap atau tidak stabil. |
| **Target Pengguna** | Pengguna yang menginginkan pengalaman stabil, deployment lingkungan produksi. | Pengguna yang ingin mencoba fitur baru lebih awal dan memberikan umpan balik. | Pengguna teknis yang tertarik dengan pengembangan terdepan, kontributor. |
| **Stabilitas** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Direkomendasikan untuk Produksi** | Direkomendasikan | Gunakan dengan hati-hati | Gunakan dengan hati-hati |

## Perbandingan Metode Instalasi

| Item | **Instalasi Docker (Direkomendasikan)** | **Instalasi create-nocobase-app** | **Instalasi Source Code Git** |
|------|--------------------------|------------------------------|------------------|
| **Karakteristik** | Tidak perlu menulis kode, instalasi sederhana, cocok untuk pengalaman cepat. | Kode bisnis independen, mendukung ekstensi plugin dan kustomisasi antarmuka. | Mendapatkan source code terbaru langsung, dapat berkontribusi dan melakukan debug. |
| **Skenario yang Sesuai** | Pengguna no-code, pengguna yang ingin deployment cepat ke server. | Developer frontend/fullstack, proyek tim, pengembangan low-code. | Developer teknis, pengguna yang ingin mencoba versi yang belum dirilis. |
| **Persyaratan Teknis** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Cara Upgrade** | Tarik image terbaru dan restart container | Gunakan yarn untuk memperbarui dependencies | Sinkronisasi pembaruan melalui alur Git |
| **Tutorial** | [<code>Instalasi</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) | [<code>Instalasi</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) | [<code>Instalasi</code>](#) [<code>Upgrade</code>](#) [<code>Deployment</code>](#) |
