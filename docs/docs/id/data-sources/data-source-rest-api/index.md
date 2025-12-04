---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::



# Sumber Data REST API

## Pendahuluan

Plugin ini memungkinkan Anda untuk mengintegrasikan data dari sumber REST API dengan mudah.

## Instalasi

Sebagai plugin komersial, Anda perlu mengunggah dan mengaktifkan plugin ini melalui manajer plugin.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## Menambahkan Sumber Data REST API

Setelah mengaktifkan plugin, Anda dapat menambahkan sumber data REST API dengan memilihnya dari menu dropdown "Add new" di bagian manajemen sumber data.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Konfigurasikan sumber data REST API.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Menambahkan koleksi

Di NocoBase, sebuah sumber daya RESTful dipetakan ke sebuah koleksi, seperti sumber daya Pengguna (Users).

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Endpoint API ini dipetakan di NocoBase sebagai berikut:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Untuk panduan lengkap mengenai spesifikasi desain API NocoBase, silakan merujuk ke dokumentasi API.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Periksa bab "NocoBase API - Core" untuk informasi lebih lanjut.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Konfigurasi koleksi untuk sumber data REST API mencakup hal-hal berikut:

### List

Petakan antarmuka untuk melihat daftar sumber daya.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get

Petakan antarmuka untuk melihat detail sumber daya.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create

Petakan antarmuka untuk membuat sumber daya.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update

Petakan antarmuka untuk memperbarui sumber daya.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy

Petakan antarmuka untuk menghapus sumber daya.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

Antarmuka List dan Get wajib dikonfigurasi.

## Debugging API

### Integrasi Parameter Permintaan

Contoh: Konfigurasikan parameter paginasi untuk API List. Jika API pihak ketiga tidak mendukung paginasi secara native, NocoBase akan melakukan paginasi berdasarkan data daftar yang diambil.

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

Harap dicatat bahwa hanya variabel yang telah ditambahkan di antarmuka yang akan berlaku.

| Nama parameter API pihak ketiga | Parameter NocoBase                |
| ------------------------------- | --------------------------------- |
| page                            | {{request.params.page}}           |
| limit                           | {{request.params.pageSize}}       |

Anda dapat mengklik "Try it out" untuk melakukan debugging dan melihat hasil respons.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Transformasi Format Respons

Format respons dari API pihak ketiga mungkin tidak sesuai dengan standar NocoBase, sehingga perlu diubah agar dapat ditampilkan dengan benar di antarmuka pengguna.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

Sesuaikan aturan konversi berdasarkan format respons API pihak ketiga untuk memastikan output sesuai dengan standar NocoBase.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

Deskripsi proses debugging

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## Variabel

Sumber data REST API menyediakan tiga jenis variabel untuk integrasi API:

- Variabel sumber data kustom
- Permintaan NocoBase
- Respons pihak ketiga

### Variabel Sumber Data Kustom

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Permintaan NocoBase

- Params: Parameter kueri URL (Search Params), yang bervariasi tergantung pada antarmuka.
- Headers: Header permintaan kustom, terutama menyediakan informasi X- spesifik dari NocoBase.
- Body: Isi permintaan (request body).
- Token: Token API untuk permintaan NocoBase saat ini.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### Respons Pihak Ketiga

Saat ini, hanya body respons yang tersedia.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

Berikut adalah variabel yang tersedia untuk setiap antarmuka:

### List

| Parameter               | Deskripsi                                                  |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Halaman saat ini                                           |
| request.params.pageSize | Jumlah item per halaman                                    |
| request.params.filter   | Kriteria filter (harus sesuai format Filter NocoBase)      |
| request.params.sort     | Kriteria pengurutan (harus sesuai format Sort NocoBase)    |
| request.params.appends  | Bidang yang dimuat sesuai permintaan, biasanya untuk bidang relasi |
| request.params.fields   | Bidang yang akan disertakan (daftar putih)                 |
| request.params.except   | Bidang yang akan dikecualikan (daftar hitam)               |

### Get

| Parameter                 | Deskripsi                                                  |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Wajib diisi, biasanya ID rekaman saat ini                  |
| request.params.filter     | Kriteria filter (harus sesuai format Filter NocoBase)      |
| request.params.appends    | Bidang yang dimuat sesuai permintaan, biasanya untuk bidang relasi |
| request.params.fields     | Bidang yang akan disertakan (daftar putih)                 |
| request.params.except     | Bidang yang akan dikecualikan (daftar hitam)               |

### Create

| Parameter                | Deskripsi                      |
| ------------------------ | ------------------------------ |
| request.params.whiteList | Daftar putih                   |
| request.params.blacklist | Daftar hitam                   |
| request.body             | Data awal untuk pembuatan      |

### Update

| Parameter                 | Deskripsi                                          |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Wajib diisi, biasanya ID rekaman saat ini          |
| request.params.filter     | Kriteria filter (harus sesuai format Filter NocoBase) |
| request.params.whiteList  | Daftar putih                                       |
| request.params.blacklist  | Daftar hitam                                       |
| request.body              | Data untuk pembaruan                               |

### Destroy

| Parameter                 | Deskripsi                                          |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Wajib diisi, biasanya ID rekaman saat ini          |
| request.params.filter     | Kriteria filter (harus sesuai format Filter NocoBase) |

## Konfigurasi Bidang

Metadata bidang (Fields) diekstraksi dari data antarmuka CRUD sumber daya yang diadaptasi untuk berfungsi sebagai bidang koleksi.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Ekstrak metadata bidang.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

Bidang dan pratinjau.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Edit bidang (serupa dengan sumber data lainnya).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Menambahkan Blok Sumber Data REST API

Setelah koleksi dikonfigurasi, Anda dapat menambahkan blok ke antarmuka.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)