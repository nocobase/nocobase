:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Plugin

Di NocoBase, **Plugin Klien** adalah cara utama untuk memperluas dan menyesuaikan fungsionalitas *frontend*. Dengan mewarisi kelas dasar `Plugin` yang disediakan oleh `@nocobase/client`, pengembang dapat mendaftarkan logika, menambahkan komponen halaman, memperluas menu, atau mengintegrasikan fungsionalitas pihak ketiga pada berbagai tahap siklus hidup.

## Struktur Kelas Plugin

Berikut adalah struktur dasar untuk sebuah plugin klien:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Dijalankan setelah plugin ditambahkan
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Dijalankan sebelum plugin dimuat
    console.log('Before plugin load');
  }

  async load() {
    // Dijalankan saat plugin dimuat, daftarkan rute, komponen UI, dll.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Penjelasan Siklus Hidup

Setiap plugin akan melalui siklus hidup berikut secara berurutan ketika peramban di-*refresh* atau aplikasi diinisialisasi:

| Metode Siklus Hidup | Waktu Eksekusi | Deskripsi |
|---------------------|----------------|-----------|
| **afterAdd()**      | Dijalankan segera setelah plugin ditambahkan ke manajer plugin | Pada titik ini, instans plugin telah dibuat, tetapi tidak semua plugin selesai diinisialisasi. Cocok untuk inisialisasi ringan, seperti membaca konfigurasi atau mengikat *event* dasar. |
| **beforeLoad()**    | Dijalankan sebelum `load()` dari semua plugin | Dapat mengakses semua instans plugin yang diaktifkan (`this.app.pm.get()`). Cocok untuk logika persiapan yang bergantung pada plugin lain. |
| **load()**          | Dijalankan saat plugin dimuat | Metode ini dijalankan setelah semua `beforeLoad()` plugin selesai. Cocok untuk mendaftarkan rute *frontend*, komponen UI, dan logika inti lainnya. |

## Urutan Eksekusi

Setiap kali peramban di-*refresh*, `afterAdd()` → `beforeLoad()` → `load()` akan dijalankan.

## Konteks Plugin dan FlowEngine

Mulai dari NocoBase 2.0, API ekstensi sisi klien sebagian besar terpusat di **FlowEngine**. Dalam kelas plugin, Anda bisa mendapatkan instans mesin melalui `this.engine`.

```ts
// Akses konteks mesin di metode load()
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

Untuk informasi lebih lanjut, lihat:  
- [FlowEngine](/flow-engine)  
- [Konteks](./context.md)