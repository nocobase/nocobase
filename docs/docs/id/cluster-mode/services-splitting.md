---
pkg: "@nocobase/preset-cluster"
title: "Pemisahan Service"
description: "Dalam cluster mode, pisahkan workflow, asynchronous task, dan service yang memakan waktu lainnya ke node terpisah, konfigurasikan request node dan task node melalui WORKER_MODE, mendukung horizontal scaling dan resource isolation."
keywords: "pemisahan service,WORKER_MODE,async workflow,async-task,horizontal scaling,request node,task node,deployment cluster,NocoBase"
---

# Pemisahan Service <Badge>v1.9.0+</Badge>

## Pengantar

Biasanya, semua service aplikasi NocoBase berjalan di satu instance Node.js. Saat fitur dalam aplikasi semakin kompleks seiring dengan bisnis, beberapa service yang memakan waktu mungkin memengaruhi performa secara keseluruhan.

Untuk meningkatkan performa aplikasi, NocoBase mendukung pemisahan service aplikasi ke node yang berbeda dalam cluster mode untuk dijalankan, sehingga menghindari masalah performa pada satu service yang memengaruhi keseluruhan aplikasi dan menyebabkan tidak dapat merespons request user dengan benar.

Di sisi lain, ini juga memungkinkan horizontal scaling secara terarah pada service tertentu, sehingga meningkatkan utilisasi resource cluster.

NocoBase dapat memisahkan deployment service yang berbeda untuk berjalan di node yang berbeda saat deployment cluster. Diagram berikut menunjukkan struktur pemisahan:

![20250803214857](https://static-docs.nocobase.com/20250803214857.png)

## Service Mana yang Dapat Dipisahkan

### Async Workflow

**Service KEY**: `workflow:process`

Workflow mode async, setelah dipicu akan masuk ke queue untuk dieksekusi. Workflow seperti ini dapat dianggap sebagai background task, biasanya tidak memerlukan user untuk menunggu hasil. Terutama untuk flow yang kompleks dan memakan waktu, dengan trigger yang banyak, disarankan untuk memisahkannya ke node terpisah untuk dijalankan.

### Async Task User-Level Lainnya

**Service KEY**: `async-task:process`

Termasuk task yang dibuat dari operasi user seperti async import, export, dll. Pada kasus data besar atau concurrency tinggi, disarankan untuk memisahkannya ke node terpisah untuk dijalankan.

## Cara Memisahkan Service

Pemisahan service ke node yang berbeda diimplementasikan melalui konfigurasi environment variable `WORKER_MODE`. Environment variable ini dapat dikonfigurasi dengan aturan berikut:

- `WORKER_MODE=<kosong>`: Tidak dikonfigurasi, atau dikonfigurasi kosong, mode kerja sama dengan single instance saat ini, menerima semua request dan memproses semua task. Kompatibel dengan aplikasi yang sebelumnya tidak dikonfigurasi.
- `WORKER_MODE=!`: Mode kerja hanya memproses request, tidak memproses task apa pun.
- `WORKER_MODE=workflow:process,async-task:process`: Dikonfigurasi sebagai satu atau lebih service identifier (dipisahkan koma), mode kerja hanya memproses task dengan identifier tersebut, tidak memproses request.
- `WORKER_MODE=*`: Mode kerja memproses semua background task tanpa membedakan modul, tetapi tidak memproses request.
- `WORKER_MODE=!,workflow:process`: Mode kerja memproses request, sekaligus hanya memproses task dengan identifier tertentu.
- `WORKER_MODE=-`: Mode kerja tidak memproses request maupun task apa pun (mode ini diperlukan dalam proses worker).

Misalnya di environment K8S, Anda dapat menggunakan konfigurasi environment variable yang sama untuk node dengan fungsi pemisahan yang sama, sehingga memudahkan horizontal scaling untuk jenis service tertentu.

## Contoh Konfigurasi

### Multi-Node Pemrosesan Terpisah

Asumsi ada tiga node, masing-masing `node1`, `node2`, dan `node3`, dapat dikonfigurasi sebagai berikut:

- `node1`: Hanya memproses request UI user, konfigurasi `WORKER_MODE=!`.
- `node2`: Hanya memproses task workflow, konfigurasi `WORKER_MODE=workflow:process`.
- `node3`: Hanya memproses async task, konfigurasi `WORKER_MODE=async-task:process`.

### Multi-Node Pemrosesan Campuran

Asumsi ada empat node, masing-masing `node1`, `node2`, `node3`, dan `node4`, dapat dikonfigurasi sebagai berikut:

- `node1` dan `node2`: Memproses semua request reguler, konfigurasi `WORKER_MODE=!`, dan load balancer secara otomatis mendistribusikan request ke kedua node ini.
- `node3` dan `node4`: Memproses semua background task lainnya, konfigurasi `WORKER_MODE=*`.

## Referensi Pengembangan

Saat mengembangkan plugin bisnis, Anda dapat memisahkan service yang menghabiskan resource lebih besar berdasarkan skenario kebutuhan. Anda dapat mengimplementasikannya dengan cara berikut:

1. Definisikan service identifier baru, contohnya `my-plugin:process`, untuk konfigurasi environment variable, dan sediakan dokumentasi penjelasan.
2. Dalam fitur bisnis di sisi server plugin, gunakan interface `serving()` untuk memeriksa environment, untuk menentukan apakah node saat ini menyediakan suatu fitur bisnis berdasarkan environment variable.

```javascript
import { serving } from '@nocobase/server';

const MY_PLUGIN_SERVICE_KEY = 'my-plugin:process';
// Di kode sisi server plugin
if (serving(MY_PLUGIN_SERVICE_KEY)) {
  // Memproses logika bisnis untuk service ini
} else {
  // Tidak memproses logika bisnis untuk service ini
}
```
