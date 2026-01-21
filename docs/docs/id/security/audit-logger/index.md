---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::


# Log Audit

## Pendahuluan

Log audit digunakan untuk mencatat dan melacak aktivitas pengguna serta riwayat operasi sumber daya di dalam sistem.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Deskripsi Parameter

| Parameter             | Deskripsi                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**          | Jenis sumber daya target dari operasi                                                                                                     |
| **Action**            | Jenis operasi yang dilakukan                                                                                                              |
| **User**              | Pengguna yang melakukan operasi                                                                                                           |
| **Role**              | Peran pengguna saat operasi dilakukan                                                                                                     |
| **Data source**       | Sumber data                                                                                                                               |
| **Target collection** | Koleksi target                                                                                                                            |
| **Target record UK**  | Pengidentifikasi unik koleksi target                                                                                                      |
| **Source collection** | Koleksi sumber dari bidang relasi                                                                                                         |
| **Source record UK**  | Pengidentifikasi unik koleksi sumber                                                                                                      |
| **Status**            | Kode status HTTP dari respons permintaan operasi                                                                                          |
| **Created at**        | Waktu operasi                                                                                                                             |
| **UUID**              | Pengidentifikasi unik operasi, konsisten dengan ID Permintaan dari permintaan operasi, dapat digunakan untuk mengambil log aplikasi       |
| **IP**                | Alamat IP pengguna                                                                                                                        |
| **UA**                | Informasi UA pengguna                                                                                                                     |
| **Metadata**          | Metadata seperti parameter, isi permintaan, dan konten respons dari permintaan operasi                                                    |

## Deskripsi Sumber Daya Audit

Saat ini, operasi sumber daya berikut akan dicatat dalam log audit:

### Aplikasi Utama

| Operasi          | Deskripsi             |
| ---------------- | --------------------- |
| `app:resart`     | Mulai ulang aplikasi  |
| `app:clearCache` | Hapus cache aplikasi  |

### Manajer Plugin

| Operasi      | Deskripsi       |
| ------------ | --------------- |
| `pm:add`     | Tambah plugin   |
| `pm:update`  | Perbarui plugin |
| `pm:enable`  | Aktifkan plugin |
| `pm:disable` | Nonaktifkan plugin |
| `pm:remove`  | Hapus plugin    |

### Autentikasi Pengguna

| Operasi               | Deskripsi       |
| --------------------- | --------------- |
| `auth:signIn`         | Masuk           |
| `auth:signUp`         | Daftar          |
| `auth:signOut`        | Keluar          |
| `auth:changePassword` | Ubah kata sandi |

### Pengguna

| Operasi               | Deskripsi      |
| --------------------- | -------------- |
| `users:updateProfile` | Perbarui profil |

### Konfigurasi UI

| Operasi                    | Deskripsi        |
| -------------------------- | ---------------- |
| `uiSchemas:insertAdjacent` | Sisipkan Skema UI |
| `uiSchemas:patch`          | Modifikasi Skema UI |
| `uiSchemas:remove`         | Hapus Skema UI   |

### Operasi Koleksi

| Operasi          | Deskripsi                       |
| ---------------- | ------------------------------- |
| `create`         | Buat catatan                    |
| `update`         | Perbarui catatan                |
| `destroy`        | Hapus catatan                   |
| `updateOrCreate` | Perbarui atau buat catatan      |
| `firstOrCreate`  | Kueri atau buat catatan         |
| `move`           | Pindahkan catatan               |
| `set`            | Atur catatan bidang relasi      |
| `add`            | Tambah catatan bidang relasi    |
| `remove`         | Hapus catatan bidang relasi     |
| `export`         | Ekspor catatan                  |
| `import`         | Impor catatan                   |

## Menambahkan Sumber Daya Audit Lain

Jika Anda telah memperluas operasi sumber daya lain melalui plugin dan ingin mencatat perilaku operasi sumber daya ini dalam log audit, silakan lihat [API](/api/server/audit-manager.md).