---
title: "Tutorial Penggunaan API Key"
description: "Praktik API Key: contoh todo, buat peran dan key, pengujian Postman, antarmuka CRUD, panggilan JS Block, termasuk Authorization Bearer dan contoh curl."
keywords: "penggunaan API Key,pengujian Postman,antarmuka CRUD,Authorization Bearer,JS Block,contoh todo,NocoBase"
---

# Menggunakan API Key di NocoBase

Panduan ini mendemonstrasikan cara menggunakan API Key di NocoBase untuk mendapatkan data melalui contoh "todo" yang nyata. Ikuti petunjuk langkah demi langkah berikut untuk memahami alur kerja yang lengkap.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Memahami API Key

API Key adalah token keamanan yang digunakan untuk memvalidasi API Request dari pengguna yang berwenang. Ia berfungsi sebagai kredensial untuk memvalidasi identitas pemohon saat mengakses sistem NocoBase melalui aplikasi web, aplikasi mobile, atau skrip backend.

Format pada header HTTP Request:

```txt
Authorization: Bearer {API Key}
```

Awalan "Bearer" menunjukkan bahwa setelahnya adalah API Key terautentikasi yang digunakan untuk memvalidasi izin pemohon.

### Skenario Penggunaan Umum

API Key biasanya digunakan dalam skenario berikut:

1. **Akses aplikasi klien**: browser web dan aplikasi mobile menggunakan API Key untuk memvalidasi identitas pengguna, memastikan hanya pengguna yang berwenang yang dapat mengakses data.
2. **Eksekusi tugas otomatis**: proses background dan tugas terjadwal menggunakan API Key untuk melakukan operasi pembaruan, sinkronisasi data, dan pencatatan log secara aman.
3. **Pengembangan dan pengujian**: developer menggunakan API Key selama debugging dan pengujian untuk meniru request terautentikasi dan memvalidasi respons API.

API Key memberikan beberapa keuntungan keamanan: validasi identitas, pemantauan penggunaan, pembatasan laju request, dan pencegahan ancaman, memastikan operasi NocoBase yang stabil dan aman.

## 2 Membuat API Key di NocoBase

### 2.1 Aktifkan Plugin Autentikasi: API Key

Pastikan Plugin [Autentikasi: API Key](/plugins/@nocobase/plugin-api-keys/index.md) bawaan sudah diaktifkan. Setelah diaktifkan, halaman konfigurasi API Key baru akan muncul pada pengaturan sistem.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Buat Tabel Data Pengujian

Untuk tujuan demonstrasi, buat tabel data bernama `todos` dengan field-field berikut:

- `id`
- `judul (title)`
- `selesai (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Tambahkan beberapa record contoh ke tabel data:

- Makan
- Tidur
- Main game

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Buat dan Tetapkan Peran

API Key terikat pada peran pengguna; sistem menentukan izin request berdasarkan peran yang ditetapkan. Sebelum membuat API Key, Anda harus membuat peran dan mengkonfigurasi izin yang sesuai. Buat peran bernama "Peran API Todo" dan beri akses penuh ke tabel data `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Jika "Peran API Todo" tidak tersedia saat membuat API Key, pastikan pengguna saat ini telah ditetapkan peran ini:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Setelah peran ditetapkan, refresh halaman dan navigasikan ke halaman manajemen API Key. Klik "Tambahkan API Key" untuk memverifikasi bahwa "Peran API Todo" muncul pada pemilihan peran.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Untuk kontrol akses yang lebih baik, pertimbangkan untuk membuat akun pengguna khusus (misalnya "Pengguna API Todo") khusus untuk manajemen dan pengujian API Key. Tetapkan "Peran API Todo" ke pengguna ini.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Hasilkan dan Simpan API Key

Setelah formulir disubmit, sistem akan menampilkan pesan konfirmasi dan API Key yang baru dihasilkan. **Catatan Penting**: segera salin dan simpan key ini dengan aman; karena alasan keamanan, key ini tidak akan ditampilkan lagi.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Contoh API Key:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Catatan Penting

- Masa berlaku API Key ditentukan oleh pengaturan kedaluwarsa yang dikonfigurasi saat pembuatan.
- Pembuatan dan validasi API Key bergantung pada variabel lingkungan `APP_KEY`. **Jangan modifikasi variabel ini**, jika tidak semua API Key yang ada di sistem akan tidak berlaku.

