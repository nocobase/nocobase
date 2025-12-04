:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menyinkronkan Data Pengguna melalui HTTP API

## Mendapatkan Kunci API

Lihat [Kunci API](/auth-verification/api-keys). Pastikan peran yang terkait dengan kunci API memiliki izin yang diperlukan untuk menyinkronkan data pengguna.

## Ikhtisar API

### Contoh

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Lihat detail isi permintaan di bawah
```

### Endpoint

```bash
POST /api/userData:push
```

### Format Data Pengguna

#### UserData

| Parameter  | Tipe                       | Deskripsi                                                                 |
| ---------- | -------------------------- | ------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`   | Wajib. Tipe data yang dikirim. Gunakan `user` untuk mengirim data pengguna. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Opsional. Digunakan untuk mencocokkan pengguna sistem yang sudah ada berdasarkan bidang yang ditentukan. |
| `records`  | `UserRecord[]`             | Wajib. Larik (array) catatan data pengguna.                               |

#### UserRecord

| Parameter     | Tipe       | Deskripsi                                                                                                 |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Wajib. Pengidentifikasi unik untuk data pengguna sumber, digunakan untuk mengaitkan data sumber dengan pengguna sistem. Tidak dapat diubah untuk satu pengguna. |
| `nickname`    | `string`   | Opsional. Nama panggilan pengguna.                                                                         |
| `username`    | `string`   | Opsional. Nama pengguna.                                                                                    |
| `email`       | `string`   | Opsional. Alamat email pengguna.                                                                            |
| `phone`       | `string`   | Opsional. Nomor telepon pengguna.                                                                           |
| `departments` | `string[]` | Opsional. Larik (array) UID departemen tempat pengguna menjadi anggota.                                     |
| `isDeleted`   | `boolean`  | Opsional. Menunjukkan apakah catatan dihapus.                                                               |
| `<field>`     | `any`      | Opsional. Data bidang kustom dalam tabel pengguna.                                                          |

### Format Data Departemen

:::info
Mengirim data departemen memerlukan [plugin Departemen](../../departments) untuk diinstal dan diaktifkan.
:::

#### DepartmentData

| Parameter  | Tipe                       | Deskripsi                                                                |
| ---------- | -------------------------- | -------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`   | Wajib. Tipe data yang dikirim. Gunakan `department` untuk data departemen. |
| `records`  | `DepartmentRecord[]`       | Wajib. Larik (array) catatan data departemen.                              |

#### DepartmentRecord

| Parameter   | Tipe      | Deskripsi                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Wajib. Pengidentifikasi unik untuk data departemen sumber, digunakan untuk mengaitkan data sumber dengan departemen sistem. Tidak dapat diubah. |
| `title`     | `string`  | Wajib. Judul departemen.                                                                                            |
| `parentUid` | `string`  | Opsional. UID departemen induk.                                                                                     |
| `isDeleted` | `boolean` | Opsional. Menunjukkan apakah catatan dihapus.                                                                       |
| `<field>`   | `any`     | Opsional. Data bidang kustom dalam tabel departemen.                                                                |

:::info

1.  Pengiriman data bersifat idempoten.
2.  Jika departemen induk belum ada saat mengirim data departemen, asosiasi tidak dapat dibuat. Anda dapat mengirim ulang data setelah departemen induk dibuat.
3.  Jika departemen pengguna belum ada saat mengirim data pengguna, pengguna tidak dapat dikaitkan dengan departemen tersebut. Anda dapat mengirim ulang data pengguna setelah data departemen dikirim.

:::