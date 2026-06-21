---
title: "Data Source REST API"
description: "Mengintegrasikan data dari sumber REST API, memetakan resource RESTful sebagai Collection, mengonfigurasi pemetaan endpoint List/Get/Create/Update/Destroy, mendukung operasi CRUD."
keywords: "Data Source REST API,API eksternal,pemetaan endpoint,pemetaan Collection,NocoBase"
---

# Data Source REST API

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Pengantar

Digunakan untuk mengintegrasikan data dari sumber REST API.

## Instalasi

Plugin ini adalah plugin komersial. Untuk cara aktivasi detail, harap lihat: [Panduan Aktivasi Plugin Komersial](https://www.nocobase.com/cn/blog/nocobase-commercial-license-activation-guide)

## Menambahkan Sumber REST API

Setelah plugin diaktifkan, pilih REST API pada dropdown Add new di manajemen data source.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

Konfigurasi sumber REST API

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## Menambahkan Collection

Resource RESTful adalah Collection NocoBase, contohnya resource Users

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

Pemetaan ke konfigurasi NocoBase API adalah

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

Spesifikasi desain NocoBase API lengkap dapat dilihat di dokumentasi API

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

Lihat bagian "NocoBase API - Core"

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

Konfigurasi Collection data source REST API sebagai berikut

### List

Konfigurasi pemetaan endpoint untuk melihat daftar resource

![20251201162457](https://static-docs.nocobase.com/20251201162457.png)

### Get

Konfigurasi pemetaan endpoint untuk melihat detail resource

![20251201162744](https://static-docs.nocobase.com/20251201162744.png)

### Create

Konfigurasi pemetaan endpoint untuk membuat resource

![20251201163000](https://static-docs.nocobase.com/20251201163000.png)

### Update

Konfigurasi pemetaan endpoint untuk update resource
![20251201163058](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Konfigurasi pemetaan endpoint untuk menghapus resource

![20251201163204](https://static-docs.nocobase.com/20251201163204.png)

Di antaranya, List dan Get adalah dua endpoint yang wajib dikonfigurasi.
## Debug API

### Mapping Parameter Request

Contoh: Mengonfigurasi parameter pagination untuk endpoint List (jika API pihak ketiga sendiri tidak mendukung pagination, maka pagination dilakukan dengan data daftar yang diambil).

![20251201163500](https://static-docs.nocobase.com/20251201163500.png)

Perhatikan, hanya variabel yang sudah ditambahkan di endpoint yang akan berlaku.

| Nama Parameter Integrasi API Pihak Ketiga | Parameter NocoBase               |
| --------------------- | --------------------------- |
| page                  | {{request.params.page}}     |
| limit                 | {{request.params.pageSize}} |

Anda dapat mengklik Try it out untuk debug, dan melihat hasil respons.

![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Konversi Format Respons

Format respons API pihak ketiga mungkin tidak sesuai dengan standar NocoBase. Perlu dikonversi sebelum dapat ditampilkan dengan benar di front-end.

![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Sesuaikan aturan konversi sesuai format respons API pihak ketiga, agar sesuai dengan standar output NocoBase.

![20251201164629](https://static-docs.nocobase.com/20251201164629.png)

Penjelasan alur debug

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

### Konversi Informasi Exception

Saat API pihak ketiga mengalami exception, format informasi exception yang direspons mungkin tidak sesuai dengan standar NocoBase. Perlu dikonversi sebelum dapat ditampilkan dengan benar di front-end.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

Saat konversi informasi exception belum dikonfigurasi, secara default akan dikonversi menjadi informasi exception yang berisi http status code.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

Setelah konversi informasi exception dikonfigurasi, agar sesuai dengan standar output NocoBase, front-end dapat menampilkan informasi exception API pihak ketiga dengan benar.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variabel

Data Source REST API menyediakan tiga jenis variabel untuk integrasi endpoint

- Variabel Custom Data Source
- Request NocoBase
- Respons Pihak Ketiga

### Variabel Custom Data Source

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### Request NocoBase

- Params: Search Params (Query Parameter URL), Params untuk setiap endpoint berbeda;
- Headers: Body request, terutama menyediakan beberapa informasi X- custom NocoBase;
- Body: Body request;
- Token: API token dari request NocoBase saat ini.

![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Respons Pihak Ketiga

Saat ini hanya tersedia Body respons

![20251201164915](https://static-docs.nocobase.com/20251201164915.png)

Variabel yang dapat digunakan saat integrasi setiap endpoint sebagai berikut:

### List

| Parameter                    | Deskripsi                                         |
| ----------------------- | -------------------------------------------- |
| request.params.page     | Halaman saat ini                                     |
| request.params.pageSize | Jumlah per halaman                                     |
| request.params.filter   | Kondisi filter (perlu sesuai format Filter NocoBase) |
| request.params.sort     | Aturan sort (perlu sesuai format Sort NocoBase)   |
| request.params.appends  | Field yang dimuat sesuai kebutuhan, biasanya untuk pemuatan field relasi sesuai kebutuhan   |
| request.params.fields   | Field mana saja yang dikeluarkan endpoint (whitelist)                 |
| request.params.except   | Field mana saja yang dikecualikan (blacklist)                       |

### Get

| Parameter                      | Deskripsi                                         |
| ------------------------- | -------------------------------------------- |
| request.params.filterByTk | Wajib, biasanya berupa ID data saat ini                    |
| request.params.filter     | Kondisi filter (perlu sesuai format Filter NocoBase) |
| request.params.appends    | Field yang dimuat sesuai kebutuhan, biasanya untuk pemuatan field relasi sesuai kebutuhan   |
| request.params.fields     | Field mana saja yang dikeluarkan endpoint (whitelist)                 |
| request.params.except     | Field mana saja yang dikecualikan (blacklist)                       |

### Create

| Parameter                     | Deskripsi             |
| ------------------------ | ---------------- |
| request.params.whiteList | Whitelist           |
| request.params.blacklist | Blacklist           |
| request.body             | Data inisialisasi yang dibuat |

### Update

| Parameter                      | Deskripsi                                         |
| ------------------------- | -------------------------------------------- |
| request.params.filterByTk | Wajib, biasanya berupa ID data saat ini                    |
| request.params.filter     | Kondisi filter (perlu sesuai format Filter NocoBase) |
| request.params.whiteList  | Whitelist                                       |
| request.params.blacklist  | Blacklist                                       |
| request.body              | Data yang diupdate                                   |

### Destroy

| Parameter                      | Deskripsi                                         |
| ------------------------- | -------------------------------------------- |
| request.params.filterByTk | Wajib, biasanya berupa ID data saat ini                    |
| request.params.filter     | Kondisi filter (perlu sesuai format Filter NocoBase) |

## Konfigurasi Field

Dari data endpoint CRUD resource yang diadaptasi, ekstrak metadata field (Fields) sebagai field collection.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

Ekstrak metadata field.

![20251201165133](https://static-docs.nocobase.com/20251201165133.png)

Field dan pratinjau.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

Edit field (mirip dengan cara di data source lain).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## Menambahkan Block Data Source REST API

Setelah Collection dikonfigurasi, Anda dapat pergi ke antarmuka untuk menambahkan block.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
