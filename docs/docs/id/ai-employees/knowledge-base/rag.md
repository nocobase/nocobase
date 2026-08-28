---
pkg: "@nocobase/plugin-ai-knowledge-base"
title: "Retrieval-Augmented Generation (RAG)"
description: "Aktifkan RAG untuk Karyawan AI, konfigurasi Knowledge Base, Retrieval strategy, Top K, dan Score, serta kelola akses basis pengetahuan melalui peran pengguna."
keywords: "RAG,retrieval-augmented generation,pencarian basis pengetahuan,Retrieval strategy,izin basis pengetahuan,Top K,NocoBase"
---

# Pencarian RAG

## Pengantar

Di NocoBase, **RAG (Retrieval-Augmented Generation)** memungkinkan Karyawan AI mengambil konten yang relevan dari basis pengetahuan sebelum menjawab pertanyaan.

Basis pengetahuan yang dapat digunakan Karyawan AI ditentukan oleh konfigurasi `Knowledge Base` milik Karyawan AI dan izin basis pengetahuan dari peran pengguna saat ini. Hanya basis pengetahuan yang termasuk dalam kedua cakupan tersebut yang akan dicari.

## Mengonfigurasi basis pengetahuan Karyawan AI

Buka halaman konfigurasi `AI employees`, pilih Karyawan AI yang akan diaktifkan RAG, lalu klik `Edit`. Di panel pengeditan, buka tab `Knowledge Base` dan aktifkan `Enable`.

![](https://static-docs.nocobase.com/ai-employee-knowledge-base-settings-202608171620.png)

Pengaturan yang tersedia adalah:

- `Knowledge Base` — Opsional. Jika dibiarkan kosong, Karyawan AI akan mencari di semua basis pengetahuan aktif yang dapat diakses oleh peran pengguna saat ini. Jika Anda memilih basis pengetahuan, pencarian hanya dilakukan pada basis yang dipilih dan dapat diakses oleh pengguna
- `Retrieval strategy` — Menentukan kapan pencarian basis pengetahuan dijalankan:
  - `Retrieve on demand` — Karyawan AI mengambil konten hanya ketika menentukan bahwa pertanyaan saat ini memerlukannya. Karyawan AI baru menggunakan strategi ini secara default, dan strategi ini direkomendasikan untuk sebagian besar kasus
  - `Automatically retrieve for every question` — Pencarian dijalankan sebelum setiap pertanyaan pengguna dikirim ke Karyawan AI. Gunakan opsi ini jika setiap percakapan bergantung pada konten basis pengetahuan
- `Knowledge Base Prompt` — Menentukan cara konten hasil pencarian diberikan kepada Karyawan AI. `{knowledgeBaseData}` adalah placeholder tetap; jangan hapus atau ubah
- `Top K` — Jumlah maksimum hasil basis pengetahuan yang dikembalikan pada setiap pencarian. Rentangnya 1–100, dan nilai default-nya 3
- `Score` — Skor kemiripan minimum yang harus dicapai sebuah hasil. Rentangnya 0–1, dan nilai default-nya 0,6. Nilai yang lebih tinggi memberikan konten yang lebih relevan, tetapi dapat mengurangi jumlah hasil

Klik `Submit` untuk menyimpan konfigurasi.

## Mengonfigurasi izin basis pengetahuan

Memilih basis pengetahuan untuk Karyawan AI tidak otomatis memberikan akses kepada semua pengguna. Buka `Users & Permissions / Roles & Permissions`, pilih peran yang diberikan kepada pengguna, lalu buka `Permissions / Knowledge bases`.

Pilih `Available` untuk setiap basis pengetahuan yang boleh diakses oleh peran tersebut. Untuk otomatis memberikan akses kepada peran ini atas basis pengetahuan yang dibuat di kemudian hari, pilih `New knowledge bases are allowed by default`.

![](https://static-docs.nocobase.com/knowledge-base-role-permissions-202608171620.png)

:::warning Catatan

Cakupan basis pengetahuan yang tersedia untuk Karyawan AI adalah irisan antara konfigurasi `Knowledge Base` dan izin peran pengguna saat ini. Basis pengetahuan yang tidak diizinkan akan otomatis dikecualikan.

:::

## Ketika pengguna tidak memiliki akses ke basis pengetahuan

Jika basis pengetahuan diaktifkan untuk Karyawan AI, tetapi cakupan yang dikonfigurasi tidak beririsan dengan izin peran pengguna saat ini, Karyawan AI terlebih dahulu menjawab dengan informasi yang tidak bergantung pada basis pengetahuan. Setelah itu, Karyawan AI menambahkan pemberitahuan yang jelas bahwa konten basis pengetahuan tidak digunakan karena pengguna tidak memiliki akses dan menyarankan pengguna menghubungi administrator.

![](https://static-docs.nocobase.com/ai-employee-no-knowledge-base-access-side-panel-202608171653.png)

Jika pengguna dapat mengakses setidaknya satu basis pengetahuan tetapi pertanyaan saat ini tidak menghasilkan konten yang relevan, pemberitahuan tidak memiliki izin tidak akan ditampilkan.

## Tautan terkait

- [Basis Pengetahuan](./knowledge-base/index.md) — Membuat dan memelihara basis pengetahuan yang digunakan untuk pencarian RAG
- [Peran dan izin](../../users-permissions/acl/permissions.md) — Mengatur akses sistem, menu, dan data untuk setiap peran
