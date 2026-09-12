---
title: "Integrasi Webhook Workflow"
description: "Trigger Webhook menerima panggilan HTTP eksternal untuk memicu Workflow: pengiriman formulir, notifikasi pesan, sinkronisasi data, event GitHub/GitLab, konfigurasi validasi tanda tangan, mode sinkron/asinkron, praktik keamanan."
keywords: "Webhook Workflow,trigger Webhook,integrasi sistem eksternal,pengiriman formulir,GitHub Webhook,validasi tanda tangan,NocoBase"
---

# Integrasi Webhook Workflow

Melalui trigger Webhook, NocoBase dapat menerima panggilan HTTP dari sistem pihak ketiga dan secara otomatis memicu Workflow, mencapai integrasi yang mulus dengan sistem eksternal.

## Ikhtisar

Webhook adalah mekanisme "API terbalik" yang memungkinkan sistem eksternal secara aktif mengirim data ke NocoBase saat event tertentu terjadi. Dibandingkan dengan polling aktif, Webhook menyediakan cara integrasi yang lebih real-time dan efisien.

## Skenario Aplikasi Tipikal

### Pengiriman Data Formulir

Sistem survei eksternal, formulir pendaftaran, formulir feedback pelanggan, dll. setelah pengguna mengirim data, push data ke NocoBase melalui Webhook, secara otomatis membuat record dan memicu alur pemrosesan berikutnya (seperti mengirim email konfirmasi, menugaskan task, dll.).

### Notifikasi Pesan

Event pada platform pesan pihak ketiga (seperti WeCom, DingTalk, Slack) (seperti pesan baru, mention, persetujuan selesai) dapat memicu alur pemrosesan otomatis pada NocoBase melalui Webhook.

### Sinkronisasi Data

Saat data pada sistem eksternal (seperti CRM, ERP) berubah, push secara real-time ke NocoBase melalui Webhook untuk menjaga data tetap sinkron.

### Integrasi Layanan Pihak Ketiga

- **GitHub**: event seperti code push, PR creation memicu alur otomasi
- **GitLab**: notifikasi status alur CI/CD
- **Pengiriman formulir**: sistem formulir eksternal mengirim data ke NocoBase
- **Perangkat IoT**: perubahan status perangkat, pelaporan data sensor

## Karakteristik Fitur

### Mekanisme Pemicu yang Fleksibel

- Mendukung metode HTTP termasuk GET, POST, PUT, DELETE
- Secara otomatis mem-parse JSON, form data, dan format umum lainnya
- Dapat mengkonfigurasi validasi request untuk memastikan sumber tepercaya

### Kemampuan Pemrosesan Data

- Data yang diterima dapat digunakan sebagai variabel pada Workflow
- Mendukung transformasi dan logika pemrosesan data yang kompleks
- Dapat dikombinasikan dengan node Workflow lainnya untuk mengimplementasikan logika bisnis kompleks

### Jaminan Keamanan

- Mendukung validasi tanda tangan untuk mencegah request palsu
- Dapat mengkonfigurasi whitelist IP
- Transmisi terenkripsi HTTPS

## Langkah Penggunaan

### 1. Instal Plugin

Temukan dan instal Plugin **[Workflow: Trigger Webhook](/plugins/@nocobase/plugin-workflow-webhook/index.md)** pada plugin manager.

> Perhatian: Plugin ini adalah Plugin komersial yang perlu dibeli atau dilanggan secara terpisah.

### 2. Buat Workflow Webhook

1. Masuk ke halaman **Manajemen Workflow**
2. Klik **Buat Workflow**
3. Pilih **Trigger Webhook** sebagai cara pemicu

