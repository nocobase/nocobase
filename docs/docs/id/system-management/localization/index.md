---
title: "Manajemen Lokalisasi"
description: "Manajemen lokalisasi: menerjemahkan menu, tabel data, field, teks plugin, sinkronisasi entries, otomatis membuat entries, edit terjemahan, publish terjemahan, mendukung switch multi-bahasa, plugin built-in."
keywords: "manajemen lokalisasi,terjemahan,multi-bahasa,i18n,sinkronisasi entries,publish terjemahan,manajemen sistem,NocoBase"
---

# Manajemen Lokalisasi

## Pengantar

Plugin manajemen lokalisasi digunakan untuk mengelola dan mengimplementasikan resource lokalisasi NocoBase. Anda dapat menerjemahkan menu, tabel data, field, dan semua plugin sistem, untuk menyesuaikan dengan bahasa dan budaya region tertentu.

Jika ingin berkontribusi terjemahan default untuk sistem dan plugin resmi ke NocoBase, lihat [Kontribusi Terjemahan](/get-started/translations).

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

Jika terjemahan entry bawaan sistem atau plugin diubah manual atau tertimpa oleh terjemahan AI, pilih `Reset system built-in entry translations` saat sinkronisasi. Setelah sinkronisasi, sistem akan menimpa terjemahan entry bawaan yang sudah ada untuk bahasa saat ini dengan terjemahan dari language pack bawaan untuk memulihkan terjemahan default.

### Otomatis Membuat Entries

Saat editing halaman, teks kustom di setiap block akan otomatis membuat entries yang sesuai, dan secara sinkron menghasilkan konten terjemahan untuk bahasa saat ini.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Tips}
Saat mendefinisikan teks dalam kode, perlu menentukan ns (namespace) secara manual, contohnya: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Mengedit Konten Terjemahan

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

Kolom terjemahan mendukung quick edit. Anda dapat langsung mengklik sel terjemahan di tabel untuk mengubahnya, menekan Enter atau keluar dari input untuk menyimpan, dan menekan `Esc` untuk membatalkan perubahan. Untuk melihat teks sumber, modul, atau terjemahan yang lebih panjang, Anda tetap dapat menggunakan tombol edit pada aksi baris untuk membuka editor drawer.

### Menggunakan Terjemahan AI

Manajemen Lokalisasi mendukung penerjemahan entries melalui AI Employee Lina. Setelah AI Employees diaktifkan dan layanan model dikonfigurasi, Anda dapat menggunakan terjemahan AI di halaman Manajemen Lokalisasi untuk membuat terjemahan massal bagi bahasa saat ini.

![](https://static-docs.nocobase.com/202605121152196.png)

Cakupan terjemahan yang didukung:

- **Terjemahan penuh**: menerjemahkan semua entries pada bahasa saat ini dan menimpa terjemahan yang sudah ada.
- **Terjemahan incremental**: hanya menerjemahkan entries yang belum memiliki terjemahan pada bahasa saat ini. Untuk entry bawaan, jika terjemahan sudah ada di paket bahasa sistem atau plugin untuk bahasa target, entry tersebut juga dianggap sudah memiliki terjemahan.
- **Terjemahan item terpilih**: pilih records di tabel, lalu terjemahkan hanya konten yang dipilih.

![](https://static-docs.nocobase.com/202605191341968.png)

Saat membuat tugas terjemahan penuh atau incremental, Anda dapat memilih cakupan terjemahan di dialog konfirmasi:

- **Semua**: memproses semua entry yang sesuai dengan kondisi tugas saat ini.
- **Entry bawaan**: entry sistem dan plugin.
- **Entry kustom**: nama route, nama collection dan field, serta konten UI.

Dialog konfirmasi juga mendukung konfigurasi bahasa terjemahan referensi. Terjemahan penuh dan incremental mengatur bahasa default dan bahasa cadangan untuk entry bawaan dan entry kustom secara terpisah. Terjemahan item terpilih hanya menampilkan satu konfigurasi bahasa referensi umum.

Terjemahan AI akan membuat background task. Anda dapat melihat progres saat task berjalan. Setelah selesai, terjemahan ditulis ke bahasa terkait dan tetap perlu diperiksa serta diperbaiki sesuai konteks sebenarnya.

Panduan lengkap dapat dilihat di [AI Employee - Lina](/ai-employees/built-in/lina).

:::warning{title=Catatan}
Terjemahan yang dihasilkan AI dapat memiliki penyimpangan makna, terminologi tidak konsisten, atau pemahaman konteks yang kurang. Sebelum publish, periksa manual halaman penting, istilah bisnis, dan teks yang terlihat oleh pengguna.
:::

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