## 3 Pengujian Autentikasi API Key

### 3.1 Menggunakan Plugin Dokumentasi API

Buka Plugin [Dokumentasi API](/plugins/@nocobase/plugin-api-doc/index.md), lihat metode request, URL, parameter, dan header untuk setiap endpoint API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Memahami Operasi CRUD Dasar

NocoBase menyediakan API CRUD (Create, Read, Update, Delete) standar untuk operasi data:

- **Query daftar (antarmuka list):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Header:
  - Authorization: Bearer <API Key>

  ```
- **Tambahkan record (antarmuka create):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Header:
  - Authorization: Bearer <API Key>

  Body request (format JSON), contoh:
      {
          "title": "123"
      }
  ```
- **Modifikasi record (antarmuka update):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Header:
  - Authorization: Bearer <API Key>

  Body request (format JSON), contoh:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Hapus record (antarmuka delete):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Header:
  - Authorization: Bearer <API Key>
  ```

Dimana:
- `{baseURL}`: URL sistem NocoBase
- `{collectionName}`: nama tabel data

Contoh: instance lokal `localhost:13000`, nama tabel data `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Pengujian dengan Postman

Buat GET Request di Postman dengan konfigurasi sebagai berikut:
- **URL**: endpoint request (misalnya `http://localhost:13000/api/todos:list`)
- **Headers**: tambahkan header `Authorization` dengan nilai:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Respons sukses:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Respons error (API Key tidak valid/kedaluwarsa):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Pemecahan Masalah**: jika autentikasi gagal, validasi izin peran, binding API Key, dan format token.

### 3.4 Ekspor Kode Request

Postman memungkinkan ekspor request dalam berbagai format. Contoh perintah cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Menggunakan API Key di JS Block

NocoBase 2.0 mendukung penulisan kode JavaScript native langsung pada halaman menggunakan JS Block. Contoh ini mendemonstrasikan cara menggunakan API Key untuk mendapatkan data API eksternal.

### Buat JS Block

Tambahkan JS Block pada halaman NocoBase dan gunakan kode berikut untuk mendapatkan data todo:

```javascript
// Gunakan API Key untuk mendapatkan data todo
async function fetchTodos() {
  try {
    // Tampilkan tip loading
    ctx.message.loading('Sedang mengambil data...');

    // Muat library axios untuk HTTP Request
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Gagal memuat library HTTP');
      return;
    }

    // API Key (ganti dengan API Key Anda yang sebenarnya)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Inisiasi API Request
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Tampilkan hasil
    console.log('Daftar todo:', response.data);
    ctx.message.success(`Berhasil mendapatkan ${response.data.data.length} record`);

    // Anda dapat memproses data di sini
    // Contoh: tampilkan ke tabel, update field formulir, dll.

  } catch (error) {
    console.error('Error mengambil data:', error);
    ctx.message.error('Gagal mengambil data: ' + error.message);
  }
}

// Eksekusi fungsi
fetchTodos();
```

### Poin Penting

- **ctx.requireAsync()**: muat library eksternal secara dinamis (seperti axios) untuk HTTP Request
- **ctx.message**: tampilkan notifikasi pengguna (pesan loading, sukses, error)
- **Autentikasi API Key**: teruskan API Key di header `Authorization` dengan awalan `Bearer`
- **Penanganan respons**: proses data yang dikembalikan sesuai kebutuhan (tampilkan, transformasi, dll.)

## 5 Ringkasan

Panduan ini mencakup alur kerja lengkap penggunaan API Key di NocoBase:

1. **Persiapan**: aktifkan Plugin API Key dan buat tabel data pengujian
2. **Konfigurasi**: buat peran dengan izin yang sesuai dan hasilkan API Key
3. **Pengujian**: validasi autentikasi API Key dengan Postman dan Plugin Dokumentasi API
4. **Integrasi**: gunakan API Key di JS Block

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)


**Sumber daya tambahan:**
- [Dokumentasi Plugin API Key](/plugins/@nocobase/plugin-api-keys/index.md)
- [Plugin Dokumentasi API](/plugins/@nocobase/plugin-api-doc/index.md)
