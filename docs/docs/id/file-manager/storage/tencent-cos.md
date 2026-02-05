:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Tencent Cloud COS

Mesin penyimpanan berbasis Tencent Cloud COS. Sebelum menggunakannya, Anda perlu menyiapkan akun dan izin yang relevan.

## Parameter Konfigurasi

![Contoh Konfigurasi Mesin Penyimpanan Tencent COS](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=Catatan}
Bagian ini hanya menjelaskan parameter khusus untuk mesin penyimpanan Tencent Cloud COS. Untuk parameter umum, silakan lihat [Parameter Mesin Umum](./index.md#general-engine-parameters).
:::

### Wilayah

Isi wilayah untuk penyimpanan COS, contoh: `ap-chengdu`.

:::info{title=Catatan}
Anda dapat melihat informasi wilayah ruang penyimpanan Anda di [Konsol Tencent Cloud COS](https://console.cloud.tencent.com/cos). Anda hanya perlu menggunakan prefiks wilayahnya (tidak perlu nama domain lengkap).
:::

### SecretId

Isi ID kunci akses Tencent Cloud Anda.

### SecretKey

Isi Secret kunci akses Tencent Cloud Anda.

### Bucket

Isi nama Bucket penyimpanan COS, contoh: `qing-cdn-1234189398`.