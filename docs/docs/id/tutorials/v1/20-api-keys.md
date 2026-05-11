# Menggunakan API Keys untuk Mendapatkan Data

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114233060688108&bvid=BV1m8ZuY4E2V&cid=29092153179&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Teman-teman yang terhormat, selamat datang di tutorial ini.
Dalam dokumen ini, saya akan memandu Anda langkah demi langkah cara menggunakan API key di NocoBase untuk mendapatkan data, dengan "Todo List" sebagai contoh, untuk membantu Anda memahami detail setiap tahap. Silakan baca konten di bawah dengan teliti, dan ikuti langkah-langkahnya.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Memahami Konsep API Key

Sebelum memulai, kita perlu mengklarifikasi terlebih dahulu: apa itu API key? Ini seperti tiket masuk yang digunakan untuk memastikan apakah request API berasal dari Pengguna yang sah. Ketika Anda mengakses sistem NocoBase melalui halaman web, aplikasi mobile, atau script backend, "kunci rahasia" ini akan membantu sistem dengan cepat memverifikasi identitas Anda.

Dalam header HTTP request, kita akan melihat format seperti berikut:

```txt
Authorization: Bearer {API key}
```

"Bearer" di sini menunjukkan bahwa yang mengikuti adalah API key yang telah diverifikasi, sehingga dapat dengan cepat memastikan permission pemohon.

Dalam aplikasi nyata, API key sering digunakan dalam skenario berikut:

1. **Akses Aplikasi Client**: Ketika Pengguna memanggil API melalui browser atau aplikasi mobile, sistem akan menggunakan API key untuk memverifikasi identitas Pengguna, untuk memastikan hanya Pengguna yang sah yang dapat mendapatkan data.
2. **Eksekusi Task Otomatis**: Task terjadwal backend atau script saat memperbarui data atau mencatat log, akan menggunakan API key untuk memastikan keamanan dan legalitas request.
3. **Development dan Testing**: Developer selama proses debug dan testing, memanfaatkan API key untuk mensimulasikan request nyata, untuk memastikan interface dapat merespons dengan benar.

Singkatnya, API key tidak hanya membantu kita memastikan identitas pemohon, tetapi juga dapat memantau situasi panggilan, membatasi frekuensi request, dan mencegah ancaman keamanan potensial, sehingga melindungi operasi NocoBase yang stabil.

## 2 Membuat API Key di NocoBase

### 2.1 Mengaktifkan Plugin [API Keys](https://docs-cn.nocobase.com/handbook/api-keys)

