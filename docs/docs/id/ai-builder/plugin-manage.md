---
title: "Manajemen Plugin"
description: "Skill Manajemen Plugin digunakan untuk melihat, mengaktifkan, dan menonaktifkan Plugin NocoBase."
keywords: "Pembangunan AI,Manajemen Plugin,Aktivasi Plugin,Deaktivasi Plugin"
---

# Manajemen Plugin

:::tip Prasyarat

Sebelum membaca halaman ini, harap pastikan Anda telah memasang NocoBase CLI dan menyelesaikan inisialisasi sesuai [Mulai Cepat Pembangunan AI](./index.md).

:::

## Pengantar

Skill Manajemen Plugin digunakan untuk melihat, mengaktifkan, dan menonaktifkan Plugin NocoBase — ia akan secara otomatis mengenali lingkungan lokal atau remote, memilih backend eksekusi yang sesuai, dan memastikan operasi berhasil melalui validasi readback.


## Cakupan Kemampuan

- Melihat direktori Plugin dan status aktivasi.
- Mengaktifkan Plugin.
- Menonaktifkan Plugin.

## Contoh Prompt

### Skenario A: Melihat Status Plugin

Mode Prompt
```
Plugin apa saja yang ada di lingkungan saat ini
```
Mode Baris Perintah
```
nb plugin list
```

Akan mencantumkan semua Plugin beserta status aktivasi, informasi versi.

![Melihat Status Plugin](https://static-docs.nocobase.com/20260417150510.png)

### Skenario B: Mengaktifkan Plugin

Mode Prompt
```
Bantu saya mengaktifkan Plugin lokalisasi
```
Mode Baris Perintah
```
nb plugin enable <lokalisasi>
```

Skill akan mengaktifkan secara berurutan, setelah setiap aktivasi melakukan validasi readback untuk mengonfirmasi `enabled=true`.

![Mengaktifkan Plugin](https://static-docs.nocobase.com/20260417153023.png)

### Skenario C: Menonaktifkan Plugin

Mode Prompt
```
Bantu saya menonaktifkan Plugin lokalisasi
```
Mode Baris Perintah
```
nb plugin disable  <lokalisasi>
```

![Menonaktifkan Plugin](https://static-docs.nocobase.com/20260417173442.png)

## Pertanyaan Umum

**Apa yang harus dilakukan jika Plugin tidak berlaku setelah diaktifkan?**

Sebagian Plugin perlu restart aplikasi setelah diaktifkan baru berlaku. Skill akan memberi tahu apakah perlu restart pada hasilnya.

## Tautan Terkait

- [Ikhtisar Pembangunan AI](./index.md) — Ikhtisar dan metode instalasi semua Skill Pembangunan AI
- [NocoBase CLI](../ai/quick-start.md) — Tool baris perintah untuk memasang dan mengelola NocoBase
