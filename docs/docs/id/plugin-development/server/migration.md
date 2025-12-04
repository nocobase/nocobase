:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Migration

Selama proses pengembangan dan pembaruan **plugin** NocoBase, struktur basis data atau konfigurasi **plugin** mungkin mengalami perubahan yang tidak kompatibel. Untuk memastikan peningkatan berjalan lancar, NocoBase menyediakan mekanisme **Migration** yang menangani perubahan ini dengan menulis berkas migration. Artikel ini akan memandu Anda memahami penggunaan dan **alur kerja** pengembangan Migration secara sistematis.

## Konsep Migration

Migration adalah skrip yang dieksekusi secara otomatis saat **plugin** ditingkatkan, berfungsi untuk mengatasi masalah berikut:

- Penyesuaian struktur tabel data (misalnya, menambahkan kolom, mengubah tipe kolom, dll.)
- Migrasi data (seperti pembaruan massal nilai kolom)
- Pembaruan konfigurasi **plugin** atau logika internal

Waktu eksekusi Migration dibagi menjadi tiga jenis:

| Tipe | Waktu Pemicu | Skenario Eksekusi |
|------|----------|----------|
| `beforeLoad` | Sebelum semua konfigurasi **plugin** dimuat | |
| `afterSync`  | Setelah konfigurasi **koleksi** disinkronkan dengan basis data (struktur **koleksi** sudah berubah) | |
| `afterLoad`  | Setelah semua konfigurasi **plugin** dimuat | |

## Membuat Berkas Migration

Berkas migration harus ditempatkan di `src/server/migrations/*.ts` dalam direktori **plugin**. NocoBase menyediakan perintah `create-migration` untuk menghasilkan berkas migration dengan cepat.

```bash
yarn nocobase create-migration [options] <name>
```

Parameter Opsional

| Parameter | Deskripsi |
|------|----------|
| `--pkg <pkg>` | Menentukan nama paket **plugin** |
| `--on [on]`  | Menentukan waktu eksekusi, opsi: `beforeLoad`, `afterSync`, `afterLoad` |

Contoh

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Jalur berkas migration yang dihasilkan adalah sebagai berikut:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Konten awal berkas:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Tulis logika peningkatan di sini
  }
}
```

> ⚠️ `appVersion` digunakan untuk mengidentifikasi versi yang ditargetkan oleh peningkatan. Lingkungan dengan versi kurang dari versi yang ditentukan akan mengeksekusi migration ini.

## Menulis Migration

Dalam berkas Migration, Anda dapat mengakses properti umum dan API berikut melalui `this` untuk mengoperasikan basis data, **plugin**, dan instans aplikasi dengan mudah:

Properti Umum

- **`this.app`**  
  Instans aplikasi NocoBase saat ini. Dapat digunakan untuk mengakses layanan global, **plugin**, atau konfigurasi.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Instans layanan basis data, menyediakan antarmuka untuk mengoperasikan model (**koleksi**).  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Instans **plugin** saat ini, dapat digunakan untuk mengakses metode kustom **plugin**.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Instans Sequelize, dapat mengeksekusi SQL mentah atau operasi transaksi secara langsung.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  QueryInterface dari Sequelize, sering digunakan untuk memodifikasi struktur tabel, seperti menambahkan kolom, menghapus tabel, dll.  
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
    // Menggunakan queryInterface untuk menambahkan kolom
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // Menggunakan db untuk mengakses model data
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Mengeksekusi metode kustom plugin
    await this.plugin.customMethod();
  }
}
```

Selain properti umum yang tercantum di atas, Migration juga menyediakan API yang kaya. Untuk dokumentasi terperinci, silakan lihat [Migration API](/api/server/migration).

## Memicu Migration

Eksekusi Migration dipicu oleh perintah `nocobase upgrade`:

```bash
$ yarn nocobase upgrade
```

Selama peningkatan, sistem akan menentukan urutan eksekusi berdasarkan tipe Migration dan `appVersion`.

## Menguji Migration

Dalam pengembangan **plugin**, disarankan untuk menggunakan **Mock Server** untuk menguji apakah migration dieksekusi dengan benar, guna menghindari kerusakan pada data nyata.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Nama plugin
      version: '0.18.0-alpha.5', // Versi sebelum peningkatan
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Tulis logika verifikasi, misalnya memeriksa apakah kolom ada, apakah migrasi data berhasil
  });
});
```

> Tip: Menggunakan Mock Server dapat dengan cepat mensimulasikan skenario peningkatan dan memverifikasi urutan eksekusi Migration serta perubahan data.

## Rekomendasi Praktik Pengembangan

1. **Pisahkan Migration**  
   Usahakan untuk menghasilkan satu berkas migration per peningkatan, untuk menjaga atomisitas dan menyederhanakan pemecahan masalah.
2. **Tentukan Waktu Eksekusi**  
   Pilih `beforeLoad`, `afterSync`, atau `afterLoad` berdasarkan objek operasi, hindari bergantung pada modul yang belum dimuat.
3. **Perhatikan Kontrol Versi**  
   Gunakan `appVersion` untuk menentukan dengan jelas versi yang berlaku untuk migration guna mencegah eksekusi berulang.
4. **Cakupan Pengujian**  
   Verifikasi migration di Mock Server sebelum mengeksekusi peningkatan di lingkungan nyata.