---
pkg: '@nocobase/plugin-feishu'
title: "Menyinkronkan data pengguna dari Feishu"
description: "Sinkronkan pengguna dan departemen Feishu ke NocoBase dan terima perubahan inkremental melalui callback HTTP atau mode Stream."
keywords: "Feishu,Lark,sinkronisasi pengguna,sinkronisasi departemen,mode Stream,callback peristiwa,NocoBase"
---

# Menyinkronkan data pengguna dari Feishu

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## Pengantar

Plugin **Feishu / Lark** menyinkronkan pengguna dan departemen organisasi Feishu ke NocoBase. Mendukung sinkronisasi penuh sesuai permintaan dan pembaruan inkremental melalui callback HTTP atau koneksi Stream.

## Sebelum memulai

1. Instal dan aktifkan plugin **Feishu / Lark** dan **Sinkronisasi data pengguna**.
2. Buat aplikasi internal di platform terbuka Feishu, lihat [Autentikasi: Feishu / Lark](/auth-verification/auth-feishu/).
3. Aktifkan izin kontak dan konfigurasikan cakupan visibilitas seperti di bawah.

## Izin kontak dan cakupan visibilitas

Pada **Manajemen izin** aplikasi, aktifkan:

| Izin | Scope | Wajib | Tujuan |
| --- | --- | --- | --- |
| Mendapatkan info dasar pengguna | `contact:user.base:readonly` | Ya | Membaca nama, `open_id` / `union_id`, dan bidang dasar lain. |
| Mendapatkan info dasar departemen | `contact:department.base:readonly` | Ya | Membaca nama dan hierarki departemen. |
| Mendapatkan struktur organisasi departemen | `contact:department.organize:readonly` | Ya | Menelusuri sub-departemen; membaca pemimpin. |
| Mendapatkan struktur organisasi pengguna | `contact:user.department:readonly` | Ya | Membaca departemen dan departemen utama pengguna. |
| Mendapatkan user ID pengguna | `contact:user.id:readonly` | Jika pengenal `user_id` | Membaca bidang `user_id`. |
| Mendapatkan nomor telepon pengguna | `contact:user.phone:readonly` | Untuk sinkron telepon | Membaca nomor; wajib bila pengenal `mobile`. |
| Mendapatkan email pengguna | `contact:user.email:readonly` | Untuk sinkron email | Membaca email; wajib bila pengenal `email`. |

Selanjutnya konfigurasikan **cakupan izin kontak** (departemen dan anggota yang dapat diakses aplikasi):

1. Di halaman **Konfigurasi pengembangan → Izin**, klik **Konfigurasi** pada kolom "Cakupan data yang dapat diakses" (mengaktifkan izin kontak otomatis mengarah ke sini).
2. Pilih departemen dan anggota; untuk awal disarankan **Semua anggota**, lalu persempit bila perlu.
3. Klik **OK** untuk menyimpan.

:::warning
Tanpa **Mendapatkan info dasar pengguna**, API tidak mengembalikan nama dan nama panggilan hasil sinkronisasi kosong. Cakupan izin kontak dan "cakupan ketersediaan aplikasi" (siapa yang boleh memakai aplikasi) adalah dua pengaturan terpisah; hanya yang pertama memengaruhi sinkronisasi. Izin API menentukan bidang yang dapat dibaca, cakupan menentukan departemen/pengguna yang dapat dibaca; keduanya harus dikonfigurasi. Setelah berubah, jalankan ulang sinkronisasi penuh. Langganan peristiwa tidak menggantikan izin baca: pada setiap peristiwa NocoBase tetap memanggil API Feishu.
:::

## Menambahkan sumber sinkronisasi Feishu

Buka **Pengguna & izin** → **Sinkronisasi**, tambahkan sumber tipe **Feishu / Lark**:

| Bidang | Keterangan |
| --- | --- |
| Nama sumber | Nama unik sumber sinkronisasi. |
| Diaktifkan | Memulai penerimaan peristiwa dan mengizinkan tugas sinkronisasi. |
| Wilayah | `Feishu China` atau `Lark Global`. |
| App ID / App Secret | Kredensial aplikasi. Mendukung variabel lingkungan dan secret. |
| Bidang pengenal unik | `user_id`, `union_id`, `open_id`, `mobile`, atau `email`; disarankan `union_id`. Harus sama dengan autentikator; pengguna tanpa nilai dilewati. |
| Mode penerimaan peristiwa | **Callback HTTP** atau **mode Stream**, lihat di bawah. |

