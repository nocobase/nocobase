---
title: "Node HTTP Request Workflow"
description: "Node HTTP Request Workflow memanggil API eksternal: GET/POST/PUT, referensi variabel, autentikasi Basic/Bearer/API Key, parsing respons, timeout retry, perbandingan dengan Webhook."
keywords: "HTTP Request Workflow,node HTTP Request,panggilan API eksternal,Bearer Token,API Key,integrasi Workflow,NocoBase"
---

# Integrasi HTTP Request Workflow

Melalui node HTTP Request, Workflow NocoBase dapat secara aktif mengirimkan request ke layanan HTTP apa pun, sehingga mencapai interaksi data dan integrasi bisnis dengan sistem eksternal.

## Ikhtisar

Node HTTP Request adalah komponen integrasi inti dalam Workflow, memungkinkan Anda memanggil API pihak ketiga, antarmuka layanan internal, atau layanan Web lainnya selama eksekusi Workflow untuk mendapatkan data atau memicu operasi eksternal.

## Skenario Aplikasi Tipikal

### Pengambilan Data

- **Query data pihak ketiga**: dapatkan data real-time dari API cuaca, API kurs, dll.
- **Parsing alamat**: panggil API layanan peta untuk parsing alamat dan geocoding
- **Sinkronisasi data perusahaan**: dapatkan data pelanggan, pesanan, dll. dari sistem CRM, ERP

### Pemicu Bisnis

- **Push pesan**: panggil layanan SMS, email, WeCom, dll. untuk mengirim notifikasi
- **Request pembayaran**: lakukan operasi pembayaran, refund, dll. ke gateway pembayaran
- **Pemrosesan pesanan**: kirim resi ke sistem logistik, query status logistik

### Integrasi Sistem

- **Panggilan microservice**: panggil API layanan lain dalam arsitektur microservice
- **Pelaporan data**: laporkan data bisnis ke platform analisis data, sistem monitoring
- **Layanan pihak ketiga**: integrasikan layanan AI, OCR, sintesis suara, dll.

### Operasi Otomatis

- **Tugas terjadwal**: secara berkala panggil API eksternal untuk sinkronisasi data
- **Respons event**: secara otomatis panggil API eksternal saat data berubah untuk memberi tahu sistem terkait
- **Alur persetujuan**: panggil API sistem persetujuan untuk mengirim request persetujuan

## Karakteristik Fitur

### Dukungan HTTP Lengkap

- Mendukung semua metode HTTP termasuk GET, POST, PUT, PATCH, DELETE
- Mendukung Headers Request kustom
- Mendukung berbagai format data: JSON, form data, XML, dll.
- Mendukung berbagai cara passing parameter: parameter URL, parameter path, request body, dll.

### Pemrosesan Data yang Fleksibel

- **Referensi variabel**: gunakan variabel Workflow untuk membangun request secara dinamis
- **Parsing respons**: secara otomatis parse respons JSON dan ekstrak data yang dibutuhkan
- **Transformasi data**: lakukan transformasi format pada data request dan data respons
- **Penanganan error**: konfigurasikan strategi retry, pengaturan timeout, logika penanganan error

### Autentikasi Aman

- **Basic Auth**: autentikasi dasar HTTP
- **Bearer Token**: autentikasi token
- **API Key**: autentikasi API Key kustom
- **Headers kustom**: mendukung metode autentikasi apa pun

## Langkah Penggunaan

### 1. Konfirmasikan Plugin sudah Diaktifkan

Node HTTP Request adalah fitur bawaan Plugin Workflow; pastikan Plugin **[Workflow](/plugins/@nocobase/plugin-workflow/index.md)** sudah diaktifkan.

### 2. Tambahkan Node HTTP Request pada Workflow

1. Buat atau edit Workflow
2. Tambahkan node **HTTP Request** di posisi yang dibutuhkan

