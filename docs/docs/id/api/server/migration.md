---
title: "Migration"
description: "Referensi API Migration NocoBase: class dasar Migration, method up/down, waktu eksekusi on, kontrol versi appVersion, properti yang tersedia."
keywords: "Migration,migrasi data,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration adalah class dasar migrasi data NocoBase, digunakan untuk menangani perubahan struktur database dan migrasi data saat plugin di-upgrade. Diimport dari `@nocobase/server`.

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // Logika upgrade
  }
}
```

## Properti Class

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

Mengontrol waktu eksekusi migration dalam alur upgrade. Default `'afterLoad'`.

| Nilai | Waktu Eksekusi | Skenario |
|----|----------|----------|
| `'beforeLoad'` | Sebelum plugin di-load | Operasi DDL low-level (seperti menambah kolom, menambah constraint), saat ini tidak dapat menggunakan API Repository |
| `'afterSync'` | Setelah `db.sync()`, sebelum upgrade plugin | Migrasi data yang membutuhkan struktur tabel baru tetapi tidak bergantung pada logika plugin |
| `'afterLoad'` | Setelah semua plugin selesai di-load | **Default**, sebagian besar migration menggunakan ini. Dapat menggunakan API Repository lengkap |

### appVersion

```ts
appVersion: string;
```

String range semver, menentukan pada versi aplikasi mana migration ini dieksekusi. Framework menggunakan `semver.satisfies()` untuk menentukan: hanya saat versi aplikasi saat ini memenuhi range tersebut, migration akan dieksekusi.

```ts
// Hanya dieksekusi saat upgrade dari versi di bawah 1.0.0
appVersion = '<1.0.0';

// Hanya dieksekusi saat upgrade dari versi di bawah 0.21.0-alpha.13
appVersion = '<0.21.0-alpha.13';

// Dikosongkan akan dieksekusi setiap kali upgrade
appVersion = '';
```

## Properti Instance

### app

```ts
get app(): Application
```

Instance Application NocoBase. Melaluinya Anda dapat mengakses berbagai modul aplikasi:

```ts
async up() {
  // Mendapatkan versi aplikasi
  const version = this.app.version;

  // Mendapatkan log
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

Instance Database NocoBase, dapat digunakan untuk mendapatkan Repository, mengeksekusi query, dll:

```ts
async up() {
  const repo = this.db.getRepository('users');
  await repo.update({
    filter: { status: 'inactive' },
    values: { status: 'disabled' },
  });
}
```

### plugin

```ts
get plugin(): Plugin
```

Instance plugin saat ini. Hanya tersedia di migration level plugin (di core migration adalah `undefined`).

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Instance Sequelize, dapat langsung mengeksekusi raw SQL:

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

Sequelize QueryInterface, digunakan untuk mengeksekusi operasi DDL (menambah/menghapus kolom, menambah constraint, mengubah tipe kolom, dll):

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // Menambah kolom
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // Menambah unique constraint
  await this.queryInterface.addConstraint('users', {
    type: 'unique',
    fields: ['email'],
  });
}
```

### pm

```ts
get pm(): PluginManager
```

Plugin manager. Melalui `this.pm.repository` dapat mengquery dan memodifikasi metadata plugin:

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // Memodifikasi record plugin secara batch
  }
}
```

## Method Instance

### up()

```ts
async up(): Promise<void>
```

**Dieksekusi saat upgrade.** Subclass harus meng-override method ini, menulis logika migrasi.

### down()

```ts
async down(): Promise<void>
```

**Dieksekusi saat rollback.** Sebagian besar migration dikosongkan. Jika perlu mendukung rollback, tulis operasi balikan di sini.

## Contoh Lengkap

### Menggunakan API Repository untuk update data (afterLoad)

Skenario yang paling umum—setelah semua plugin selesai di-load, gunakan API Repository untuk update data secara batch:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.0.0';

  async up() {
    const repo = this.db.getRepository('roles');
    await repo.update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
```

### Menggunakan QueryInterface untuk memodifikasi struktur tabel (beforeLoad)

Mengeksekusi DDL low-level sebelum plugin di-load—seperti menambahkan kolom baru dan unique constraint pada tabel:

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // Periksa terlebih dahulu apakah field sudah ada
    const exists = await field.existsInDb();
    if (exists) return;

    await this.queryInterface.addColumn(tableName, field.columnName(), {
      type: DataTypes.STRING,
    });

    await this.queryInterface.addConstraint(tableName, {
      type: 'unique',
      fields: [field.columnName()],
    });
  }
}
```

### Menggunakan raw SQL (afterSync)

Setelah sinkronisasi struktur tabel selesai, gunakan raw SQL untuk migrasi data:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<1.0.0-alpha.3';

  async up() {
    const items = await this.pm.repository.find();
    for (const item of items) {
      if (item.name.startsWith('@nocobase/plugin-')) {
        item.set('name', item.name.substring('@nocobase/plugin-'.length));
        await item.save();
      }
    }
  }
}
```

## Membuat File Migration

Membuat melalui perintah CLI:

```bash
yarn nocobase create-migration my-migration --pkg @my-project/plugin-hello
```

Perintah akan menghasilkan file dengan timestamp di direktori `src/server/migrations/` plugin, template seperti berikut:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<versi saat ini>';

  async up() {
    // coding
  }
}
```

Parameter perintah:

| Parameter | Penjelasan |
|------|------|
| `<name>` | Nama migration, digunakan untuk menghasilkan nama file |
| `--pkg <pkg>` | Nama paket, menentukan path penyimpanan file |
| `--on <on>` | Waktu eksekusi, default `'afterLoad'` |

## Tautan Terkait

- [Script Upgrade Migration (Pengembangan Plugin)](../../plugin-development/server/migration.md) — Tutorial penggunaan migration dalam pengembangan plugin
- [Collections Tabel Data](../../plugin-development/server/collections.md) — defineCollection dan sinkronisasi struktur tabel
- [Database Operasi Database](../../plugin-development/server/database.md) — API Repository dan operasi database
- [Plugin](../../plugin-development/server/plugin.md) — Hubungan antara install() dan migration dalam siklus hidup plugin
