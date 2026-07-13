---
pkg: '@nocobase/plugin-file-manager'
title: "URL stabil (URL proxy)"
description: "Menjelaskan format, izin, pengalihan, dan perilaku URL file stabil di NocoBase."
keywords: "URL stabil,URL proxy,URL permanen,akses file,pratinjau Office,NocoBase"
---

# URL stabil

File yang dikelola oleh storage engine NocoBase diakses melalui **URL stabil**. NocoBase memeriksa record file dan izin akses, lalu mengalihkan permintaan ke URL aktual yang dibuat oleh storage engine.

## Format

```text
/files/<app>/<dataSource>/<collection>/<id><extname>
```

Jika `APP_PUBLIC_PATH=/nocobase`, path dimulai dengan `/nocobase/files/`. ID dan ekstensi tidak dapat diubah setelah file dibuat, sehingga URL tetap stabil selama record masih ada.

| Penggunaan | URL | Perilaku |
|---|---|---|
| Membuka | `/files/.../42.pdf` | Memeriksa izin dan mengalihkan ke file |
| Pratinjau | `/files/.../42.png?preview=1` | Mengalihkan ke thumbnail atau URL pratinjau |
| Unduh | `/files/.../42.pdf?download=1` | Mengalihkan dengan mode unduh |
| Office | `/files/.../42.xlsx?temporaryAccessToken=...` | Akses sementara untuk Office Online Viewer |

## Perilaku di NocoBase

- Field attachment, file collection, dan [HTTP API](./http-api.md) mengembalikan URL stabil pada `url` dan `preview`
- Markdown menyimpan URL stabil dan mendukung S3, OSS, COS, serta S3 Pro privat
- Field URL attachment mempertahankan URL eksternal yang dimasukkan manual dan memakai URL stabil untuk upload yang dikelola NocoBase
- Pratinjau biasa memakai sesi login dan izin file NocoBase saat ini
- Form publik hanya memberi akses terbatas ke file yang diunggah dalam sesi form tersebut

## Pratinjau Office

Microsoft Office Online Viewer tidak dapat memakai cookie NocoBase milik pengguna. Saat pratinjau dibuka, NocoBase memeriksa izin terlebih dahulu lalu menerbitkan URL sementara yang terikat pada satu file. Masa berlaku default adalah 10 menit dan dapat diatur antara 5 sampai 10 menit melalui `TEMPORARY_FILE_ACCESS_EXPIRES_IN`.

Jangan simpan URL sementara ini ke field, Markdown, atau data bisnis, dan jangan gunakan sebagai tautan berbagi.

## Catatan penting

- Stabil tidak berarti publik; penerima tetap memerlukan izin
- Menghapus atau memindahkan record ke konteks lain akan membatalkan URL lama
- Respons berupa pengalihan `302` yang harus diikuti oleh klien
- Jangan menyimpan `302 Location` atau `temporaryAccessToken`
- Reverse proxy harus meneruskan rute `/files/` di bawah `APP_PUBLIC_PATH` ke NocoBase. Untuk deployment pada subpath, pertahankan juga rute kompatibilitas `/files/` di root. Konfigurasi yang dibuat oleh NocoBase CLI otomatis mencakup kedua rute tersebut
- Gunakan `hostname` yang berbeda untuk setiap layanan NocoBase yang berdiri sendiri, bukan hanya membedakannya berdasarkan port. Cookie browser tidak diisolasi berdasarkan port; lihat [Deployment environment produksi](../get-started/deployment/production.md)
- Sub-app dalam deployment NocoBase yang sama dibedakan berdasarkan nama aplikasi dan tidak memerlukan hostname terpisah. Namun, layanan independen pada port lain tetap harus diisolasi dengan hostname jika memiliki aplikasi utama atau sub-app dengan nama yang sama

## Tautan terkait

- [HTTP API](./http-api.md) — Mengunggah dan mengambil file
- [Pratinjau file](./file-preview/index.md) — Format pratinjau yang didukung
- [Pratinjau Office](./file-preview/ms-office.md) — Mengatur Office Viewer
- [Storage engine](./storage/index.md) — Mengatur penyimpanan file
