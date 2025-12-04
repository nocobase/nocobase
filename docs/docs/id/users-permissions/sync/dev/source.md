:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# Memperluas Sumber Data yang Tersinkronisasi

## Gambaran Umum

NocoBase mendukung perluasan jenis sumber data untuk sinkronisasi data pengguna sesuai kebutuhan.

## Sisi Server

### Antarmuka Sumber Data

Plugin sinkronisasi data pengguna bawaan menyediakan pendaftaran dan pengelolaan untuk jenis sumber data. Untuk memperluas jenis sumber data, Anda perlu mewarisi kelas abstrak `SyncSource` yang disediakan oleh plugin dan mengimplementasikan antarmuka standar yang relevan.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

Kelas `SyncSource` menyertakan properti `options` untuk mengambil konfigurasi kustom untuk sumber data.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    //...
    const { appid, secret } = this.options;
    //...
    return [];
  }
}
```

### Deskripsi Kolom `UserData`

| Kolom        | Deskripsi                                      |
| ------------ | ---------------------------------------------- |
| `dataType`   | Tipe data, pilihan adalah `user` dan `department` |
| `uniqueKey`  | Kolom pengidentifikasi unik                    |
| `records`    | Catatan data                                   |
| `sourceName` | Nama sumber data                               |

Jika `dataType` adalah `user`, kolom `records` berisi kolom-kolom berikut:

| Kolom         | Deskripsi               |
| ------------- | ----------------------- |
| `id`          | ID Pengguna             |
| `nickname`    | Nama panggilan pengguna |
| `avatar`      | Avatar pengguna         |
| `email`       | Email                   |
| `phone`       | Nomor telepon           |
| `departments` | Array ID departemen     |

Jika `dataType` adalah `department`, kolom `records` berisi kolom-kolom berikut:

| Kolom      | Deskripsi            |
| ---------- | -------------------- |
| `id`       | ID Departemen        |
| `name`     | Nama departemen      |
| `parentId` | ID departemen induk  |

### Contoh Implementasi Antarmuka Sumber Data

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    // ...
    const ThirdClientApi = new ThirdClientApi(
      this.options.appid,
      this.options.secret,
    );
    const departments = await this.clientapi.getDepartments();
    const users = await this.clientapi.getUsers();
    // ...
    return [
      {
        dataType: 'department',
        uniqueKey: 'id',
        records: departments,
        sourceName: this.instance.name,
      },
      {
        dataType: 'user',
        uniqueKey: 'id',
        records: users,
        sourceName: this.instance.name,
      },
    ];
  }
}
```

### Mendaftarkan Jenis Sumber Data

Sumber data yang diperluas harus didaftarkan ke modul pengelolaan data.

```ts
import UserDataSyncPlugin from '@nocobase/plugin-user-data-sync';

class CustomSourcePlugin extends Plugin {
  async load() {
    const syncPlugin = this.app.pm.get(
      UserDataSyncPlugin,
    ) as UserDataSyncPlugin;
    if (syncPlugin) {
      syncPlugin.sourceManager.reigsterType('custom-source-type', {
        syncSource: CustomSyncSource,
        title: 'Custom Source',
      });
    }
  }
}
```

## Sisi Klien

Antarmuka pengguna sisi klien mendaftarkan jenis sumber data menggunakan metode `registerType` yang disediakan oleh antarmuka klien plugin sinkronisasi data pengguna:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Formulir pengelolaan backend
      },
    });
  }
}
```

### Formulir Pengelolaan Backend

![](https://static-docs.nocobase.com/202412041429835.png)

Bagian atas menyediakan konfigurasi sumber data umum, sedangkan bagian bawah memungkinkan pendaftaran formulir konfigurasi kustom.