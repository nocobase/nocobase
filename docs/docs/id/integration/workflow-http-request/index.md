:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Integrasi Permintaan HTTP Alur Kerja

Melalui node Permintaan HTTP, alur kerja NocoBase dapat secara proaktif mengirimkan permintaan ke layanan HTTP mana pun, memungkinkan pertukaran data dan integrasi bisnis dengan sistem eksternal.

## Gambaran Umum

Node Permintaan HTTP adalah komponen integrasi inti dalam alur kerja, yang memungkinkan Anda memanggil API pihak ketiga, antarmuka layanan internal, atau layanan web lainnya selama eksekusi alur kerja untuk mengambil data atau memicu operasi eksternal.

## Skenario Penggunaan Umum

### Pengambilan Data

- **Kueri Data Pihak Ketiga**: Mengambil data *real-time* dari API cuaca, API nilai tukar, dll.
- **Resolusi Alamat**: Memanggil API layanan peta untuk penguraian alamat dan *geocoding*.
- **Sinkronisasi Data Perusahaan**: Mengambil data pelanggan, pesanan, dll. dari sistem CRM, ERP.

### Pemicu Bisnis

- **Dorongan Pesan**: Memanggil layanan SMS, email, WeCom, dll. untuk mengirim notifikasi.
- **Permintaan Pembayaran**: Menginisiasi pembayaran, pengembalian dana, dll. dengan *gateway* pembayaran.
- **Pemrosesan Pesanan**: Mengirimkan resi pengiriman, menanyakan status logistik dengan sistem pengiriman.

### Integrasi Sistem

- **Panggilan *Microservice***: Memanggil API layanan lain dalam arsitektur *microservice*.
- **Pelaporan Data**: Melaporkan data bisnis ke platform analitik, sistem pemantauan.
- **Layanan Pihak Ketiga**: Mengintegrasikan layanan AI, pengenalan OCR, sintesis suara, dll.

### Otomatisasi

- **Tugas Terjadwal**: Memanggil API eksternal secara berkala untuk menyinkronkan data.
- **Respons Peristiwa**: Secara otomatis memanggil API eksternal saat data berubah untuk memberi tahu sistem terkait.
- **Alur Kerja Persetujuan**: Mengirimkan permintaan persetujuan melalui API sistem persetujuan.

## Fitur

### Dukungan HTTP Lengkap

- Mendukung semua metode HTTP: GET, POST, PUT, PATCH, DELETE.
- Mendukung *header* permintaan kustom (*Headers*).
- Mendukung berbagai format data: JSON, data formulir, XML, dll.
- Mendukung berbagai jenis parameter: parameter URL, parameter jalur, *body* permintaan, dll.

### Pemrosesan Data Fleksibel

- **Referensi Variabel**: Membuat permintaan secara dinamis menggunakan variabel alur kerja.
- **Penguraian Respons**: Secara otomatis mengurai respons JSON dan mengekstrak data yang diperlukan.
- **Transformasi Data**: Mengubah format data permintaan dan data respons.
- **Penanganan Kesalahan**: Mengonfigurasi strategi coba lagi, pengaturan *timeout*, logika penanganan kesalahan.

### Autentikasi Keamanan

- **Autentikasi Dasar**: Autentikasi dasar HTTP.
- **Token Pembawa (*Bearer Token*)**: Autentikasi token.
- **Kunci API (*API Key*)**: Autentikasi kunci API kustom.
- ***Header* Kustom**: Mendukung metode autentikasi apa pun.

## Langkah Penggunaan

### 1. Memverifikasi Plugin Telah Diaktifkan

Node Permintaan HTTP adalah fitur bawaan dari plugin **alur kerja**. Pastikan plugin **[alur kerja](/plugins/@nocobase/plugin-workflow/)** telah diaktifkan.

### 2. Menambahkan Node Permintaan HTTP ke Alur Kerja

1. Buat atau edit sebuah alur kerja.
2. Tambahkan node **Permintaan HTTP** pada posisi yang diinginkan.

