:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Integrasi Webhook Alur Kerja

Melalui pemicu Webhook, NocoBase dapat menerima panggilan HTTP dari sistem pihak ketiga dan secara otomatis memicu alur kerja, memungkinkan integrasi tanpa hambatan dengan sistem eksternal.

## Gambaran Umum

Webhook adalah mekanisme "API terbalik" yang memungkinkan sistem eksternal secara proaktif mengirim data ke NocoBase ketika terjadi peristiwa tertentu. Dibandingkan dengan *polling* aktif, Webhook menawarkan pendekatan integrasi yang lebih *real-time* dan efisien.

## Skenario Penggunaan Umum

### Pengiriman Data Formulir

Sistem survei eksternal, formulir pendaftaran, dan formulir umpan balik pelanggan dapat mengirimkan data ke NocoBase melalui Webhook setelah pengguna mengirimkan data. Ini secara otomatis membuat catatan dan memicu proses lanjutan (seperti mengirim email konfirmasi, menetapkan tugas, dll.).

### Notifikasi Pesan

Peristiwa dari platform pesan pihak ketiga (seperti WeCom, DingTalk, Slack) seperti pesan baru, @sebutan, atau penyelesaian persetujuan dapat memicu proses otomatisasi di NocoBase melalui Webhook.

### Sinkronisasi Data

Ketika data di sistem eksternal (seperti CRM, ERP) berubah, Webhook akan mengirimkan pembaruan ke NocoBase secara *real-time* untuk menjaga sinkronisasi data.

### Integrasi Layanan Pihak Ketiga

- **GitHub**: Peristiwa seperti *code push* dan pembuatan PR memicu alur kerja otomatisasi.
- **GitLab**: Notifikasi status *pipeline* CI/CD.
- **Pengiriman Formulir**: Sistem formulir eksternal mengirimkan data ke NocoBase.
- **Perangkat IoT**: Perubahan status perangkat, pelaporan data sensor.

## Fitur-fitur

### Mekanisme Pemicu yang Fleksibel

- Mendukung metode HTTP seperti GET, POST, PUT, DELETE.
- Secara otomatis mengurai JSON, data formulir, dan format umum lainnya.
- Validasi permintaan yang dapat dikonfigurasi untuk memastikan sumber data tepercaya.

### Kemampuan Pemrosesan Data

- Data yang diterima dapat digunakan sebagai variabel dalam alur kerja.
- Mendukung logika transformasi dan pemrosesan data yang kompleks.
- Dapat digabungkan dengan *node* alur kerja lainnya untuk mengimplementasikan logika bisnis yang kompleks.

### Jaminan Keamanan

- Mendukung verifikasi tanda tangan untuk mencegah permintaan palsu.
- *Whitelist* IP yang dapat dikonfigurasi.
- Transmisi terenkripsi HTTPS.

## Langkah-langkah Penggunaan

### 1. Instal Plugin

Temukan dan instal **[Alur Kerja: Pemicu Webhook](/plugins/@nocobase/plugin-workflow-webhook/)** plugin di pengelola plugin.

> Catatan: Plugin ini adalah plugin komersial yang memerlukan pembelian atau langganan terpisah.

### 2. Buat Alur Kerja Webhook

1. Masuk ke halaman **Manajemen Alur Kerja**.
2. Klik **Buat Alur Kerja**.
3. Pilih **Pemicu Webhook** sebagai jenis pemicu.

