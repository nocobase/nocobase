---
title: "Sumber Data REST API"
description: "Hubungkan data dari sumber REST API, petakan resource RESTful sebagai Collection, konfigurasikan pemetaan antarmuka List/Get/Create/Update/Destroy, dan dukung operasi CRUD."
keywords: "Sumber Data REST API,API eksternal,pemetaan antarmuka,pemetaan Collection,NocoBase"
---

# Sumber Data REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Pengenalan

Digunakan untuk menghubungkan data dari sumber REST API.

## Instalasi

Plugin ini merupakan plugin komersial. Untuk metode aktivasi selengkapnya, lihat：[Panduan Aktivasi Plugin Komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan Sumber REST API

Setelah plugin diaktifkan, pilih REST API dari menu tarik-turun Add new di Manajemen sumber data.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Mengonfigurasi Sumber REST API

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Menambahkan Collection

Resource RESTful merupakan Collection di NocoBase, misalnya resource Users.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Konfigurasinya dalam API NocoBase adalah

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Untuk spesifikasi desain API NocoBase selengkapnya, lihat dokumentasi API

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Lihat bab 「NocoBase API - Core」

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Konfigurasi Collection sumber data REST API adalah sebagai berikut

### List

Konfigurasikan pemetaan antarmuka untuk melihat daftar resource

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Konfigurasikan pemetaan antarmuka untuk melihat detail resource

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Konfigurasikan pemetaan antarmuka untuk membuat resource

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Konfigurasikan pemetaan antarmuka untuk memperbarui resource
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Konfigurasikan pemetaan antarmuka untuk menghapus resource

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

List dan Get adalah dua antarmuka yang wajib dikonfigurasi.
## Menguji API

### Menghubungkan Parameter Permintaan

Contoh: mengonfigurasi parameter pagination untuk antarmuka List (jika API pihak ketiga itu sendiri tidak mendukung pagination, pagination dilakukan berdasarkan data daftar yang diperoleh).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Perhatikan bahwa hanya variabel yang telah ditambahkan dalam antarmuka yang akan berlaku.

| Nama parameter integrasi API pihak ketiga | Parameter NocoBase             |
| ----------------------------------------- | ------------------------------ |
| page                                      | {{request.params.page}}        |
| limit                                     | {{request.params.pageSize}}    |

Klik Try it out untuk melakukan pengujian dan melihat hasil respons.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Konversi Format Respons

Format respons API pihak ketiga mungkin tidak sesuai dengan standar NocoBase dan perlu dikonversi agar dapat ditampilkan dengan benar di frontend.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Sesuaikan aturan konversi berdasarkan format respons API pihak ketiga agar sesuai dengan standar output NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Penjelasan alur pengujian

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Konversi Informasi Kesalahan

Jika terjadi kesalahan pada API pihak ketiga, format informasi kesalahan dalam respons mungkin tidak sesuai dengan standar NocoBase dan perlu dikonversi agar dapat ditampilkan dengan benar di frontend.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Jika konversi informasi kesalahan belum dikonfigurasi, informasi tersebut secara default dikonversi menjadi informasi kesalahan yang mencakup kode status http.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Setelah konversi informasi kesalahan dikonfigurasi agar sesuai dengan standar output NocoBase, frontend dapat menampilkan informasi kesalahan dari API pihak ketiga dengan benar.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variabel

Sumber data REST API menyediakan tiga jenis variabel untuk integrasi antarmuka

- Variabel Kustom Sumber Data
- Permintaan NocoBase
- Respons Pihak Ketiga

### Variabel Kustom Sumber Data

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Permintaan NocoBase

- Params: parameter kueri URL (Search Params), Params setiap antarmuka dapat berbeda;
- Headers: badan permintaan, terutama menyediakan beberapa informasi X- kustom NocoBase;
- Body: Body permintaan;
- Token: API token dari permintaan NocoBase saat ini.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Respons Pihak Ketiga

Saat ini yang tersedia hanya Body respons

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Variabel yang tersedia saat mengintegrasikan setiap antarmuka adalah sebagai berikut:

### List

| Parameter                 | Keterangan                                                        |
| ------------------------- | ----------------------------------------------------------------- |
| request.params.page      | Nomor halaman saat ini                                           |
| request.params.pageSize  | Jumlah per halaman                                               |
| request.params.filter    | Kondisi filter (harus sesuai dengan format Filter NocoBase)      |
| request.params.sort      | Aturan pengurutan (harus sesuai dengan format Sort NocoBase)     |
| request.params.appends   | Field yang dimuat sesuai kebutuhan, biasanya untuk field relasi   |
| request.params.fields    | Field yang hanya dikeluarkan oleh antarmuka (daftar putih)       |
| request.params.except    | Field yang dikecualikan (daftar hitam)                           |

### Get

| Parameter                   | Keterangan                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| request.params.filterByTk   | Wajib diisi, biasanya merupakan ID data saat ini                 |
| request.params.filter       | Kondisi filter (harus sesuai dengan format Filter NocoBase)      |
| request.params.appends      | Field yang dimuat sesuai kebutuhan, biasanya untuk field relasi   |
| request.params.fields       | Field yang hanya dikeluarkan oleh antarmuka (daftar putih)       |
| request.params.except       | Field yang dikecualikan (daftar hitam)                           |

### Create

| Parameter                  | Keterangan        |
| -------------------------- | ----------------- |
| request.params.whiteList   | Daftar putih      |
| request.params.blacklist   | Daftar hitam      |
| request.body               | Data awal yang dibuat |

### Update

| Parameter                   | Keterangan                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| request.params.filterByTk   | Wajib diisi, biasanya merupakan ID data saat ini                 |
| request.params.filter       | Kondisi filter (harus sesuai dengan format Filter NocoBase)      |
| request.params.whiteList    | Daftar putih                                                     |
| request.params.blacklist    | Daftar hitam                                                     |
| request.body                | Data yang diperbarui                                             |

### Destroy

| Parameter                   | Keterangan                                                        |
| --------------------------- | ----------------------------------------------------------------- |
| request.params.filterByTk   | Wajib diisi, biasanya merupakan ID data saat ini                 |
| request.params.filter       | Kondisi filter (harus sesuai dengan format Filter NocoBase)      |

## Mengonfigurasi Field

Ekstrak metadata field (Fields) dari data antarmuka CRUD resource yang diadaptasi untuk dijadikan field Collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Ekstrak metadata field.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Field dan pratinjau.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Edit field (caranya mirip dengan sumber data lainnya).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Menambahkan Blok Sumber Data REST API

Setelah Collection selesai dikonfigurasi, Anda dapat menambahkan blok melalui antarmuka.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
