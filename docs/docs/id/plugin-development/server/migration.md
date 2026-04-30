---
title: "Migration Migrasi Database"
description: "Migrasi database plugin NocoBase: Class Migration, up/down, upgrade versi, perubahan schema."
keywords: "Migration,migrasi database,up,down,skrip upgrade,perubahan schema,NocoBase"
---

# Migration Skrip Upgrade

Selama proses pengembangan dan update plugin NocoBase, struktur database atau konfigurasi plugin mungkin mengalami perubahan yang tidak kompatibel. Untuk memastikan upgrade berjalan dengan mulus, NocoBase menyediakan mekanisme **Migration** — menangani perubahan tersebut dengan menulis file migration.

## Konsep Migration

Migration adalah skrip yang dieksekusi otomatis saat plugin di-upgrade, untuk menyelesaikan masalah berikut:

- Penyesuaian struktur tabel data (menambah field, memodifikasi tipe field, dll.)
- Migrasi data (seperti update batch nilai field)
- Update konfigurasi plugin atau logika internal

Waktu eksekusi Migration dibagi menjadi tiga jenis:

| Tipe | Waktu Trigger | Skenario Eksekusi |
|------|----------|----------|
| `beforeLoad` | Sebelum semua konfigurasi plugin dimuat |
| `afterSync`  | Setelah konfigurasi tabel data disinkronkan ke database (struktur tabel sudah berubah) |
| `afterLoad`  | Setelah semua konfigurasi plugin dimuat |

## Membuat File Migration

File Migration ditempatkan di `src/server/migrations/*.ts` di direktori plugin. NocoBase menyediakan command `create-migration` untuk dengan cepat menggenerate file migration.

```bash
yarn nocobase create-migration [options] <name>
```

Parameter Opsional

| Parameter | Penjelasan |
|------|------|
| `--pkg <pkg>` | Menentukan nama paket plugin |
| `--on [on]`  | Menentukan waktu eksekusi, opsional `beforeLoad`, `afterSync`, `afterLoad` |

Contoh

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Path file migration yang dihasilkan adalah sebagai berikut:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Konten awal file:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Tulis logika upgrade di sini
  }
}
```

:::tip Tips

`appVersion` digunakan untuk menandai versi yang ditargetkan upgrade, environment dengan versi yang lebih kecil dari yang ditentukan akan mengeksekusi migration ini.

:::

## Menulis Migration

Dalam file Migration, Anda dapat mengakses property dan API umum berikut melalui `this`, untuk memudahkan operasi database, plugin, dan instance aplikasi:

Property Umum

- **`this.app`**
  Instance aplikasi NocoBase saat ini, dapat digunakan untuk mengakses service global, plugin, atau konfigurasi.
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**
  Instance service database, menyediakan interface untuk operasi pada model (Tables).
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**
  Instance plugin saat ini, dapat digunakan untuk mengakses method kustom plugin.
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**
  Instance Sequelize, dapat langsung mengeksekusi SQL native atau operasi transaksi.
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**
  QueryInterface Sequelize, sering digunakan untuk memodifikasi struktur tabel, seperti menambah field, menghapus tabel, dll.
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Contoh Penulisan Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Menambahkan field menggunakan queryInterface
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Mengakses model data menggunakan db
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Memanggil method kustom plugin
    await this.plugin.customMethod();
  }
}
```

Selain property umum yang tercantum di atas, Migration juga menyediakan lebih banyak API, untuk penggunaan detail lihat [Migration API](../../api/server/migration.md).

## Memicu Migration

Eksekusi Migration dipicu oleh command `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Saat upgrade, sistem akan menentukan urutan eksekusi berdasarkan tipe Migration dan `appVersion`.

## Test Migration

Dalam pengembangan plugin, disarankan menggunakan **Mock Server** untuk menguji apakah migration dieksekusi dengan benar, untuk menghindari kerusakan pada data nyata.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Nama plugin
      version: '0.18.0-alpha.5', // Versi sebelum upgrade
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Tulis logika validasi, seperti memeriksa apakah field ada, apakah migrasi data berhasil
  });
});
```

:::tip Tips

Menggunakan Mock Server dapat dengan cepat mensimulasikan skenario upgrade, dan memvalidasi urutan eksekusi Migration dan perubahan data.

:::

## Saran Praktik Pengembangan

1. **Memecah Migration**
   Setiap upgrade sebaiknya menghasilkan satu file migration, menjaga atomisitas, untuk memudahkan troubleshooting.
2. **Menentukan Waktu Eksekusi**
   Pilih `beforeLoad`, `afterSync`, atau `afterLoad` berdasarkan target operasi, untuk menghindari ketergantungan pada modul yang belum dimuat.
3. **Perhatikan Kontrol Versi**
   Gunakan `appVersion` untuk memperjelas versi yang berlaku untuk migration, mencegah eksekusi berulang.
4. **Cakupan Test**
   Validasi migration di Mock Server terlebih dahulu, baru eksekusi upgrade di environment nyata.

## Tautan Terkait

- [Collections Tabel Data](./collections.md) — Definisi struktur tabel data yang sering perlu disesuaikan dalam Migration
- [Database Operasi Database](./database.md) — API operasi data melalui `this.db` dalam Migration
- [Plugin](./plugin.md) — Organisasi dan cara loading file Migration dalam plugin
- [Command Command Line](./command.md) — Memicu migrasi melalui command `nocobase upgrade` dan `create-migration`
- [Test Pengujian](./test.md) — Menggunakan Mock Server untuk menguji hasil eksekusi Migration
- [Migration API](../../api/server/migration.md) — Referensi API lengkap class Migration
