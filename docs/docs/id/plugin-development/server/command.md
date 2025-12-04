:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Perintah

Di NocoBase, perintah (Command) digunakan untuk menjalankan operasi terkait aplikasi atau plugin di baris perintah. Contohnya, untuk menjalankan tugas sistem, melakukan operasi migrasi atau sinkronisasi, menginisialisasi konfigurasi, atau berinteraksi dengan instans aplikasi yang sedang berjalan. Pengembang dapat mendefinisikan perintah kustom untuk plugin dan mendaftarkannya melalui objek `app`, lalu menjalankannya di CLI dalam format `nocobase <command>`.

## Jenis Perintah

Di NocoBase, pendaftaran perintah dibagi menjadi dua jenis:

| Jenis          | Metode Pendaftaran                  | Apakah Plugin Perlu Diaktifkan | Skenario Umum                               |
| -------------- | ----------------------------------- | ------------------------------ | ------------------------------------------- |
| Perintah Dinamis | `app.command()`                     | ✅ Ya                          | Perintah terkait bisnis plugin              |
| Perintah Statis  | `Application.registerStaticCommand()` | ❌ Tidak                       | Perintah instalasi, inisialisasi, dan pemeliharaan |

## Perintah Dinamis

Gunakan `app.command()` untuk mendefinisikan perintah plugin. Perintah hanya dapat dieksekusi setelah plugin diaktifkan. File perintah harus ditempatkan di `src/server/commands/*.ts` dalam direktori plugin.

Contoh

```ts
import { Application } from '@nocobase/server';

export default function (app: Application) {
  app
    .command('echo')
    .option('-v, --version')
    .action(async ([options]) => {
      console.log('Hello World!');
      if (options.version) {
        console.log('Current version:', await app.version.get());
      }
    });
}
```

Penjelasan

- `app.command('echo')`: Mendefinisikan perintah bernama `echo`.
- `.option('-v, --version')`: Menambahkan opsi ke perintah.
- `.action()`: Mendefinisikan logika eksekusi perintah.
- `app.version.get()`: Mengambil versi aplikasi saat ini.

Eksekusi Perintah

```bash
nocobase echo
nocobase echo -v
```

## Perintah Statis

Gunakan `Application.registerStaticCommand()` untuk mendaftar. Perintah statis dapat dieksekusi tanpa mengaktifkan plugin, cocok untuk tugas instalasi, inisialisasi, migrasi, atau debugging. Daftarkan di metode `staticImport()` kelas plugin.

Contoh

```ts
import { Application, Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  static staticImport() {
    Application.registerStaticCommand((app: Application) => {
      app
        .command('echo')
        .option('-v, --version')
        .action(async ([options]) => {
          console.log('Hello World!');
          if (options.version) {
            console.log('Current version:', await app.version.get());
          }
        });
    });
  }
}
```

Eksekusi Perintah

```bash
nocobase echo
nocobase echo --version
```

Penjelasan

- `Application.registerStaticCommand()` mendaftarkan perintah sebelum aplikasi diinstansiasi.
- Perintah statis biasanya digunakan untuk menjalankan tugas global yang tidak terkait dengan status aplikasi atau plugin.

## Command API

Objek perintah menyediakan tiga metode pembantu opsional untuk mengontrol konteks eksekusi perintah:

| Metode    | Tujuan                                                | Contoh                               |
| --------- | ----------------------------------------------------- | ------------------------------------ |
| `ipc()`   | Berkomunikasi dengan instans aplikasi yang sedang berjalan (melalui IPC) | `app.command('reload').ipc().action()` |
| `auth()`  | Memverifikasi konfigurasi basis data sudah benar      | `app.command('seed').auth().action()` |
| `preload()` | Memuat konfigurasi aplikasi di awal (menjalankan `app.load()`) | `app.command('sync').preload().action()` |

Penjelasan Konfigurasi

- **`ipc()`**
  Secara default, perintah dieksekusi dalam instans aplikasi baru. Setelah mengaktifkan `ipc()`, perintah akan berinteraksi dengan instans aplikasi yang sedang berjalan melalui komunikasi antar-proses (IPC), cocok untuk perintah operasi real-time (seperti menyegarkan cache, mengirim notifikasi).

- **`auth()`**
  Memeriksa apakah konfigurasi basis data tersedia sebelum eksekusi perintah. Jika konfigurasi basis data salah atau koneksi gagal, perintah tidak akan dilanjutkan. Sering digunakan untuk tugas yang melibatkan penulisan atau pembacaan basis data.

- **`preload()`**
  Memuat konfigurasi aplikasi di awal sebelum menjalankan perintah, setara dengan menjalankan `app.load()`. Cocok untuk perintah yang bergantung pada konfigurasi atau konteks plugin.

Untuk metode API lainnya, silakan lihat [AppCommand](/api/server/app-command).

## Contoh Umum

Menginisialisasi Data Default

```ts
app
  .command('init-data')
  .auth()
  .preload()
  .action(async () => {
    const repo = app.db.getRepository('users');
    await repo.create({ values: { username: 'admin' } });
    console.log('Initialized default admin user.');
  });
```

Meminta Instans yang Berjalan untuk Memuat Ulang Cache (Mode IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

Pendaftaran Statis Perintah Instalasi

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```