---
title: "Template Print HTTP API"
description: "NocoBase Template Print HTTP API: melalui Action templatePrint untuk mencetak record yang dipilih, hasil filter saat ini, atau semua data yang memenuhi kondisi, dan mengunduh file Word, Excel, PowerPoint, atau PDF yang dihasilkan."
keywords: "Template Print,HTTP API,templatePrint,PDF,Print Record yang Dipilih,Print Semua,NocoBase"
---

# HTTP API

Template Print mendukung trigger render dan unduh dokumen langsung melalui HTTP API. Baik Block Detail maupun Block Tabel, pada dasarnya semua memicu Action `templatePrint` pada resource bisnis saat ini.

```shell
curl -X POST \
	-H "Authorization: Bearer <JWT>" \
	-H "Content-Type: application/json" \
	"http://localhost:3000/api/<resource_name>:templatePrint" \
	--data-raw '{...}'
```

Penjelasan:
- `<resource_name>` adalah nama resource yang sesuai dengan tabel data saat ini.
- Endpoint mengembalikan binary file stream, bukan data JSON.
- Pemanggil harus memiliki izin query untuk resource saat ini, serta izin penggunaan tombol Template Print yang sesuai.
- Pemanggilan endpoint perlu meneruskan token JWT berbasis login user melalui header Authorization, jika tidak akan ditolak akses.

## Parameter Request Body

| Parameter | Tipe | Wajib | Deskripsi |
| --- | --- | --- | --- |
| `templateName` | `string` | Ya | Nama Template, sesuai dengan identifier Template yang dikonfigurasi di manajemen Template. |
| `blockName` | `string` | Ya | Tipe Block. Block Tabel meneruskan `table`, Block Detail meneruskan `details`. |
| `timezone` | `string` | Tidak | Zona waktu, contoh `Asia/Jakarta`. Digunakan untuk render datetime di Template. |
| `uid` | `string` | Tidak | Schema uid tombol Template Print, digunakan untuk validasi izin. |
| `convertedToPDF` | `boolean` | Tidak | Apakah dikonversi ke PDF. Saat meneruskan `true`, mengembalikan file `.pdf`. |
| `queryParams` | `object` | Tidak | Parameter yang diteruskan ke query data dasar. |
| `queryParams.page` | `number \| null` | Tidak | Nomor halaman pagination. Set `null` berarti tidak memotong berdasarkan halaman. |
| `queryParams.pageSize` | `number \| null` | Tidak | Jumlah per halaman. Set `null` berarti tidak memotong berdasarkan halaman. |
| `queryParams.filter` | `object` | Tidak | Kondisi filter, akan otomatis digabungkan dengan kondisi filter ACL fixed. |
| `queryParams.appends` | `string[]` | Tidak | Field relasi yang perlu di-query tambahan. |
| `queryParams.filterByTk` | `string \| object` | Tidak | Sering digunakan di Block Detail, untuk menentukan nilai primary key. |
| `queryParams.sort` dll. parameter lain | `any` | Tidak | Parameter query lain akan diteruskan apa adanya ke query resource dasar. |

## Block Tabel

Block Tabel menggunakan endpoint yang sama, melalui `blockName: "table"` untuk menentukan mode print list. Server akan menjalankan query `find` pada resource, dan meneruskan array hasil ke Template.

### Print Record yang Dipilih atau Hasil Halaman Saat Ini

Cocok untuk skenario memilih sebagian record dari Block Tabel untuk diprint, atau mempertahankan konteks pagination halaman saat ini untuk diprint. Praktik umum adalah:

- Set `queryParams.page` dan `queryParams.pageSize` ke nomor halaman dan jumlah per halaman tabel saat ini.
- Susun primary key record yang dipilih menjadi kondisi `filter.id.$in`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": 20,
			"filter": {
				"id": {
					"$in": [1, 2]
				}
			},
			"appends": [],
			"page": 1
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Jakarta",
		"uid": "ixs3fx3x6is"
	}'
```

Arti dari request seperti ini:

- `blockName` adalah `table`, berarti merender Template berdasarkan data list.
- `filter.id.$in` digunakan untuk menentukan koleksi record yang akan diprint.
- `page` dan `pageSize` mempertahankan konteks pagination saat ini, agar konsisten dengan perilaku UI.
- `appends` dapat ditambahkan field relasi sesuai kebutuhan.

### Print Semua Data yang Memenuhi Kondisi

Cocok untuk cara pemanggilan saat klik "Print Semua Record" pada Block Tabel. Saat ini tidak lagi dipotong berdasarkan pagination halaman saat ini, melainkan langsung mengambil semua data yang memenuhi kondisi filter saat ini.

Poin kunci adalah meneruskan `queryParams.page` dan `queryParams.pageSize` secara eksplisit sebagai `null`.

```shell
curl 'https://<your-host>/api/<resource_name>:templatePrint' \
	-H 'Authorization: Bearer <JWT>' \
	-H 'Content-Type: application/json' \
	--data-raw '{
		"queryParams": {
			"pageSize": null,
			"filter": {},
			"appends": [],
			"page": null
		},
		"templateName": "9012hy7ahn4",
		"blockName": "table",
		"timezone": "Asia/Jakarta",
		"uid": "ixs3fx3x6is"
	}'
```

Arti dari request seperti ini:

- `page: null` dan `pageSize: null` berarti membatalkan batasan pagination.
- `filter: {}` berarti tidak menambahkan kondisi filter tambahan; jika sudah ada kondisi filter di UI, dapat juga langsung ditempatkan di sini.
- Server akan men-query semua data yang memenuhi kondisi dan render Template secara batch.

> Perhatian: Block Tabel maksimal print 300 record sekaligus. Saat melebihi batas, endpoint akan mengembalikan error `400`.

## Block Detail

Block Detail juga menggunakan Action `templatePrint`, tetapi biasanya meneruskan:

- `blockName: "details"`
- `queryParams.filterByTk` untuk menentukan primary key record saat ini
- `queryParams.appends` untuk menentukan field relasi yang perlu di-query tambahan

Server akan menjalankan query `findOne` pada resource, dan meneruskan objek hasil ke Template.

## Hasil Pengembalian

Setelah pemanggilan berhasil, endpoint langsung mengembalikan file stream, header response tipikal sebagai berikut:

```http
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="<template-title>-<suffix>.<ext>"
```

Penjelasan:

- Saat `convertedToPDF` adalah `true`, ekstensi file yang dikembalikan adalah `.pdf`.
- Jika tidak, mengembalikan file dengan tipe asli Template, contoh `.docx`, `.xlsx`, atau `.pptx`.
- Frontend biasanya memicu unduh browser berdasarkan nama file di `Content-Disposition`.

## Resource Lainnya
- [Menggunakan API Key di NocoBase](../integration/api-keys/usage.md)