![HTTP Request - Add Node](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Konfigurasi parameter permintaan.

### 3. Mengonfigurasi Parameter Permintaan

![HTTP Request Node - Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Konfigurasi Dasar

- **URL Permintaan**: Alamat API target, mendukung penggunaan variabel.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Metode Permintaan**: Pilih GET, POST, PUT, DELETE, dll.

- ***Header* Permintaan**: Konfigurasi *Header* HTTP.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Parameter Permintaan**:
  - **Parameter Kueri**: Parameter kueri URL.
  - **Parameter *Body***: Data *body* permintaan (POST/PUT).

#### Konfigurasi Lanjutan

- **Waktu *Timeout***: Atur *timeout* permintaan (standar 30 detik).
- **Coba Lagi Saat Gagal**: Konfigurasi jumlah coba lagi dan interval coba lagi.
- **Abaikan Kegagalan**: Alur kerja akan terus berjalan meskipun permintaan gagal.
- **Pengaturan Proksi**: Konfigurasi proksi HTTP (jika diperlukan).

### 4. Menggunakan Data Respons

Setelah eksekusi node Permintaan HTTP, data respons dapat digunakan pada node-node berikutnya:

- `{{$node.data.status}}`: Kode status HTTP.
- `{{$node.data.headers}}`: *Header* respons.
- `{{$node.data.data}}`: Data *body* respons.
- `{{$node.data.error}}`: Pesan kesalahan (jika permintaan gagal).

![HTTP Request Node - Response Usage](https://static-docs.nocobase.com/20240529110610.png)

## Skenario Contoh

### Contoh 1: Mendapatkan Informasi Cuaca

```javascript
// Konfigurasi
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Menggunakan Respons
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Contoh 2: Mengirim Pesan WeCom

```javascript
// Konfigurasi
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Pesanan {{$context.orderId}} telah dikirim"
  }
}
```

### Contoh 3: Menanyakan Status Pembayaran

```javascript
// Konfigurasi
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Logika Kondisional
Jika {{$node.data.data.status}} sama dengan "paid"
  - Perbarui status pesanan menjadi "Dibayar"
  - Kirim notifikasi pembayaran berhasil
Jika tidak, jika {{$node.data.data.status}} sama dengan "pending"
  - Pertahankan status pesanan sebagai "Menunggu Pembayaran"
Jika tidak
  - Catat kegagalan pembayaran
  - Beri tahu administrator untuk menangani pengecualian
```

### Contoh 4: Menyinkronkan Data ke CRM

```javascript
// Konfigurasi
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Konfigurasi Autentikasi

### Basic Authentication

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API Key

```javascript
// Di Header
Headers:
  X-API-Key: your-api-key

// Atau di Kueri
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Pertama, dapatkan *access_token*, lalu gunakan:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Penanganan Kesalahan dan *Debugging*

### Kesalahan Umum

1.  **Koneksi *Timeout***: Periksa koneksi jaringan, tingkatkan waktu *timeout*.
2.  **401 Tidak Sah**: Verifikasi kredensial autentikasi.
3.  **404 Tidak Ditemukan**: Periksa apakah URL sudah benar.
4.  **500 Kesalahan Server**: Periksa status layanan penyedia API.

### Tips *Debugging*

1.  **Gunakan Node Log**: Tambahkan node log sebelum dan sesudah permintaan HTTP untuk mencatat data permintaan dan respons.

2.  **Periksa Log Eksekusi**: Log eksekusi alur kerja berisi informasi permintaan dan respons yang terperinci.

3.  **Alat Pengujian**: Uji API terlebih dahulu menggunakan alat seperti Postman, cURL, dll.

4.  **Penanganan Kesalahan**: Tambahkan logika kondisional untuk menangani status respons yang berbeda.

```javascript
Jika {{$node.data.status}} >= 200 dan {{$node.data.status}} < 300
  - Tangani logika berhasil
Jika tidak
  - Tangani logika gagal
  - Catat kesalahan: {{$node.data.error}}
```

## Saran Optimasi Performa

### 1. Menggunakan Pemrosesan Asinkron

Untuk permintaan yang tidak memerlukan hasil segera, pertimbangkan untuk menggunakan alur kerja asinkron.

### 2. Mengonfigurasi *Timeout* yang Wajar

Atur *timeout* berdasarkan waktu respons API yang sebenarnya untuk menghindari penantian yang berlebihan.

### 3. Mengimplementasikan Strategi *Caching*

Untuk data yang jarang berubah (konfigurasi, kamus), pertimbangkan untuk menyimpan respons dalam *cache*.

### 4. Pemrosesan *Batch*

Jika perlu melakukan beberapa panggilan ke API yang sama, pertimbangkan untuk menggunakan *endpoint* *batch* API (jika didukung).

### 5. Coba Lagi Saat Gagal

Konfigurasi strategi coba lagi yang wajar, tetapi hindari percobaan ulang yang berlebihan yang dapat menyebabkan pembatasan laju API.

## Praktik Terbaik Keamanan

### 1. Melindungi Informasi Sensitif

- Jangan mengekspos informasi sensitif di URL.
- Gunakan HTTPS untuk transmisi terenkripsi.
- Simpan kunci API dan data sensitif lainnya dalam variabel lingkungan atau manajemen konfigurasi.

### 2. Memvalidasi Data Respons

```javascript
// Memvalidasi status respons
if (![200, 201].includes($node.data.status)) {
  throw new Error('Permintaan API gagal');
}

// Memvalidasi format data
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Data respons tidak valid');
}
```

### 3. Pembatasan Laju

Patuhi batasan laju API pihak ketiga untuk menghindari pemblokiran.

### 4. Pembersihan Log

Saat mencatat log, perhatikan untuk membersihkan informasi sensitif (kata sandi, kunci, dll.).

## Perbandingan dengan *Webhook*

| Fitur | Node Permintaan HTTP | Pemicu *Webhook* |
|-------|----------------------|------------------|
| Arah | NocoBase memanggil eksternal secara proaktif | Eksternal memanggil NocoBase secara proaktif |
| Waktu | Saat eksekusi alur kerja | Saat peristiwa eksternal terjadi |
| Tujuan | Mengambil data, memicu operasi eksternal | Menerima notifikasi, peristiwa eksternal |
| Skenario Umum | Memanggil API pembayaran, menanyakan cuaca | *Callback* pembayaran, notifikasi pesan |

Kedua fitur ini saling melengkapi untuk membangun solusi integrasi sistem yang lengkap.

## Sumber Daya Terkait

- [Dokumentasi Plugin Alur Kerja](/plugins/@nocobase/plugin-workflow/)
- [Alur Kerja: Node Permintaan HTTP](/workflow/nodes/request)
- [Alur Kerja: Pemicu *Webhook*](/integration/workflow-webhook/)
- [Autentikasi Kunci API](/integration/api-keys/)
- [Plugin Dokumentasi API](/plugins/@nocobase/plugin-api-doc/)