![HTTP Request_Tambahkan](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Konfigurasikan parameter request

### 3. Konfigurasikan Parameter Request

![Node HTTP Request_Konfigurasi Node](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Konfigurasi Dasar

- **URL Request**: alamat API target, mendukung penggunaan variabel
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Metode Request**: pilih GET, POST, PUT, DELETE, dll.

- **Headers Request**: konfigurasikan HTTP Headers
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Parameter Request**:
  - **Parameter Query**: parameter query URL
  - **Parameter Body**: data body request (POST/PUT)

#### Konfigurasi Lanjutan

- **Waktu Timeout**: atur timeout request (default 30 detik)
- **Retry saat Gagal**: konfigurasikan jumlah retry dan interval retry
- **Abaikan Kegagalan**: meskipun request gagal, Workflow tetap berjalan
- **Pengaturan Proxy**: konfigurasikan HTTP proxy (jika diperlukan)

### 4. Gunakan Data Respons

Setelah node HTTP Request dieksekusi, data respons dapat digunakan pada node berikutnya:

- `{{$node.data.status}}`: kode status HTTP
- `{{$node.data.headers}}`: headers respons
- `{{$node.data.data}}`: data body respons
- `{{$node.data.error}}`: informasi error (jika request gagal)

![Node HTTP Request_Penggunaan Hasil Respons](https://static-docs.nocobase.com/20240529110610.png)

## Skenario Contoh

### Contoh 1: Mendapatkan Informasi Cuaca

```javascript
// Konfigurasi
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Penggunaan respons
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

### Contoh 3: Query Status Pembayaran

```javascript
// Konfigurasi
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Kondisi
Jika {{$node.data.data.status}} sama dengan "paid"
  - Update status pesanan menjadi "Telah Dibayar"
  - Kirim notifikasi pembayaran berhasil
Atau jika {{$node.data.data.status}} sama dengan "pending"
  - Pertahankan status pesanan sebagai "Menunggu Pembayaran"
Lainnya
  - Catat log pembayaran gagal
  - Notifikasi admin untuk menangani anomali
```

### Contoh 4: Sinkronisasi Data ke CRM

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

## Konfigurasi Metode Autentikasi

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
// Pada Header
Headers:
  X-API-Key: your-api-key

// Atau pada Query
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Anda perlu mendapatkan access_token terlebih dahulu, kemudian gunakan:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Penanganan Error dan Debugging

### Error Umum

1. **Connection timeout**: periksa koneksi jaringan, perpanjang waktu timeout
2. **401 Unauthorized**: periksa apakah informasi autentikasi benar
3. **404 Not Found**: periksa apakah URL benar
4. **500 Server Error**: periksa status layanan penyedia API

### Tips Debugging

1. **Gunakan node log**: tambahkan node log sebelum dan sesudah HTTP Request untuk mencatat data request dan respons

2. **Lihat log eksekusi**: log eksekusi Workflow berisi informasi rinci tentang request dan respons

3. **Tools pengujian**: gunakan tools seperti Postman, cURL untuk menguji API terlebih dahulu

4. **Penanganan error**: tambahkan kondisi untuk menangani status respons yang berbeda

```javascript
Jika {{$node.data.status}} >= 200 dan {{$node.data.status}} < 300
  - Tangani logika sukses
Lainnya
  - Tangani logika gagal
  - Catat error: {{$node.data.error}}
```

## Saran Optimasi Performa

### 1. Gunakan Pemrosesan Asinkron

Untuk request yang tidak perlu mendapatkan hasil segera, pertimbangkan menggunakan Workflow asinkron.

### 2. Konfigurasikan Timeout yang Wajar

Atur timeout sesuai dengan waktu respons aktual API untuk menghindari menunggu terlalu lama.

### 3. Implementasikan Strategi Cache

Untuk data yang tidak sering berubah (seperti konfigurasi, kamus), pertimbangkan untuk men-cache hasil respons.

### 4. Pemrosesan Batch

Jika Anda perlu memanggil API yang sama beberapa kali, pertimbangkan menggunakan antarmuka batch API (jika didukung).

### 5. Retry Error

Konfigurasikan strategi retry yang wajar, tetapi hindari retry berlebihan yang dapat menyebabkan rate limiting API.

## Praktik Terbaik Keamanan

### 1. Lindungi Informasi Sensitif

- Jangan ekspos informasi sensitif pada URL
- Gunakan transmisi terenkripsi HTTPS
- Gunakan variabel lingkungan atau manajemen konfigurasi untuk informasi sensitif seperti API Key

### 2. Validasi Data Respons

```javascript
// Validasi status respons
if (![200, 201].includes($node.data.status)) {
  throw new Error('API request failed');
}

// Validasi format data
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Invalid response data');
}
```

### 3. Batasi Frekuensi Request

Patuhi batasan laju API pihak ketiga untuk menghindari pemblokiran.

### 4. Sanitasi Log

Saat mencatat log, perhatikan sanitasi informasi sensitif (kata sandi, key, dll.).

## Perbandingan dengan Webhook

| Karakteristik | Node HTTP Request | Trigger Webhook |
|------|-------------|---------------|
| Arah | NocoBase memanggil eksternal secara aktif | Eksternal memanggil NocoBase secara aktif |
| Waktu | Saat eksekusi Workflow | Saat event eksternal terjadi |
| Tujuan | Dapatkan data, picu operasi eksternal | Terima notifikasi, event eksternal |
| Skenario tipikal | Panggil antarmuka pembayaran, query cuaca | Callback pembayaran, notifikasi pesan |

Kedua fitur ini saling melengkapi, bersama-sama membangun solusi integrasi sistem yang lengkap.

## Sumber Daya Terkait

- [Dokumentasi Plugin Workflow](/plugins/@nocobase/plugin-workflow/index.md)
- [Workflow: Node HTTP Request](/workflow/nodes/request)
- [Workflow: Trigger Webhook](/integration/workflow-webhook/index.md)
- [Autentikasi API Key](/integration/api-keys/index.md)
- [Plugin Dokumentasi API](/plugins/@nocobase/plugin-api-doc/index.md)
