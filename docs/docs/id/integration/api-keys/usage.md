:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Menggunakan Kunci API di NocoBase

Panduan ini menunjukkan cara menggunakan Kunci API di NocoBase untuk mengambil data melalui contoh praktis "Daftar Tugas". Ikuti petunjuk langkah demi langkah di bawah ini untuk memahami alur kerja secara lengkap.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Memahami Kunci API

Kunci API adalah token keamanan yang digunakan untuk mengautentikasi permintaan API dari pengguna yang berwenang. Kunci ini berfungsi sebagai kredensial yang memvalidasi identitas pemohon saat mengakses sistem NocoBase melalui aplikasi web, aplikasi seluler, atau skrip backend.

Dalam header permintaan HTTP, formatnya adalah:

```txt
Authorization: Bearer {Kunci API}
```

Prefiks "Bearer" menunjukkan bahwa string yang mengikutinya adalah Kunci API terautentikasi yang digunakan untuk memverifikasi izin pemohon.

### Kasus Penggunaan Umum

Kunci API biasanya digunakan dalam skenario berikut:

1.  **Akses Aplikasi Klien**: Peramban web dan aplikasi seluler menggunakan Kunci API untuk mengautentikasi identitas pengguna, memastikan hanya pengguna yang berwenang yang dapat mengakses data.
2.  **Eksekusi Tugas Otomatis**: Proses latar belakang dan tugas terjadwal menggunakan Kunci API untuk secara aman menjalankan pembaruan, sinkronisasi data, dan operasi pencatatan log.
3.  **Pengembangan dan Pengujian**: Pengembang menggunakan Kunci API selama proses debug dan pengujian untuk mensimulasikan permintaan terautentikasi dan memverifikasi respons API.

Kunci API memberikan berbagai manfaat keamanan: verifikasi identitas, pemantauan penggunaan, pembatasan laju permintaan, dan pencegahan ancaman, yang semuanya memastikan operasi NocoBase berjalan stabil dan aman.

## 2 Membuat Kunci API di NocoBase

### 2.1 Aktifkan Plugin Autentikasi: Kunci API

Pastikan **plugin** bawaan [Autentikasi: Kunci API](/plugins/@nocobase/plugin-api-keys/) telah diaktifkan. Setelah diaktifkan, halaman konfigurasi Kunci API yang baru akan muncul di pengaturan sistem.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Membuat **Koleksi** Uji

Untuk tujuan demonstrasi, buat sebuah **koleksi** bernama `todos` dengan bidang-bidang berikut:

-   `id`
-   `judul (title)`
-   `selesai (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Tambahkan beberapa catatan contoh ke **koleksi**:

-   makan
-   tidur
-   bermain game

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Membuat dan Menetapkan Peran

Kunci API terikat pada peran pengguna, dan sistem menentukan izin permintaan berdasarkan peran yang ditetapkan. Sebelum membuat Kunci API, Anda harus membuat peran dan mengonfigurasi izin yang sesuai. Buat peran bernama "Peran API Daftar Tugas" dan berikan akses penuh ke **koleksi** `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Jika "Peran API Daftar Tugas" tidak tersedia saat membuat Kunci API, pastikan pengguna saat ini telah ditetapkan peran ini:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Setelah penetapan peran, segarkan halaman dan navigasikan ke halaman manajemen Kunci API. Klik "Tambah Kunci API" untuk memverifikasi bahwa "Peran API Daftar Tugas" muncul dalam pilihan peran.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Untuk kontrol akses yang lebih baik, pertimbangkan untuk membuat akun pengguna khusus (misalnya, "Pengguna API Daftar Tugas") yang secara spesifik digunakan untuk manajemen dan pengujian Kunci API. Tetapkan "Peran API Daftar Tugas" kepada pengguna ini.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Membuat dan Menyimpan Kunci API

Setelah mengirimkan formulir, sistem akan menampilkan pesan konfirmasi dengan Kunci API yang baru dibuat. **Penting**: Segera salin dan simpan kunci ini dengan aman, karena kunci ini tidak akan ditampilkan lagi untuk alasan keamanan.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Contoh Kunci API:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Catatan Penting

-   Masa berlaku Kunci API ditentukan oleh pengaturan kedaluwarsa yang dikonfigurasi saat pembuatan.
-   Pembuatan dan verifikasi Kunci API bergantung pada variabel lingkungan `APP_KEY`. **Jangan ubah variabel ini**, karena hal tersebut akan membatalkan semua Kunci API yang ada di sistem.

## 3 Menguji Autentikasi Kunci API

### 3.1 Menggunakan **Plugin** Dokumentasi API