![Buat Workflow Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Konfigurasikan parameter Webhook

![Konfigurasi Trigger Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Path Request**: path URL Webhook kustom
   - **Metode Request**: pilih metode HTTP yang diizinkan (GET/POST/PUT/DELETE)
   - **Sinkron/Asinkron**: pilih apakah akan menunggu hingga eksekusi Workflow selesai sebelum mengembalikan hasil
   - **Metode Validasi**: konfigurasikan validasi tanda tangan atau mekanisme keamanan lainnya

### 3. Konfigurasikan Node Workflow

Tambahkan node Workflow sesuai kebutuhan bisnis, misalnya:

- **Operasi tabel data**: buat, update, hapus data
- **Kondisi**: percabangan kondisional berdasarkan data yang diterima
- **HTTP Request**: panggil API lain
- **Notifikasi pesan**: kirim email, SMS, dll.
- **Kode kustom**: jalankan kode JavaScript

### 4. Dapatkan URL Webhook

Setelah Workflow dibuat, sistem akan menghasilkan URL Webhook unik dengan format umumnya:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Konfigurasikan pada Sistem Pihak Ketiga

Konfigurasikan URL Webhook yang dihasilkan ke sistem pihak ketiga:

- Atur alamat callback pengiriman data pada sistem formulir
- Konfigurasikan Webhook pada GitHub/GitLab
- Konfigurasikan alamat push event pada WeCom/DingTalk

### 6. Pengujian Webhook

Gunakan tools (seperti Postman, cURL) untuk menguji Webhook:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Akses Data Request

Pada Workflow, Anda dapat mengakses data yang diterima Webhook melalui variabel:

- `{{$context.data}}`: data body request
- `{{$context.headers}}`: informasi headers request
- `{{$context.query}}`: parameter query URL
- `{{$context.params}}`: parameter path

![Parsing Parameter Request](https://static-docs.nocobase.com/20241210111155.png)

![Parsing Body Request](https://static-docs.nocobase.com/20241210112529.png)

## Konfigurasi Respons

![Pengaturan Respons](https://static-docs.nocobase.com/20241210114312.png)

### Mode Sinkron

Setelah Workflow selesai dieksekusi, hasil dikembalikan; dapat dikonfigurasi:

- **Kode status respons**: 200, 201, dll.
- **Data respons**: data JSON yang dikembalikan secara kustom
- **Headers respons**: HTTP Header kustom

### Mode Asinkron

Segera kembalikan respons konfirmasi, Workflow berjalan di background, cocok untuk:

- Workflow yang berjalan lama
- Skenario yang tidak perlu mengembalikan hasil eksekusi
- Skenario konkurensi tinggi

## Praktik Terbaik Keamanan

### 1. Aktifkan Validasi Tanda Tangan

Sebagian besar layanan pihak ketiga mendukung mekanisme tanda tangan:

```javascript
// Contoh: validasi tanda tangan GitHub Webhook
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Gunakan HTTPS

Pastikan NocoBase di-deploy di lingkungan HTTPS untuk melindungi keamanan transmisi data.

### 3. Batasi Sumber Request

Konfigurasikan whitelist IP, hanya izinkan request dari sumber tepercaya.

### 4. Validasi Data

Tambahkan logika validasi data pada Workflow untuk memastikan data yang diterima memiliki format yang benar dan konten yang valid.

### 5. Log Audit

Catat semua request Webhook untuk memudahkan pelacakan dan pemecahan masalah.

## Pertanyaan Umum

### Webhook tidak terpicu?

1. Periksa apakah URL Webhook benar
2. Konfirmasikan apakah status Workflow adalah "Aktif"
3. Lihat log pengiriman pada sistem pihak ketiga
4. Periksa konfigurasi firewall dan jaringan

### Bagaimana cara debug Webhook?

1. Lihat record eksekusi Workflow untuk informasi rinci request dan hasil panggilan
2. Gunakan tools pengujian Webhook (seperti Webhook.site) untuk validasi request
3. Periksa data kunci dan informasi error pada record eksekusi

### Bagaimana cara menangani retry?

Beberapa layanan pihak ketiga akan retry pengiriman saat tidak menerima respons sukses:

- Pastikan Workflow bersifat idempotent
- Gunakan identifier unik untuk deduplikasi
- Catat ID request yang sudah diproses

### Saran Optimasi Performa

- Gunakan mode asinkron untuk menangani operasi yang memakan waktu
- Tambahkan kondisi untuk memfilter request yang tidak perlu diproses
- Pertimbangkan menggunakan message queue untuk menangani skenario konkurensi tinggi

## Skenario Contoh

### Pemrosesan Pengiriman Formulir Eksternal

```javascript
// 1. Validasi sumber data
// 2. Parse data formulir
const formData = context.data;

// 3. Buat record pelanggan
// 4. Tetapkan ke person in charge yang relevan
// 5. Kirim email konfirmasi ke pengirim
if (formData.email) {
  // Kirim notifikasi email
}
```

### Notifikasi Push Code GitHub

```javascript
// 1. Parse data push
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Jika branch utama
if (branch === 'main') {
  // 3. Picu alur deploy
  // 4. Beri tahu anggota tim
}
```

![Contoh Workflow Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Sumber Daya Terkait

- [Dokumentasi Plugin Workflow](/plugins/@nocobase/plugin-workflow/index.md)
- [Workflow: Trigger Webhook](/workflow/triggers/webhook)
- [Workflow: Node HTTP Request](/integration/workflow-http-request/index.md)
- [Autentikasi API Key](/integration/api-keys/index.md)
