---
title: "Manajemen Lokalisasi"
description: "Manajemen lokalisasi: menerjemahkan menu, tabel data, field, teks plugin, sinkronisasi entries, otomatis membuat entries, edit terjemahan, publish terjemahan, mendukung switch multi-bahasa, plugin built-in."
keywords: "manajemen lokalisasi,terjemahan,multi-bahasa,i18n,sinkronisasi entries,publish terjemahan,manajemen sistem,NocoBase"
---

# Manajemen Lokalisasi

## Pengantar

Plugin manajemen lokalisasi digunakan untuk mengelola dan mengimplementasikan resource lokalisasi NocoBase. Anda dapat menerjemahkan menu, tabel data, field, dan semua plugin sistem, untuk menyesuaikan dengan bahasa dan budaya region tertentu.

## Instalasi

Plugin ini adalah plugin built-in, tidak perlu instalasi tambahan.

## Penggunaan

### Aktivasi Plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Masuk ke Halaman Manajemen Lokalisasi

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Sinkronisasi Entries Terjemahan

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Saat ini mendukung sinkronisasi konten berikut:

- Language pack lokal sistem dan plugin
- Judul tabel data, judul field, dan label option field
- Judul menu

Setelah sinkronisasi selesai, sistem akan menampilkan list semua entries yang dapat diterjemahkan untuk bahasa saat ini.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Tips}
Modul yang berbeda mungkin memiliki entries dengan teks asli yang sama, perlu diterjemahkan secara terpisah.
:::

### Otomatis Membuat Entries

Saat editing halaman, teks kustom di setiap block akan otomatis membuat entries yang sesuai, dan secara sinkron menghasilkan konten terjemahan untuk bahasa saat ini.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Tips}
Saat mendefinisikan teks dalam kode, perlu menentukan ns (namespace) secara manual, contohnya: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Mengedit Konten Terjemahan

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Publish Terjemahan

Setelah terjemahan selesai, perlu mengklik tombol "Publish" agar perubahan berlaku.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Menerjemahkan Bahasa Lain

Aktifkan bahasa lain di "System Settings", contohnya Simplified Chinese.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Beralih ke environment bahasa tersebut.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Sinkronisasi entries.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Terjemahkan dan publish.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>