Buka **plugin** [Dokumentasi API](/plugins/@nocobase/plugin-api-doc/) untuk melihat metode permintaan, URL, parameter, dan header permintaan untuk setiap endpoint API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Memahami Operasi CRUD Dasar

NocoBase menyediakan API CRUD (Create, Read, Update, Delete) standar untuk manipulasi data:

-   **Kueri Daftar (API `list`):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Header Permintaan:
    - Authorization: Bearer <Kunci API>

    ```
-   **Membuat Catatan (API `create`):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Header Permintaan:
    - Authorization: Bearer <Kunci API>

    Body Permintaan (dalam format JSON), contoh:
        {
            "title": "123"
        }
    ```
-   **Memperbarui Catatan (API `update`):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Header Permintaan:
    - Authorization: Bearer <Kunci API>

    Body Permintaan (dalam format JSON), contoh:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Menghapus Catatan (API `destroy`):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Header Permintaan:
    - Authorization: Bearer <Kunci API>
    ```

Di mana:
-   `{baseURL}`: URL sistem NocoBase Anda
-   `{collectionName}`: Nama **koleksi**

Contoh: Untuk instans lokal di `localhost:13000` dengan **koleksi** bernama `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Menguji dengan Postman

Buat permintaan GET di Postman dengan konfigurasi berikut:
-   **URL**: Endpoint permintaan (misalnya, `http://localhost:13000/api/todos:list`)
-   **Headers**: Tambahkan header `Authorization` dengan nilai:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Respons Berhasil:**

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

**Respons Error (Kunci API Tidak Valid/Kedaluwarsa):**

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

**Pemecahan Masalah**: Jika autentikasi gagal, verifikasi izin peran, pengikatan Kunci API, dan format token.

### 3.4 Mengekspor Kode Permintaan

Postman memungkinkan Anda mengekspor permintaan dalam berbagai format. Contoh perintah cURL:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Menggunakan Kunci API dalam Blok JS

NocoBase 2.0 mendukung penulisan kode JavaScript asli secara langsung di halaman menggunakan blok JS. Contoh ini menunjukkan cara mengambil data API eksternal menggunakan Kunci API.

### Membuat Blok JS

Di halaman NocoBase Anda, tambahkan blok JS dan gunakan kode berikut untuk mengambil data daftar tugas:

```javascript
// Mengambil data daftar tugas menggunakan Kunci API
async function fetchTodos() {
  try {
    // Menampilkan pesan memuat
    ctx.message.loading('Sedang mengambil data...');

    // Memuat pustaka axios untuk permintaan HTTP
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('Gagal memuat pustaka HTTP');
      return;
    }

    // Kunci API (ganti dengan kunci API Anda yang sebenarnya)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Melakukan permintaan API
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Menampilkan hasil
    console.log('Daftar Tugas:', response.data);
    ctx.message.success(`Berhasil mengambil ${response.data.data.length} item data`);

    // Anda dapat memproses data di sini
    // Contoh: menampilkan ke tabel, memperbarui bidang formulir, dll.

  } catch (error) {
    console.error('Error saat mengambil data:', error);
    ctx.message.error('Gagal mengambil data: ' + error.message);
  }
}

// Menjalankan fungsi
fetchTodos();
```

### Poin-Poin Penting

-   **ctx.requireAsync()**: Memuat pustaka eksternal (seperti axios) secara dinamis untuk permintaan HTTP
-   **ctx.message**: Menampilkan notifikasi pengguna (memuat, berhasil, pesan error)
-   **Autentikasi Kunci API**: Meneruskan Kunci API dalam header permintaan `Authorization` dengan prefiks `Bearer`
-   **Penanganan Respons**: Memproses data yang dikembalikan sesuai kebutuhan (menampilkan, mengubah, dll.)

## 5 Ringkasan

Panduan ini mencakup alur kerja lengkap untuk menggunakan Kunci API di NocoBase:

1.  **Pengaturan**: Mengaktifkan **plugin** Kunci API dan membuat **koleksi** uji
2.  **Konfigurasi**: Membuat peran dengan izin yang sesuai dan membuat Kunci API
3.  **Pengujian**: Memvalidasi autentikasi Kunci API menggunakan Postman dan **plugin** Dokumentasi API
4.  **Integrasi**: Menggunakan Kunci API dalam blok JS

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Sumber Daya Tambahan:**
-   [Dokumentasi **Plugin** Kunci API](/plugins/@nocobase/plugin-api-keys/)
-   [**Plugin** Dokumentasi API](/plugins/@nocobase/plugin-api-doc/)