Pertama, pastikan plugin "Authentication: API Keys" bawaan NocoBase telah diaktifkan. Setelah diaktifkan, akan ditambahkan halaman konfigurasi [API Keys](https://docs-cn.nocobase.com/handbook/api-keys) di pusat pengaturan sistem.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Membuat Tabel Record Todo untuk Pengujian

Untuk memudahkan pengujian, kita buat terlebih dahulu sebuah tabel bernama `Tabel Record Todo (todos)`, dengan Field meliputi:

- `id`
- `Judul (title)`
- `Selesai (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Kemudian masukkan beberapa konten todo secara acak ke tabel ini, contohnya:

- Makan
- Tidur
- Main game

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Membuat dan Mengikat Role

Karena API key terikat dengan role Pengguna, sistem akan menentukan permission request berdasarkan role. Oleh karena itu, sebelum membuat API key, kita perlu membuat role terlebih dahulu dan memberikan permission yang sesuai.
Disarankan untuk membuat role uji bernama "Role API Todo", berikan role ini semua permission tabel record todo.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Jika saat membuat API key tidak dapat memilih "Role API Sistem Todo", mungkin karena Pengguna saat ini belum memiliki role tersebut. Pada saat ini, harap berikan role ini ke Pengguna saat ini terlebih dahulu:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Setelah memberikan role, refresh halaman, masuk ke halaman manajemen API key, klik "Tambah API Key", Anda akan melihat "Role API Sistem Todo" sudah muncul.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Untuk manajemen yang lebih akurat, kita juga dapat membuat "Pengguna API Todo" khusus untuk login ke sistem, melakukan pengujian permission, mengelola API key, dan memberikan "Role API Todo" terpisah ke Pengguna tersebut.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Membuat dan Menyimpan API Key

Setelah klik submit, sistem akan menampilkan prompt, memberitahukan API key telah berhasil dibuat, dan menampilkan key tersebut di popup. Pastikan untuk menyalin dan menyimpan key ini, karena demi alasan keamanan, sistem tidak akan menampilkannya lagi di kemudian hari.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Misalnya, Anda mungkin akan mendapatkan API key seperti berikut:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Hal yang Perlu Diperhatikan

- Masa berlaku API key bergantung pada durasi yang Anda pilih saat aplikasi.
- Logika pembuatan dan validasi API key terkait erat dengan `APP_KEY` di environment variable. Jangan ubah secara sembarangan, jika tidak semua API key di sistem akan tidak valid.

## 3 Menguji Validitas API Key

### 3.1 Menggunakan Plugin [API Documentation](https://docs-cn.nocobase.com/handbook/api-doc)

Buka plugin API documentation, Anda dapat melihat metode request, alamat, parameter, dan informasi header request setiap API.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Memahami Interface CRUD Dasar

Berikut adalah contoh API dasar yang disediakan NocoBase:

- **List Query (Interface list):**

  ```txt
  GET {baseURL}/{collectionName}:list
  Header request:
  - Authorization: Bearer <API key>

  ```
- **Tambah Record (Interface create):**

  ```txt
  POST {baseURL}/{collectionName}:create

  Header request:
  - Authorization: Bearer <API key>

  Body request (format JSON), contoh:
      {
          "title": "123"
      }
  ```
- **Update Record (Interface update):**

  ```txt
  POST {baseURL}/{collectionName}:update?filterByTk={id}
  Header request:
  - Authorization: Bearer <API key>

  Body request (format JSON), contoh:
      {
          "title": "123",
          "completed": true
      }
  ```
- **Hapus Record (Interface delete):**

  ```txt
  POST {baseURL}/{collectionName}:destroy?filterByTk={id}
  Header request:
  - Authorization: Bearer <API key>
  ```

Di mana, `{baseURL}` adalah alamat sistem NocoBase Anda, `{collectionName}` adalah nama tabel data. Misalnya, saat pengujian lokal, alamatnya adalah `localhost:13000`, nama tabel adalah `todos`, alamat request adalah:

```txt
http://localhost:13000/todos:list
```

### 3.3 Pengujian dengan Postman (Contoh Interface List)

Buka Postman, buat GET request baru, masukkan alamat request di atas, dan tambahkan `Authorization` di header request, dengan nilai API key Anda:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)
Setelah mengirim request, jika semuanya normal, Anda akan menerima response seperti berikut:

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

Jika API key tidak diotorisasi dengan benar, Anda mungkin akan melihat pesan error seperti berikut:

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

Jika menemui situasi seperti ini, periksa pengaturan permission role, status pengikatan API key, dan apakah format key benar.

### 3.4 Menyalin Kode Request dari Postman

Setelah pengujian berhasil, Anda dapat menyalin kode request dari interface List. Misalnya, contoh request curl di bawah ini disalin dari Postman:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Menampilkan Todo List di [Block iframe](https://docs-cn.nocobase.com/handbook/block-iframe)

Untuk membuat semua orang merasakan efek API request secara lebih intuitif, kita dapat menggunakan halaman HTML sederhana untuk menampilkan list todo yang didapat dari NocoBase. Silakan rujuk pada contoh kode di bawah ini:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
</head>
<body>
    <h1>Todo List</h1>
    <pre id="result"></pre>

    <script>
        fetch('http://localhost:13000/api/todos:list', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
            }
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    </script>
</body>
</html>
```

Kode di atas akan menampilkan "Todo List" sederhana di Block iframe. Setelah halaman dimuat, ia akan memanggil API untuk mendapatkan record todo, dan menampilkan hasilnya dalam bentuk JSON yang diformat di halaman.

Pada saat yang sama, melalui animasi di bawah ini, Anda dapat melihat efek dinamis dari keseluruhan request:

![202503031918-fetch](https://static-docs.nocobase.com/202503031918-fetch.gif)

## 5 Ringkasan

Melalui langkah-langkah di atas, kami telah menjelaskan secara detail cara membuat dan menggunakan API key di NocoBase. Dari aktivasi plugin, pembuatan tabel data, pengikatan role, hingga pengujian interface dan menampilkan data di Block iframe, setiap langkah sangat penting. Akhirnya, kami juga melalui bantuan DeepSeek, mengimplementasikan halaman todo list sederhana. Anda dapat memodifikasi dan memperluas kode sesuai kebutuhan Anda sendiri.

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

[Kode contoh halaman ini](https://forum.nocobase.com/t/api-api-key/3314) sudah disediakan di posting komunitas, silakan rujuk dan diskusikan. Semoga dokumen ini dapat memberikan panduan yang jelas bagi Anda, selamat belajar dan sukses dalam pengoperasian!
