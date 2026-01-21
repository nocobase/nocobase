:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Mesin Penyimpanan: Aliyun OSS

Mesin penyimpanan ini berbasis Aliyun OSS. Sebelum menggunakannya, Anda perlu menyiapkan akun dan izin yang relevan.

## Parameter Konfigurasi

![Contoh Konfigurasi Mesin Penyimpanan Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Catatan}
Bagian ini hanya menjelaskan parameter khusus untuk mesin penyimpanan Aliyun OSS. Untuk parameter umum, silakan lihat [Parameter Mesin Umum](./index#引擎通用参数).
:::

### Wilayah

Masukkan wilayah penyimpanan OSS, contohnya: `oss-cn-hangzhou`.

:::info{title=Catatan}
Anda dapat melihat informasi wilayah bucket Anda di [Konsol Aliyun OSS](https://oss.console.aliyun.com/), dan Anda hanya perlu menggunakan bagian prefiks wilayahnya (tidak perlu nama domain lengkap).
:::

### AccessKey ID

Masukkan ID kunci akses Aliyun Anda.

### AccessKey Secret

Masukkan Secret kunci akses Aliyun Anda.

### Bucket

Masukkan nama bucket OSS.

### Batas Waktu

Masukkan batas waktu untuk mengunggah ke Aliyun OSS, dalam milidetik. Nilai bawaannya adalah `60000` milidetik (yaitu 60 detik).