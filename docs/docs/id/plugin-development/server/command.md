---
title: "Command Command Line"
description: "Command line kustom server NocoBase: app.command, commander, ekstensi CLI, sub-command yarn nocobase."
keywords: "Command,command line,app.command,commander,CLI,yarn nocobase,NocoBase"
---

# Command Command Line

Di NocoBase, Command (Perintah) digunakan untuk mengeksekusi operasi terkait aplikasi atau plugin pada command line — seperti menjalankan task sistem, mengeksekusi migration, menginisialisasi konfigurasi, atau berinteraksi dengan instance aplikasi yang sedang berjalan. Anda dapat mendefinisikan command kustom untuk plugin, setelah didaftarkan melalui objek `app`, dapat dieksekusi di CLI dalam bentuk `nocobase <command>`.

## Tipe Command

Di NocoBase, cara registrasi command dibagi menjadi dua jenis:

| Tipe | Cara Registrasi | Apakah Plugin Perlu Diaktifkan | Skenario Tipikal |
|------|------------|------------------|-----------|
| Command Dinamis | `app.command()` | Ya | Command terkait bisnis plugin |
| Command Statis | `Application.registerStaticCommand()` | Tidak | Command instalasi, inisialisasi, maintenance |

## Command Dinamis

Menggunakan `app.command()` untuk mendefinisikan command plugin, baru dapat dieksekusi setelah plugin diaktifkan. File command biasanya ditempatkan di `src/server/commands/*.ts` di direktori plugin.

### Contoh

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

Di mana:

- `app.command('echo')` — Mendefinisikan command bernama `echo`
- `.option('-v, --version')` — Menambahkan opsi untuk command
- `.action()` — Mendefinisikan logika eksekusi command
- `app.version.get()` — Mendapatkan versi aplikasi saat ini

### Mengeksekusi Command

```bash
nocobase echo
nocobase echo -v
```

## Command Statis

Didaftarkan menggunakan `Application.registerStaticCommand()`, command statis dapat dieksekusi tanpa perlu mengaktifkan plugin, cocok untuk task instalasi, inisialisasi, migrasi, atau debug. Biasanya didaftarkan di method `staticImport()` class plugin.

### Contoh

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

### Mengeksekusi Command

```bash
nocobase echo
nocobase echo --version
```

Di mana:

- `Application.registerStaticCommand()` akan mendaftarkan command sebelum aplikasi diinstansiasi
- Command statis biasanya digunakan untuk mengeksekusi task global yang tidak terkait dengan status aplikasi atau plugin

## Command API

Objek command menyediakan tiga method bantuan opsional, untuk mengontrol konteks eksekusi command:

| Method | Fungsi | Contoh |
|------|------|------|
| `ipc()` | Komunikasi dengan instance aplikasi yang sedang berjalan (melalui IPC) | `app.command('reload').ipc().action()` |
| `auth()` | Memvalidasi apakah konfigurasi database benar | `app.command('seed').auth().action()` |
| `preload()` | Pre-load konfigurasi aplikasi (mengeksekusi `app.load()`) | `app.command('sync').preload().action()` |

### Penjelasan Konfigurasi

- **`ipc()`**
  Biasanya, command akan dieksekusi dalam instance aplikasi baru. Setelah mengaktifkan `ipc()`, command akan berinteraksi dengan instance aplikasi yang sedang berjalan melalui inter-process communication (IPC), cocok untuk command operasi real-time (seperti refresh cache, kirim notifikasi).

- **`auth()`**
  Memeriksa apakah konfigurasi database tersedia sebelum command dieksekusi. Jika konfigurasi database salah atau koneksi gagal, command tidak akan dilanjutkan. Sering digunakan untuk task yang melibatkan tulis atau baca database.

- **`preload()`**
  Pre-load konfigurasi aplikasi sebelum mengeksekusi command, setara dengan mengeksekusi `app.load()`. Cocok untuk command yang bergantung pada konfigurasi atau konteks plugin.

Untuk method API lainnya dapat merujuk ke [AppCommand API](../../api/server/app-command.md).

## Contoh Umum

### Menginisialisasi Data Default

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

### Membuat Instance yang Berjalan Memuat Ulang Cache (Mode IPC)

```ts
app
  .command('reload-cache')
  .ipc()
  .action(async () => {
    console.log('Requesting running app to reload cache...');
  });
```

### Registrasi Statis Command Instalasi

```ts
Application.registerStaticCommand((app) => {
  app
    .command('setup')
    .action(async () => {
      console.log('Setting up NocoBase environment...');
    });
});
```

## Tautan Terkait

- [Plugin](./plugin.md) — Siklus hidup plugin dan API inti
- [Ikhtisar Pengembangan Server](./index.md) — Ringkasan setiap modul server
- [Test Pengujian](./test.md) — Cara menulis test plugin server
- [Migration Migrasi](./migration.md) — Migrasi data dan skrip upgrade
- [Ikhtisar Plugin Development](../index.md) — Pengantar menyeluruh tentang plugin development
- [AppCommand API](../../api/server/app-command.md) — Referensi API lengkap AppCommand
