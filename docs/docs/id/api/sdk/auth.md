:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Auth

## Ikhtisar

Kelas `Auth` terutama digunakan di sisi klien untuk mengakses informasi pengguna dan memanggil API terkait autentikasi pengguna.

## Properti Instans

### `locale`

Bahasa yang digunakan oleh pengguna saat ini.

### `role`

Peran yang digunakan oleh pengguna saat ini.

### `token`

Token API.

### `authenticator`

Autentikator yang digunakan untuk autentikasi pengguna saat ini. Lihat [Autentikasi Pengguna](/auth-verification/auth/).

## Metode Kelas

### `signIn()`

Masuk Pengguna.

#### Tanda Tangan

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detail

| Nama Parameter  | Tipe     | Deskripsi                                    |
| --------------- | -------- | -------------------------------------------- |
| `values`        | `any`    | Parameter permintaan untuk API masuk         |
| `authenticator` | `string` | Pengidentifikasi autentikator yang digunakan untuk masuk |

### `signUp()`

Daftar Pengguna.

#### Tanda Tangan

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detail

| Nama Parameter  | Tipe     | Deskripsi                                    |
| --------------- | -------- | -------------------------------------------- |
| `values`        | `any`    | Parameter permintaan untuk API pendaftaran   |
| `authenticator` | `string` | Pengidentifikasi autentikator yang digunakan untuk pendaftaran |

### `signOut()`

Keluar.

#### Tanda Tangan

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### Detail

| Nama Parameter  | Tipe     | Deskripsi                                    |
| --------------- | -------- | -------------------------------------------- |
| `values`        | `any`    | Parameter permintaan untuk API keluar        |
| `authenticator` | `string` | Pengidentifikasi autentikator yang digunakan untuk keluar |