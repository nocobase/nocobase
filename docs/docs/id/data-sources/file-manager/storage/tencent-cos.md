:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Tencent COS

Mesin penyimpanan berbasis Tencent Cloud COS. Sebelum digunakan, Anda perlu menyiapkan akun dan izin yang relevan.

## Opsi Konfigurasi

![Contoh Opsi Konfigurasi Mesin Penyimpanan Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Petunjuk}
Bagian ini hanya mencakup opsi khusus untuk mesin penyimpanan Tencent Cloud COS. Untuk parameter umum, silakan lihat [Parameter Mesin Umum](./index.md#common-engine-parameters).
:::

### Wilayah

Isi wilayah penyimpanan COS, contoh: `ap-chengdu`.

:::info{title=Petunjuk}
Anda dapat melihat informasi wilayah *bucket* penyimpanan di [Konsol Tencent Cloud COS](https://console.cloud.tencent.com/cos), dan hanya perlu mengambil bagian awalan wilayahnya (tanpa nama domain lengkap).
:::

### SecretId

Isi ID kunci akses terotorisasi Tencent Cloud.

### SecretKey

Isi *secret* kunci akses terotorisasi Tencent Cloud.

### Bucket

Isi nama *bucket* penyimpanan COS, contoh: `qing-cdn-1234189398`.