Simpan dan aktifkan sumber, lalu klik **Sinkronkan** untuk sinkronisasi penuh pertama.

## Memilih mode penerimaan peristiwa

### Mode Stream

Mode Stream menjaga koneksi WebSocket persisten yang dimulai server NocoBase. Tanpa URL callback publik, token, atau kunci enkripsi.

1. Pilih **mode Stream** di NocoBase, simpan dan aktifkan sumber.
2. Di platform, pada **Peristiwa & Callback**, ubah penerimaan ke **koneksi panjang (WebSocket)** dan berlangganan peristiwa kontak.

Koneksi dimulai otomatis saat sumber aktif (dengan sambung ulang otomatis) dan diperbarui/ditutup saat sumber diubah, dinonaktifkan, atau dihapus.

:::info
Mode Stream tidak butuh alamat masuk publik maupun proxy terbalik — cocok untuk penerapan intranet. Status koneksi dapat diperiksa di log aplikasi dengan kata kunci `Feishu stream client`.
:::

### Callback HTTP

1. Pilih **callback HTTP** di NocoBase dan konfigurasikan **Verification Token** serta opsional **Encrypt Key** — minimal satu wajib.
2. Simpan sumber dan salin **URL callback peristiwa** yang tampil.
3. Di platform, pada **Peristiwa & Callback** → **Konfigurasi peristiwa**, pilih kirim ke server, tempel URL, dan berlangganan peristiwa kontak.

URL callback harus dapat dijangkau Feishu (HTTPS di produksi). Dengan Encrypt Key isi callback dienkripsi.

:::warning
Tanpa Verification Token atau Encrypt Key, permintaan callback ditolak (401). Sumber yang beralih ke mode Stream menutup endpoint HTTP (403).
:::

## Peristiwa inkremental yang didukung

| Peristiwa | Penanganan di NocoBase |
| --- | --- |
| `contact.user.created_v3` | Membuat atau memperbarui pengguna. |
| `contact.user.updated_v3` | Memperbarui pengguna. |
| `contact.user.deleted_v3` | Menghapus pengguna tersinkron. |
| `contact.department.created_v3` | Membuat atau memperbarui departemen. |
| `contact.department.updated_v3` | Memperbarui departemen. |
| `contact.department.deleted_v3` | Menghapus departemen tersinkron. |

Pengguna dengan peran Root tidak pernah dihapus oleh sinkronisasi.

## Bidang yang disinkronkan

### Bidang departemen

| Bidang Feishu | Bidang / tujuan di NocoBase |
| --- | --- |
| `open_department_id` | Pengenal sumber departemen. |
| `name` | Nama departemen. |
| `parent_department_id` | Departemen induk untuk hierarki; induk di luar cakupan disinkronkan sebagai akar. |

### Bidang pengguna

| Bidang Feishu | Bidang / tujuan di NocoBase |
| --- | --- |
| Nilai bidang pengenal | Pengenal sumber dan nama pengguna dari **bidang pengenal unik**. |
| `name`, bila kosong `en_name` | Nama panggilan; kosong bila keduanya tidak ada. |
| `mobile` | Nomor telepon. |
| `email` | Email. |
| `department_ids` | Departemen pengguna; hanya dalam cakupan. |
| `main_department_id` | Departemen utama. |

### Pemimpin departemen

Pemimpin dari data departemen disinkronkan sebagai pemilik departemen di NocoBase: satu pengguna dapat memimpin beberapa departemen, dan departemen yang dipimpin belum tentu departemen utamanya. Hanya departemen dalam cakupan yang berpartisipasi. Pemimpin yang dicabut di Feishu dicabut pada sinkronisasi berikutnya; perubahan manual dapat ditimpa.

Bidang lain seperti avatar, jabatan, dan nomor pegawai saat ini tidak disinkronkan.

## Pemecahan masalah

- Hasil kosong atau departemen hilang: periksa izin kontak dan cakupan visibilitas.
- Nama panggilan kosong: aktifkan **Mendapatkan info dasar pengguna** (`contact:user.base:readonly`) dan sinkronkan ulang.
- Pengguna dilewati: periksa nilai pengenal dan kecocokan dengan autentikator.
- Callback HTTP 401: Verification Token / Encrypt Key belum ada atau salah; 403: sumber beralih ke mode Stream.
- Galat `redirect_uri` atau URL callback: URL di platform harus sama persis dengan yang ditampilkan NocoBase (termasuk prefiks `APP_PUBLIC_PATH`).
- Tugas gagal karena batas frekuensi API: tunggu batas berlalu lalu jalankan ulang manual.
