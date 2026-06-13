---
title: "Aturan Linkage Action"
description: "Konfigurasi Action: mengkonfigurasi aturan linkage Action, mengontrol tampilan/sembunyi, nonaktifkan/aktifkan Action."
keywords: "Aturan Linkage Action, Aturan Linkage, tampilan Action, konfigurasi Action, interface builder, NocoBase"
---

# Aturan Linkage Action

## Pengantar

Aturan Linkage Action memungkinkan pengguna untuk secara dinamis mengontrol status Action (seperti tampilan, aktif, sembunyi, nonaktif, dll.) berdasarkan kondisi tertentu. Dengan mengkonfigurasi aturan ini, pengguna dapat mengimplementasikan linkage perilaku tombol Action dengan record saat ini, peran pengguna, atau data konteks.

![20251029150224](https://static-docs.nocobase.com/20251029150224.png)

## Petunjuk Penggunaan

Ketika kondisi terpenuhi (tanpa kondisi default lulus), pengaturan atribut/eksekusi JavaScript akan dipicu. Mendukung penggunaan konstanta/variabel dalam penilaian kondisi.

![20251030224601](https://static-docs.nocobase.com/20251030224601.png)

Mendukung modifikasi atribut tombol.

![20251029150452](https://static-docs.nocobase.com/20251029150452.png)

## Konstanta

Contoh: Pesanan yang sudah dibayar tidak diizinkan untuk diedit.

![20251029150638](https://static-docs.nocobase.com/20251029150638.png)

## Variabel

### Variabel Sistem

![20251029150014](https://static-docs.nocobase.com/20251029150014.png)

Contoh 1: Mengontrol tampilan tombol berdasarkan tipe perangkat saat ini.

![20251029151057](https://static-docs.nocobase.com/20251029151057.png)

Contoh 2: Tombol bulk update di header Block Table pesanan hanya tersedia untuk peran admin, peran lain tidak dapat menjalankan Action ini.

![20251029151209](https://static-docs.nocobase.com/20251029151209.png)

### Variabel Konteks

Contoh: Tombol tambah pada peluang pesanan (Block relasi) hanya aktif ketika status pesanan adalah "Belum Dibayar" dan "Draft", dalam status lain tombol akan dinonaktifkan.

![20251029151520](https://static-docs.nocobase.com/20251029151520.png)

![20251029152200](https://static-docs.nocobase.com/20251029152200.png)

Untuk informasi lebih lanjut tentang variabel, silakan lihat [Variabel](/interface-builder/variables).
