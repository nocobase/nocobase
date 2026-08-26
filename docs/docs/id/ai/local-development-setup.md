---
title: Menyiapkan pengembangan lokal
description: Menyiapkan lingkungan sistem operasi lokal untuk NocoBase CLI dan aplikasi NocoBase, mencakup Windows WSL, macOS, Linux, Node.js, Yarn, dan Docker.
---

# Menyiapkan pengembangan lokal

Halaman ini membantu menyiapkan lingkungan lokal untuk NocoBase CLI dan aplikasi NocoBase. Cocok untuk pengembangan lokal, evaluasi fitur, serta AI Agent yang menginstal atau mengelola NocoBase di komputer Anda.

Jika Anda akan melakukan deployment untuk pengguna nyata, lihat dulu [persyaratan sistem produksi](../get-started/system-requirements.md).

## Windows: gunakan WSL

Untuk setup lokal di Windows, kami merekomendasikan menempatkan lingkungan pengembangan utama di WSL 2: instal Node.js, Yarn, dan NocoBase CLI di distribusi Linux dalam WSL, lalu jalankan perintah terkait dari terminal WSL.

WSL lebih dekat dengan lingkungan Linux yang umum digunakan untuk deployment NocoBase. Ini memberi beberapa manfaat:

- Instalasi dependensi, build, startup, dan pemeriksaan log lebih mirip dengan alur server sebenarnya
- Setelah WSL integration Docker Desktop diaktifkan, Anda bisa menjalankan perintah `docker` langsung di dalam WSL
- Masalah tambahan dari format path Windows native, izin file, symlink, dan build dependensi native dapat dikurangi
- Lebih cocok untuk alur kerja AI Agent. Saat agent menjalankan `nb`, `yarn`, atau `docker`, ia menggunakan path Linux, sintaks shell, dan runtime yang konsisten, sehingga troubleshooting lebih langsung

Jika lingkungan pengembangan lokal berbasis WSL belum siap, lihat [Menyiapkan lingkungan pengembangan lokal di Windows dengan WSL](./windows-wsl.md).

Kombinasi yang direkomendasikan:

- Windows 10 / 11
- WSL 2
- Ubuntu LTS
- Node.js >= 22
- Yarn 1.x
- Docker Desktop, jika Anda berencana menginstal NocoBase dengan Docker

Biasanya, Node.js, Yarn, dan NocoBase CLI semuanya diinstal di dalam WSL. Jika menggunakan Docker Desktop, aktifkan WSL integration di Docker Desktop agar WSL dapat mengakses Docker.

Periksa lingkungan:

```bash
node -v
yarn -v
docker version
```

:::tip Catatan

NocoBase juga dapat diinstal di Windows Server. WSL direkomendasikan di sini untuk pengembangan lokal dan setup AI Agent di komputer pribadi. Ini bukan berarti Windows Server tidak dapat digunakan untuk deployment.

:::

## macOS

Di macOS, Anda dapat langsung menggunakan terminal lokal.

Siapkan:

- Node.js >= 22
- Yarn 1.x
- Docker Desktop, OrbStack, atau Colima, jika Anda berencana menginstal NocoBase dengan Docker

Periksa lingkungan:

```bash
node -v
yarn -v
docker version
```

Jika tidak menggunakan Docker, Anda dapat melewati `docker version`.

## Linux

Linux dapat langsung digunakan sebagai lingkungan pengembangan lokal. Ubuntu, Debian, atau distribusi umum lainnya direkomendasikan.

Siapkan:

- Node.js >= 22
- Yarn 1.x
- Docker Engine, jika Anda berencana menginstal NocoBase dengan Docker

Periksa lingkungan:

```bash
node -v
yarn -v
docker version
```

Jika tidak menggunakan Docker, Anda dapat melewati `docker version`.

## Langkah berikutnya

- [Perbandingan metode instalasi dan versi](../get-started/quickstart.md) — Bandingkan dulu metode instalasi dan channel versi
- [Instal aplikasi NocoBase](./install-nocobase-app.md) — Inisialisasi app lokal dengan NocoBase CLI
- [Panduan integrasi AI Agent](./quick-start.mdx) — Izinkan AI Agent terhubung dan mengoperasikan NocoBase
