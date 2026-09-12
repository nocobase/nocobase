---
title: "Sumber Data REST API"
description: "Hubungkan data dari sumber REST API, petakan resource RESTful menjadi Collection, konfigurasi pemetaan endpoint List/Get/Create/Update/Destroy, dan dukung operasi CRUD."
keywords: "Sumber Data REST API,API eksternal,pemetaan endpoint,pemetaan Collection,NocoBase"
---

# Sumber Data REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Pengenalan

Digunakan untuk menghubungkan data dari sumber REST API.

## Penginstalan

Plugin ini merupakan plugin komersial. Untuk mengetahui cara aktivasinya secara lengkap, silakan lihat: [Panduan Aktivasi Plugin Komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan Sumber REST API

Setelah plugin diaktifkan, pilih REST API dari menu dropdown Add new di pengelolaan sumber data.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Mengonfigurasi sumber REST API

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

Konfigurasi pemetaannya di NocoBase API adalah

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Untuk spesifikasi lengkap desain NocoBase API, lihat dokumentasi API

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Lihat bab 「NocoBase API - Core」

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Konfigurasi Collection sumber data REST API adalah sebagai berikut

### List

Konfigurasikan pemetaan endpoint untuk melihat daftar resource

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Konfigurasikan pemetaan endpoint untuk melihat detail resource

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Konfigurasikan pemetaan endpoint untuk membuat resource

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Konfigurasikan pemetaan endpoint untuk memperbarui resource
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Konfigurasikan pemetaan endpoint untuk menghapus resource

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

List dan Get adalah dua endpoint yang wajib dikonfigurasi.
## Menguji API

### Menghubungkan parameter permintaan

Contoh: mengonfigurasi parameter pagination untuk endpoint List (jika API pihak ketiga tidak mendukung pagination, pagination dilakukan berdasarkan data daftar yang diperoleh).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Perhatikan bahwa hanya variabel yang telah ditambahkan di dalam endpoint yang akan berlaku.

| Nama parameter integrasi API pihak ketiga | Parameter NocoBase          |
| ---------------------------------------- | --------------------------- |
| page                                     | {{request.params.page}}     |
| limit                                    | {{request.params.pageSize}} |

Klik Try it out untuk melakukan pengujian dan melihat hasil respons.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Konversi format respons

Format respons API pihak ketiga mungkin tidak sesuai dengan standar NocoBase. Konversi perlu dilakukan agar dapat ditampilkan dengan benar di frontend.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Sesuaikan aturan konversi berdasarkan format respons API pihak ketiga agar sesuai dengan standar output NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Penjelasan alur pengujian

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Konversi informasi kesalahan

Jika terjadi kesalahan pada API pihak ketiga, format informasi kesalahan dalam respons mungkin tidak sesuai dengan standar NocoBase. Konversi perlu dilakukan agar dapat ditampilkan dengan benar di frontend.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Jika konversi informasi kesalahan belum dikonfigurasi, secara default informasi tersebut akan dikonversi menjadi informasi kesalahan yang menyertakan kode status HTTP.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Setelah konversi informasi kesalahan dikonfigurasi agar sesuai dengan standar output NocoBase, frontend dapat menampilkan informasi kesalahan dari API pihak ketiga dengan benar.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variabel

Sumber data REST API menyediakan tiga jenis variabel untuk menghubungkan endpoint

- Variabel kustom sumber data
- Permintaan NocoBase
- Respons pihak ketiga

### Variabel kustom sumber data

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Permintaan NocoBase

- Params: parameter kueri URL (Search Params); Params setiap endpoint dapat berbeda;
- Headers: header permintaan, terutama menyediakan beberapa informasi X- kustom NocoBase;
- Body: Body permintaan;
- Token: API token dari permintaan NocoBase saat ini.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Respons pihak ketiga

Saat ini yang tersedia hanya Body respons

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Variabel yang tersedia saat menghubungkan setiap endpoint adalah sebagai berikut:

### List

| Parameter                 | Keterangan                                    |
| ------------------------- | --------------------------------------------- |
| request.params.page      | Nomor halaman saat ini                        |
| request.params.pageSize  | Jumlah item per halaman                       |
| request.params.filter    | Kondisi filter (harus sesuai format Filter NocoBase) |
| request.params.sort      | Aturan pengurutan (harus sesuai format Sort NocoBase) |
| request.params.appends   | Kolom yang dimuat sesuai kebutuhan, biasanya digunakan untuk memuat kolom relasi sesuai kebutuhan |
| request.params.fields    | Kolom yang hanya akan dikeluarkan oleh endpoint (daftar putih) |
| request.params.except    | Kolom yang harus dikecualikan (daftar hitam) |

### Get

| Parameter                   | Keterangan                                    |
| --------------------------- | --------------------------------------------- |
| request.params.filterByTk   | Wajib diisi, biasanya merupakan ID data saat ini |
| request.params.filter       | Kondisi filter (harus sesuai format Filter NocoBase) |
| request.params.appends      | Kolom yang dimuat sesuai kebutuhan, biasanya digunakan untuk memuat kolom relasi sesuai kebutuhan |
| request.params.fields       | Kolom yang hanya akan dikeluarkan oleh endpoint (daftar putih) |
| request.params.except       | Kolom yang harus dikecualikan (daftar hitam) |

### Create

| Parameter                | Keterangan          |
| ------------------------ | ------------------- |
| request.params.whiteList | Daftar putih         |
| request.params.blacklist | Daftar hitam         |
| request.body             | Data awal pembuatan  |

### Update

| Parameter                   | Keterangan                                    |
| --------------------------- | --------------------------------------------- |
| request.params.filterByTk   | Wajib diisi, biasanya merupakan ID data saat ini |
| request.params.filter       | Kondisi filter (harus sesuai format Filter NocoBase) |
| request.params.whiteList    | Daftar putih                                 |
| request.params.blacklist    | Daftar hitam                                 |
| request.body                | Data yang diperbarui                         |

### Destroy

| Parameter                   | Keterangan                                    |
| --------------------------- | --------------------------------------------- |
| request.params.filterByTk   | Wajib diisi, biasanya merupakan ID data saat ini |
| request.params.filter       | Kondisi filter (harus sesuai format Filter NocoBase) |

## Mengonfigurasi kolom

Ekstrak metadata kolom (Fields) dari data endpoint CRUD resource yang diadaptasi untuk digunakan sebagai kolom dalam collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Ekstrak metadata kolom.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Kolom dan pratinjau.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Edit kolom (caranya mirip dengan sumber data lainnya).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Menambahkan blok sumber data REST API

Setelah Collection selesai dikonfigurasi, Anda dapat menambahkan blok melalui antarmuka.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
