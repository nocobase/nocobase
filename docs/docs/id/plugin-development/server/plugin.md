:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Plugin

Di NocoBase, **Plugin Server** menyediakan cara modular untuk memperluas dan menyesuaikan fungsionalitas sisi server. Pengembang dapat memperluas kelas `Plugin` dari `@nocobase/server` untuk mendaftarkan *event*, API, konfigurasi izin, dan logika kustom lainnya pada berbagai tahapan siklus hidup.

## Kelas Plugin

Berikut adalah struktur dasar kelas plugin:

```ts
import { Plugin } from '@nocobase/server';

export class PluginHelloServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}

  async handleSyncMessage(message: Record<string, any>) {}

  static async staticImport() {}
}

export default PluginHelloServer;
```

## Siklus Hidup

Metode siklus hidup plugin dieksekusi dalam urutan berikut. Setiap metode memiliki waktu eksekusi dan tujuan spesifiknya:

| Metode Siklus Hidup | Waktu Eksekusi | Deskripsi |
|---------------------|----------------|-----------|
| **staticImport()**  | Sebelum plugin dimuat | Metode statis kelas, dieksekusi selama fase inisialisasi yang tidak bergantung pada status aplikasi atau plugin, digunakan untuk pekerjaan inisialisasi yang tidak bergantung pada instans plugin. |
| **afterAdd()**      | Segera setelah plugin ditambahkan ke manajer plugin | Instans plugin telah dibuat, tetapi tidak semua plugin telah selesai diinisialisasi. Dapat melakukan beberapa pekerjaan inisialisasi dasar. |
| **beforeLoad()**    | Dieksekusi sebelum semua `load()` plugin | Pada tahap ini, semua **instans plugin yang diaktifkan** dapat diakses. Cocok untuk mendaftarkan model basis data, mendengarkan *event* basis data, mendaftarkan *middleware*, dan pekerjaan persiapan lainnya. |
| **load()**          | Dieksekusi saat plugin dimuat | Semua `beforeLoad()` plugin selesai dieksekusi sebelum `load()` dimulai. Cocok untuk mendaftarkan sumber daya, antarmuka API, layanan, dan logika bisnis inti lainnya. |
| **install()**       | Dieksekusi saat plugin pertama kali diaktifkan | Hanya dieksekusi sekali saat plugin pertama kali diaktifkan, umumnya digunakan untuk menginisialisasi struktur tabel basis data, menyisipkan data awal, dan logika instalasi lainnya. |
| **afterEnable()**   | Dieksekusi setelah plugin diaktifkan | Setiap kali plugin diaktifkan, metode ini akan dieksekusi. Dapat digunakan untuk memulai tugas terjadwal, mendaftarkan tugas terjadwal, membangun koneksi, dan tindakan pasca-aktivasi lainnya. |
| **afterDisable()**  | Dieksekusi setelah plugin dinonaktifkan | Dieksekusi saat plugin dinonaktifkan. Dapat digunakan untuk membersihkan sumber daya, menghentikan tugas, menutup koneksi, dan pekerjaan pembersihan lainnya. |
| **remove()**        | Dieksekusi saat plugin dihapus | Dieksekusi saat plugin dihapus sepenuhnya. Digunakan untuk menulis logika penghapusan instalasi, seperti menghapus tabel basis data, membersihkan berkas, dll. |
| **handleSyncMessage(message)** | Sinkronisasi pesan dalam deployment multi-node | Saat aplikasi berjalan dalam mode multi-node, digunakan untuk menangani pesan yang disinkronkan dari node lain. |

### Deskripsi Urutan Eksekusi

Alur eksekusi tipikal metode siklus hidup:

1. **Fase Inisialisasi Statis**: `staticImport()`
2. **Fase Startup Aplikasi**: `afterAdd()` → `beforeLoad()` → `load()`
3. **Fase Aktivasi Plugin Pertama**: `afterAdd()` → `beforeLoad()` → `load()` → `install()`
4. **Fase Aktivasi Plugin Kedua**: `afterAdd()` → `beforeLoad()` → `load()`
5. **Fase Penonaktifan Plugin**: `afterDisable()` dieksekusi saat plugin dinonaktifkan
6. **Fase Penghapusan Plugin**: `remove()` dieksekusi saat plugin dihapus

## app dan Anggota Terkait

Dalam pengembangan plugin, Anda dapat mengakses berbagai API yang disediakan oleh instans aplikasi melalui `this.app`. Ini adalah antarmuka inti untuk memperluas fungsionalitas plugin. Objek `app` berisi berbagai modul fungsional sistem. Pengembang dapat menggunakan modul-modul ini dalam metode siklus hidup plugin untuk mengimplementasikan kebutuhan bisnis.

### Daftar Anggota app

| Nama Anggota        | Tipe/Modul      | Tujuan Utama |
|---------------------|-----------------|--------------|
| **logger**          | `Logger`        | Mencatat log sistem, mendukung keluaran log berbagai level (info, warn, error, debug), memudahkan debugging dan pemantauan. Lihat [Logger](./logger.md) |
| **db**              | `Database`      | Menyediakan operasi lapisan ORM, pendaftaran model, mendengarkan *event*, kontrol transaksi, dan fungsi terkait basis data lainnya. Lihat [Database](./database.md). |
| **resourceManager** | `ResourceManager` | Digunakan untuk mendaftarkan dan mengelola sumber daya API REST serta *handler* operasi. Lihat [Manajer Sumber Daya](./resource-manager.md). |
| **acl**             | `ACL`           | Lapisan kontrol akses, digunakan untuk mendefinisikan izin, peran, dan kebijakan akses sumber daya, mengimplementasikan kontrol izin yang terperinci. Lihat [Kontrol Akses](./acl.md). |
| **cacheManager**    | `CacheManager`  | Mengelola *cache* tingkat sistem, mendukung Redis, *cache* memori, dan berbagai *backend cache* lainnya untuk meningkatkan kinerja aplikasi. Lihat [Cache](./cache.md) |
| **cronJobManager**  | `CronJobManager` | Digunakan untuk mendaftarkan, memulai, dan mengelola tugas terjadwal, mendukung konfigurasi ekspresi Cron. Lihat [Tugas Terjadwal](./cron-job-manager.md) |
| **i18n**            | `I18n`          | Dukungan internasionalisasi, menyediakan fungsionalitas terjemahan multibahasa dan lokalisasi, memudahkan plugin untuk mendukung berbagai bahasa. Lihat [Internasionalisasi](./i18n.md) |
| **cli**             | `CLI`           | Mengelola antarmuka baris perintah, mendaftarkan dan mengeksekusi perintah kustom, memperluas fungsionalitas CLI NocoBase. Lihat [Baris Perintah](./command.md) |
| **dataSourceManager** | `DataSourceManager` | Mengelola beberapa instans sumber data dan koneksinya, mendukung skenario multi-sumber data. Lihat [Manajemen Sumber Daya](./collections.md) |
| **pm**              | `PluginManager` | Manajer plugin, digunakan untuk memuat, mengaktifkan, menonaktifkan, dan menghapus plugin secara dinamis, mengelola dependensi antar plugin. |

> Catatan: Untuk penggunaan detail setiap modul, silakan merujuk ke bab dokumentasi yang sesuai.