![Buat Alur Kerja Webhook](https://static-docs.nocobase.com/20241210105049.png)

4. Konfigurasi parameter Webhook.

![Konfigurasi Pemicu Webhook](https://static-docs.nocobase.com/20241210105441.png)
   - **Jalur Permintaan**: Jalur URL Webhook kustom.
   - **Metode Permintaan**: Pilih metode HTTP yang diizinkan (GET/POST/PUT/DELETE).
   - **Sinkron/Asinkron**: Pilih apakah akan menunggu alur kerja selesai dieksekusi sebelum mengembalikan hasil.
   - **Validasi**: Konfigurasi verifikasi tanda tangan atau mekanisme keamanan lainnya.

### 3. Konfigurasi Node Alur Kerja

Tambahkan *node* alur kerja berdasarkan kebutuhan bisnis, seperti:

- **Operasi Koleksi**: Membuat, memperbarui, menghapus catatan.
- **Logika Kondisional**: Percabangan berdasarkan data yang diterima.
- **Permintaan HTTP**: Memanggil API lain.
- **Notifikasi**: Mengirim email, SMS, dll.
- **Kode Kustom**: Mengeksekusi kode JavaScript.

### 4. Dapatkan URL Webhook

Setelah alur kerja dibuat, sistem akan menghasilkan URL Webhook unik, biasanya dalam format:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Konfigurasi di Sistem Pihak Ketiga

Konfigurasi URL Webhook yang dihasilkan di sistem pihak ketiga:

- Atur alamat *callback* pengiriman data di sistem formulir.
- Konfigurasi Webhook di GitHub/GitLab.
- Konfigurasi alamat *push* peristiwa di WeCom/DingTalk.

### 6. Uji Webhook

Uji Webhook menggunakan alat seperti Postman atau cURL:

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Mengakses Data Permintaan

Dalam alur kerja, Anda dapat mengakses data yang diterima Webhook melalui variabel:

- `{{$context.data}}`: Data *body* permintaan.
- `{{$context.headers}}`: Informasi *header* permintaan.
- `{{$context.query}}`: Parameter *query* URL.
- `{{$context.params}}`: Parameter jalur.

![Penguraian Parameter Permintaan](https://static-docs.nocobase.com/20241210111155.png)

![Penguraian Body Permintaan](https://static-docs.nocobase.com/20241210112529.png)

## Konfigurasi Respons

![Pengaturan Respons](https://static-docs.nocobase.com/20241210114312.png)

### Mode Sinkron

Mengembalikan hasil setelah eksekusi alur kerja selesai, dapat dikonfigurasi:

- **Kode Status Respons**: 200, 201, dll.
- **Data Respons**: Data JSON respons kustom.
- **Header Respons**: *Header* HTTP kustom.

### Mode Asinkron

Segera mengembalikan konfirmasi respons, alur kerja dieksekusi di latar belakang. Cocok untuk:

- Alur kerja yang berjalan lama.
- Skenario yang tidak memerlukan hasil eksekusi.
- Skenario dengan konkurensi tinggi.

## Praktik Terbaik Keamanan

### 1. Aktifkan Verifikasi Tanda Tangan

Sebagian besar layanan pihak ketiga mendukung mekanisme tanda tangan:

```javascript
// Contoh: Verifikasi tanda tangan Webhook GitHub
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

Pastikan NocoBase di-*deploy* dalam lingkungan HTTPS untuk melindungi transmisi data.

### 3. Batasi Sumber Data Permintaan

Konfigurasi *whitelist* IP untuk hanya mengizinkan permintaan dari sumber data tepercaya.

### 4. Validasi Data

Tambahkan logika validasi data dalam alur kerja untuk memastikan format data yang diterima benar dan kontennya sah.

### 5. Pencatatan Audit

Catat semua permintaan Webhook untuk memudahkan pelacakan dan pemecahan masalah.

## Pemecahan Masalah

### Webhook Tidak Terpicu?

1. Verifikasi URL Webhook sudah benar.
2. Konfirmasi status alur kerja adalah "Diaktifkan".
3. Periksa log pengiriman sistem pihak ketiga.
4. Tinjau konfigurasi *firewall* dan jaringan.

### Bagaimana Cara Melakukan *Debug* Webhook?

1. Periksa catatan eksekusi alur kerja untuk informasi detail tentang permintaan dan hasilnya.
2. Gunakan alat pengujian Webhook (seperti Webhook.site) untuk memverifikasi permintaan.
3. Tinjau data kunci dan pesan kesalahan dalam catatan eksekusi.

### Bagaimana Cara Menangani Percobaan Ulang (*Retry*)?

Beberapa layanan pihak ketiga akan mencoba mengirim ulang jika tidak menerima respons yang berhasil:

- Pastikan alur kerja memiliki sifat *idempotent*.
- Gunakan pengidentifikasi unik untuk *deduplication*.
- Catat ID permintaan yang telah diproses.

### Tips Optimasi Kinerja

- Gunakan mode asinkron untuk operasi yang memakan waktu.
- Tambahkan logika kondisional untuk menyaring permintaan yang tidak perlu diproses.
- Pertimbangkan untuk menggunakan antrean pesan (*message queue*) untuk skenario konkurensi tinggi.

## Skenario Contoh

### Pemrosesan Pengiriman Formulir Eksternal

```javascript
// 1. Verifikasi sumber data
// 2. Urai data formulir
const formData = context.data;

// 3. Buat catatan pelanggan
// 4. Tetapkan kepada penanggung jawab terkait
// 5. Kirim email konfirmasi kepada pengirim
if (formData.email) {
  // Kirim notifikasi email
}
```

### Notifikasi *Code Push* GitHub

```javascript
// 1. Urai data push
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Jika ini adalah branch utama
if (branch === 'main') {
  // 3. Picu proses deployment
  // 4. Beri tahu anggota tim
}
```

![Contoh Alur Kerja Webhook](https://static-docs.nocobase.com/20241210120655.png)

## Sumber Daya Terkait

- [Dokumentasi Plugin Alur Kerja](/plugins/@nocobase/plugin-workflow/)
- [Alur Kerja: Pemicu Webhook](/workflow/triggers/webhook)
- [Alur Kerja: Node Permintaan HTTP](/integration/workflow-http-request/)
- [Autentikasi Kunci API](/integration/api-keys/)