---
pkg: "@nocobase/plugin-ai"
title: "Buat Karyawan AI Baru"
description: "Buat Karyawan AI kustom: konfigurasi Profile, Role setting prompt sistem, Permission Skills, Basis Pengetahuan, definisikan persona role dan batas kemampuan."
keywords: "Buat Karyawan AI Baru,Buat Karyawan AI,Role setting,Prompt Sistem,Konfigurasi Skills,NocoBase"
---

# Buat Karyawan AI Baru

Jika Karyawan AI bawaan tidak dapat memenuhi kebutuhan Anda, Anda dapat membuat dan menyesuaikan Karyawan AI sendiri.

## Mulai Membuat

Masuk ke halaman manajemen `AI employees`, klik `New AI employee`.

## Konfigurasi Informasi Dasar

Pada tab `Profile` konfigurasi:

- `Username`: Identifier unik.
- `Nickname`: Nama tampilan.
- `Position`: Deskripsi posisi.
- `Avatar`: Avatar karyawan.
- `Bio`: Pengantar.
- `About me`: Prompt sistem.
- `Greeting message`: Pesan sambutan sesi.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## Pengaturan Role (Role setting)

Pada tab `Role setting` konfigurasi prompt sistem (System Prompt) karyawan. Konten ini akan mendefinisikan identitas, tujuan, batas kerja, dan gaya output karyawan dalam dialog.

Disarankan setidaknya berisi:

- Positioning role dan cakupan tanggung jawab.
- Prinsip pemrosesan tugas dan struktur jawaban.
- Hal yang dilarang, batas informasi, dan gaya bahasa.

Dapat menyisipkan variabel sesuai kebutuhan (seperti Pengguna saat ini, role saat ini, bahasa saat ini, waktu), agar prompt secara otomatis beradaptasi dengan konteks dalam sesi yang berbeda.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## Konfigurasi Skills dan Pengetahuan

Pada tab `Skills` konfigurasi Permission Skills; jika kemampuan Basis Pengetahuan sudah diaktifkan, dapat melanjutkan konfigurasi di tab terkait Basis Pengetahuan.

## Selesaikan Pembuatan

Klik `Submit` untuk menyelesaikan pembuatan.
