---
pkg: '@nocobase/plugin-feishu'
---

# Autentikasi: Feishu / Lark

## Pengantar

Plugin **Feishu / Lark** memungkinkan pengguna masuk ke NocoBase dengan akun Feishu atau Lark, dengan opsi login otomatis.

## Mengaktifkan plugin

Feishu / Lark adalah plugin komersial. Instal dan aktifkan di manajer plugin bersama plugin **Autentikasi pengguna**.

## Membuat aplikasi di platform terbuka

Masuk ke [platform terbuka Feishu](https://open.feishu.cn/) dan buat **aplikasi internal perusahaan** (untuk Lark gunakan [platform terbuka Lark](https://open.larksuite.com/)). Catat **App ID** dan **App Secret**.

Login tidak memerlukan izin API tambahan. Untuk sinkronisasi kontak, lihat [Menyinkronkan data pengguna dari Feishu](/users-permissions/sync/sources/feishu).

## Mengonfigurasi URL pengalihan

Di **Pengaturan keamanan** → **URL pengalihan** aplikasi, tambahkan URL callback yang ditampilkan NocoBase:

```
https://domain-anda/api/feishu:redirect
```

Cara termudah adalah menyalin **URL pengalihan** yang tampil di halaman konfigurasi autentikator NocoBase.

:::warning
Jika NocoBase dijalankan di sub-path (mis. `APP_PUBLIC_PATH=/nocobase/`), URL callback memuat prefiks, mis. `https://domain-anda/nocobase/api/feishu:redirect`. URL pada daftar putih platform harus sama persis dengan URL sebenarnya.
:::

## Menambahkan autentikasi Feishu di NocoBase

Buka **Autentikasi pengguna** dan tambahkan autentikator **Feishu / Lark**:

| Bidang | Keterangan |
| --- | --- |
| Pendaftaran otomatis | Membuat akun saat login pertama. Aktif secara bawaan. |
| Wilayah | `Feishu China` atau `Lark Global`. |
| App ID / App Secret | Kredensial aplikasi Feishu. Mendukung variabel lingkungan dan secret. |
| Origin | Alamat publik situs, mis. `https://example.com`. Hanya protokol dan domain, tanpa path (garis miring akhir opsional); kosong berarti memakai alamat permintaan saat ini. |
| Bidang pengenal unik | Kunci identitas pengguna, lihat di bawah. |
| Login otomatis | Login senyap saat membuka aplikasi di dalam Feishu, lihat di bawah. |

## Memilih bidang pengenal unik

| Bidang | Keterangan |
| --- | --- |
| `union_id` | Disarankan. Stabil dan sama untuk semua aplikasi akun pengembang yang sama. |
| `open_id` | Unik per aplikasi; berubah saat berganti aplikasi. |
| `user_id` | Unik dalam tenant; dapat bentrok pada skenario multi-tenant. |
| `mobile` / `email` | Dapat berubah dan bisa kosong; tidak cocok sebagai pengenal. |

Pertahankan pilihan ini setelah ada pengguna masuk. Jika memakai sinkronisasi data, pilih bidang yang sama di sumber sinkronisasi.

## Login dan pendaftaran otomatis

Pengguna menekan tombol **Feishu / Lark** di halaman login untuk menyelesaikan OAuth. Dengan pendaftaran otomatis:

- Pengguna dicocokkan atau dibuat berdasarkan **bidang pengenal unik**;
- Telepon, email, dan nama panggilan hanya diisi saat profil kosong; nilai yang ada tidak pernah ditimpa.

## Login otomatis

Dengan **Login otomatis**, membuka aplikasi di klien Feishu memulai OAuth tanpa menekan tombol. Hanya satu autentikator Feishu yang dapat mengaktifkannya dalam satu waktu.

Syarat:

- URL callback tercantum dalam daftar putih **URL pengalihan**;
- Aplikasi sudah dipublikasikan dan pengguna berada dalam cakupan ketersediaan;
- Aplikasi dibuka di dalam klien Feishu.

Penggunaan pertama menampilkan satu kali halaman persetujuan; setelahnya senyap. Membuka di peramban sistem tidak memicu login otomatis — ini perilaku yang diharapkan.

## Pintasan workbench Feishu (opsional)

Konfigurasikan beranda desktop/seluler di **Fitur aplikasi** → **Aplikasi web** agar pengguna membuka NocoBase langsung dari workbench Feishu. URL harus sama dengan alamat NocoBase sebenarnya (termasuk prefiks sub-path).
