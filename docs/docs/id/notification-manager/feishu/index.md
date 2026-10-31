---
pkg: '@nocobase/plugin-feishu'
---

# Notifikasi: Feishu / Lark

## Pengantar

Plugin **Feishu / Lark** memungkinkan aplikasi mengirim pesan notifikasi ke pengguna Feishu.

## Menambahkan dan mengonfigurasi autentikator Feishu

Tambahkan dan konfigurasikan autentikator Feishu di NocoBase terlebih dahulu, lihat [Autentikasi: Feishu / Lark](/auth-verification/auth-feishu/). Hanya pengguna sistem yang masuk melalui Feishu yang dapat menerima notifikasi sistem via Feishu.

Pesan dikirim melalui aplikasi Feishu milik autentikator terpilih, dengan syarat tambahan:

1. Kapabilitas **Bot** ditambahkan di **Fitur aplikasi** pada platform terbuka — tanpanya pengiriman gagal;
2. Izin **Kirim pesan sebagai bot** (`im:message:send_as_bot`) aktif di **Manajemen izin** dan versi baru dipublikasikan;
3. Penerima berada dalam **cakupan izin kontak** (ketersediaan) aplikasi.

Setelah mengubah kapabilitas atau izin, publikasikan versi baru lalu coba lagi.

## Menambahkan kanal notifikasi Feishu

Buka **Manajemen notifikasi** → kanal, tambahkan kanal **Feishu / Lark** dan pilih autentikator yang dikonfigurasi.

Opsional konfigurasikan **Tipe ID penerima** (`open_id`, `user_id`, `union_id`, atau `email`); bawaan mengikuti bidang pengenal autentikator.

## Tipe pesan

| Tipe | Keterangan |
| --- | --- |
| Pesan teks | Teks biasa. |
| Pesan Post | Teks kaya format Post Feishu. |
| Kartu interaktif | Kartu Feishu yang dikonfigurasi via JSON. |

Penerima diselesaikan dari identitas Feishu yang terikat pada autentikator (menurut tipe ID penerima); yang belum terikat jatuh ke email atau nama pengguna.

## Node notifikasi dalam alur kerja

Pilih kanal Feishu yang dikonfigurasi pada node notifikasi alur kerja untuk mengirim pesan Feishu ke pengguna dalam konteks alur kerja.

## Pemecahan masalah

- Pengiriman gagal dengan galat izin (mis. kode `230002`): periksa kapabilitas **Bot**, izin **Kirim pesan sebagai bot**, dan publikasi versi terbaru.
- Gagal karena penerima tidak valid (galat `receive_id`): penerima di luar cakupan izin kontak, atau tipe ID penerima tidak cocok dengan konfigurasi kanal.
- Tugas hanya menampilkan galat umum: periksa entri `FeishuNotificationChannel.send failed` di log server; versi plugin terbaru juga mencatat kode dan pesan galat dari Feishu.
