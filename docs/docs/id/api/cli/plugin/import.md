---
title: "nb plugin import"
description: "Referensi perintah nb plugin import: mengimpor arsip plugin terpaket atau paket npm ke direktori storage/plugins dari env NocoBase yang dipilih, atau ke jalur storage khusus."
keywords: "nb plugin import,NocoBase CLI,impor plugin,storage-path,npm-registry"
---

# nb plugin import

Mengimpor arsip plugin terpaket atau paket npm ke `storage/plugins`. Perintah ini hanya menempatkan plugin ke direktori target. Plugin tidak akan otomatis diaktifkan.

## Penggunaan

```bash
nb plugin import <archive> [flags]
```

## Parameter

| Parameter | Tipe | Penjelasan |
| --- | --- | --- |
| `<archive>` | string | Sumber plugin. Wajib. Mendukung path lokal `.tgz`, URL arsip jarak jauh `http(s)`, atau nama paket / tag npm |
| `--env`, `-e` | string | Nama env CLI. Jika dihilangkan, biasanya memakai env saat ini. Jika kamu memberikan `--storage-path` secara eksplisit, `--env` bisa dihilangkan |
| `--yes`, `-y` | boolean | Lewati konfirmasi interaktif ketika `--env` yang diberikan secara eksplisit menunjuk ke env yang berbeda dari env saat ini |
| `--storage-path` | string | Menimpa path root storage tujuan. Direktori impor sebenarnya adalah `<storage-path>/plugins` |
| `--npm-registry` | string | Menentukan registry npm yang dipakai ketika sumbernya adalah nama paket atau tag npm |

## Contoh

```bash
# Arsip jarak jauh
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Arsip lokal
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# Paket npm atau tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Registry npm privat
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Tulis langsung ke path storage lokal tanpa bergantung pada env saat ini
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Catatan

Kalau env tujuan sudah dipilih, biasanya cukup impor langsung ke `storage/plugins` milik env tersebut.

Kalau kamu hanya ingin menulis plugin ke direktori storage lokal, gunakan `--storage-path`. Dalam hal ini `--env` bisa dihilangkan, dan CLI akan langsung menulis ke `<storage-path>/plugins`.

Setelah impor selesai, langkah berikutnya biasanya adalah me-restart aplikasi, lalu menentukan apakah plugin juga perlu diaktifkan. Dalam kebanyakan kasus:

- Untuk instalasi pertama kali, jalankan [`nb app restart`](../app/restart.md) lebih dulu, lalu [`nb plugin enable`](./enable.md)
- Jika kamu hanya mengimpor ulang versi yang lebih baru, restart aplikasi lebih dulu lalu pastikan versi baru sudah termuat

Kalau sumbernya ada di registry npm privat, login dulu lalu lakukan impor:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Catatan

Kamu tidak perlu mengekstrak apa pun secara manual ke `storage/plugins`. `nb plugin import` akan menempatkan plugin secara otomatis ke direktori yang benar.

:::

## Perintah Terkait

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Instal dan upgrade plugin pihak ketiga`](../../../nocobase-cli/plugins/third-party.md)
