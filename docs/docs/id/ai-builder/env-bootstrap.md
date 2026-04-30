---
title: "Manajemen Lingkungan"
description: "Skill Manajemen Lingkungan bertanggung jawab atas instalasi, upgrade, stop, start, dan manajemen multi-lingkungan aplikasi NocoBase, seperti lingkungan pengembangan, lingkungan testing, lingkungan online, dan lainnya — dari 'belum memasang NocoBase' hingga 'dapat login dan menggunakan'."
keywords: "Pembangunan AI,Manajemen Lingkungan,Instalasi,Upgrade,Docker"
---

# Manajemen Lingkungan

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

## Pengantar

Skill Manajemen Lingkungan bertanggung jawab atas instalasi, upgrade, stop, start, dan manajemen multi-lingkungan aplikasi NocoBase, seperti lingkungan pengembangan, lingkungan testing, lingkungan online, dan lainnya — dari "belum memasang NocoBase" hingga "dapat login dan menggunakan".


## Cakupan Kemampuan

- Query lingkungan dan status NocoBase
- Menambahkan, menghapus, mengganti lingkungan instance NocoBase
- Instalasi, upgrade, stop, start instance NocoBase


## Contoh Prompt

### Skenario A: Query Status Lingkungan
Mode Prompt
```
Saat ini ada instance NocoBase apa saja? Saya sekarang berada di lingkungan mana?
```
Mode Baris Perintah
```
nb env list
```

### Skenario B: Menambahkan Lingkungan yang Sudah Ada
:::tip Prasyarat

Perlu memiliki instance NocoBase, baik lokal maupun remote

:::

Mode Prompt
```
Bantu saya menambahkan lingkungan dev http://localhost:13000
```
Mode Baris Perintah
```
nb env add <dev> --base-url http://localhost:13000/api
```
### Skenario C: Memasang Instance NocoBase Baru
:::tip Prasyarat

Cara paling mudah dan cepat memasang NocoBase adalah menggunakan mode Docker, sebelum eksekusi pastikan komputer Anda sudah memasang lingkungan yang diperlukan: Node, Docker, Yarn

:::

Mode Prompt
```
Bantu saya memasang NocoBase
```
Mode Baris Perintah
```
nb init --ui
```

### Skenario D: Upgrade Instance

Mode Prompt
```
Bantu saya mengupgrade instance saat ini ke versi terbaru
```
Mode Baris Perintah
```
nb upgrade
```

### Skenario E: Stop Instance

Mode Prompt
```
Bantu saya menghentikan instance saat ini
```
Mode Baris Perintah
```
nb app stop
```

### Skenario E: Start Instance

Mode Prompt
```
Bantu saya menjalankan instance saat ini
```
Mode Baris Perintah
```
nb app start
```

## Pertanyaan Umum

**Apa yang harus dilakukan jika setelah instalasi tidak dapat menjalankan kemampuan terkait Pembangunan AI?**

Saat ini semua kemampuan Pembangunan AI ada di image alpha, konfirmasi apakah image ini yang digunakan untuk instalasi, jika tidak dapat upgrade ke image ini.

**Apa yang harus dilakukan jika startup Docker melaporkan konflik port?**

Ganti dengan port lain (misalnya `port=14000`), atau hentikan terlebih dahulu proses yang menggunakan port 13000. Tahap pre-check Skill akan secara aktif memberi tahu konflik port.

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
