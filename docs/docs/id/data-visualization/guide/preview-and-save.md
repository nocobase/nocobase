---
title: "Preview dan Simpan"
description: "Preview merender konfigurasi sementara untuk verifikasi, simpan menulis ke database agar berlaku; mode grafis preview otomatis, mode SQL/Custom perlu preview manual; debounce dan pesan error."
keywords: "preview,simpan,konfigurasi berlaku,debounce,konfigurasi chart,NocoBase"
---

# Preview dan Simpan

* Preview: merender perubahan dari panel konfigurasi sementara ke Chart pada halaman, untuk memverifikasi efek.
* Simpan: benar-benar menyimpan perubahan dari panel konfigurasi ke database.

## Pintu Operasi

![clipboard-image-1761479218](https://static-docs.nocobase.com/clipboard-image-1761479218.png)

- Semua perubahan pada mode konfigurasi grafis secara default akan otomatis menjalankan preview.
- Setelah perubahan pada mode SQL, mode Custom, Anda dapat klik tombol Preview di sebelah kanan untuk menjalankan preview.
- Pada bagian bawah seluruh panel konfigurasi, tersedia tombol "Preview" terpadu.

## Perilaku Preview
- Tampilkan konfigurasi sementara ke halaman, tetapi tidak menulis ke database. Setelah refresh halaman atau membatalkan operasi, hasil preview tidak akan dipertahankan.
- Debounce bawaan: saat refresh dipicu beberapa kali dalam waktu singkat, hanya yang terakhir yang dieksekusi, untuk menghindari permintaan yang sering.
- Klik "Preview" lagi akan menimpa hasil preview sebelumnya.

## Pesan Error
- Error query atau validasi gagal: pesan error ditampilkan pada area "Lihat Data".
- Error konfigurasi Chart (pemetaan Basic hilang, Custom JS error): error ditampilkan pada area Chart atau console, halaman tetap dapat dioperasikan.
- Konfirmasikan nama dan tipe kolom pada "Lihat Data" terlebih dahulu sebelum melakukan pemetaan field atau menulis kode Custom, ini akan secara efektif mengurangi error.

## Simpan dan Batal
- Simpan: tulis perubahan panel saat ini ke konfigurasi blok dan langsung berlaku pada halaman.
- Batal: batalkan perubahan panel saat ini yang belum disimpan, kembalikan ke status simpan sebelumnya.
- Cakupan simpan:
  - Query Data: parameter query Builder; pada mode SQL juga menyimpan teks SQL.
  - Opsi Chart: jenis dan pemetaan field, properti Basic; teks JS Custom.
  - Event Interaksi: teks JS event dan logika binding.
- Setelah disimpan, blok berlaku untuk semua pengunjung (tergantung pengaturan izin halaman).

## Jalur Operasi yang Direkomendasikan
- Konfigurasikan Query Data → Jalankan Query → Konfirmasikan nama dan tipe kolom pada Lihat Data → Konfigurasikan Opsi Chart, petakan field inti → Verifikasi preview → Simpan agar berlaku.
