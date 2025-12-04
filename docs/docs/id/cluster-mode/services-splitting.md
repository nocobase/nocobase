:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Pemisahan Layanan <Badge>v1.9.0+</Badge>

## Pendahuluan

Biasanya, semua layanan aplikasi NocoBase berjalan dalam satu instans Node.js yang sama. Seiring dengan semakin kompleksnya fungsionalitas dalam aplikasi karena pertumbuhan bisnis, beberapa layanan yang memakan waktu dapat memengaruhi kinerja keseluruhan.

Untuk meningkatkan kinerja aplikasi, NocoBase mendukung pemisahan layanan aplikasi agar berjalan di node yang berbeda dalam mode klaster. Hal ini bertujuan untuk mencegah masalah kinerja pada satu layanan memengaruhi seluruh aplikasi, yang dapat menyebabkan kegagalan dalam merespons permintaan pengguna secara normal.

Di sisi lain, ini juga memungkinkan penskalaan horizontal yang ditargetkan untuk layanan tertentu, sehingga meningkatkan pemanfaatan sumber daya klaster.

Saat NocoBase di-deploy dalam klaster, berbagai layanan dapat dipisah dan di-deploy untuk berjalan di node yang berbeda. Diagram berikut mengilustrasikan struktur pemisahan tersebut:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Layanan Apa Saja yang Dapat Dipisah

### Alur Kerja Asinkron

**KUNCI Layanan**: `workflow:process`

**Alur kerja** dalam mode asinkron akan masuk ke antrean untuk dieksekusi setelah dipicu. **Alur kerja** semacam ini dapat dianggap sebagai tugas latar belakang, dan pengguna biasanya tidak perlu menunggu hasil dikembalikan. Terutama untuk proses yang lebih kompleks dan memakan waktu, dengan volume pemicu yang tinggi, disarankan untuk memisahkannya agar berjalan di node independen.

### Tugas Asinkron Tingkat Pengguna Lainnya

**KUNCI Layanan**: `async-task:process`

Ini termasuk tugas yang dibuat oleh tindakan pengguna seperti impor dan ekspor asinkron. Dalam kasus volume data yang besar atau konkurensi yang tinggi, disarankan untuk memisahkannya agar berjalan di node independen.

## Cara Memisah Layanan

Pemisahan layanan yang berbeda ke node yang berbeda dapat dicapai dengan mengonfigurasi variabel lingkungan `WORKER_MODE`. Variabel lingkungan ini dapat dikonfigurasi berdasarkan aturan-aturan berikut:

- `WORKER_MODE=<kosong>`: Jika tidak dikonfigurasi, atau dikonfigurasi sebagai kosong, mode worker akan sama dengan mode instans tunggal saat ini, yaitu menerima semua permintaan dan juga memproses semua tugas. Ini kompatibel dengan aplikasi yang sebelumnya tidak dikonfigurasi.
- `WORKER_MODE=!`:` Mode worker hanya memproses permintaan dan tidak memproses tugas apa pun.
- `WORKER_MODE=workflow:process,async-task:process`:` Dikonfigurasi dengan satu atau lebih pengidentifikasi layanan (dipisahkan oleh koma), mode worker hanya memproses tugas untuk pengidentifikasi ini dan tidak memproses permintaan.
- `WORKER_MODE=*`:` Mode worker memproses semua tugas latar belakang, tanpa memandang modul, tetapi tidak memproses permintaan.
- `WORKER_MODE=!,workflow:process`:` Mode worker memproses permintaan, dan secara bersamaan hanya memproses tugas untuk pengidentifikasi tertentu.
- `WORKER_MODE=-`:` Mode worker tidak memproses permintaan atau tugas apa pun (mode ini diperlukan dalam proses worker).

Sebagai contoh, dalam lingkungan K8S, node dengan fungsionalitas pemisahan yang sama dapat menggunakan konfigurasi variabel lingkungan yang sama, sehingga memudahkan penskalaan horizontal untuk jenis layanan tertentu.

## Contoh Konfigurasi

### Beberapa Node dengan Pemrosesan Terpisah

Misalkan ada tiga node: `node1`, `node2`, dan `node3`. Node-node tersebut dapat dikonfigurasi sebagai berikut:

- `node1`:` Hanya memproses permintaan UI pengguna, konfigurasikan `WORKER_MODE=!`.
- `node2`:` Hanya memproses tugas **alur kerja**, konfigurasikan `WORKER_MODE=workflow:process`.
- `node3`:` Hanya memproses tugas asinkron, konfigurasikan `WORKER_MODE=async-task:process`.

### Beberapa Node dengan Pemrosesan Campuran

Misalkan ada empat node: `node1`, `node2`, `node3`, dan `node4`. Node-node tersebut dapat dikonfigurasi sebagai berikut:

- `node1` dan `node2`:` Memproses semua permintaan reguler, konfigurasikan `WORKER_MODE=!`, dan memiliki penyeimbang beban (load balancer) yang secara otomatis mendistribusikan permintaan ke kedua node ini.
- `node3` dan `node4`:` Memproses semua tugas latar belakang lainnya, konfigurasikan `WORKER_MODE=*`.

## Referensi Pengembang

Saat mengembangkan **plugin** bisnis, Anda dapat memisah layanan yang mengonsumsi sumber daya signifikan berdasarkan skenario kebutuhan. Hal ini dapat dicapai dengan cara berikut:

1. Definisikan pengidentifikasi layanan baru, misalnya `my-plugin:process`, untuk konfigurasi variabel lingkungan, dan sediakan dokumentasi untuknya.
2. Dalam logika bisnis sisi server **plugin**, gunakan antarmuka `app.serving()` untuk memeriksa lingkungan dan menentukan apakah node saat ini harus menyediakan layanan tertentu berdasarkan variabel lingkungan.

```javascript
const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Dalam kode sisi server plugin
if (this.app.serving(MY_PLUGIN_SERVICE_KEY)) {
  // Proses logika bisnis untuk layanan ini
} else {
  // Jangan proses logika bisnis untuk layanan ini
}
```