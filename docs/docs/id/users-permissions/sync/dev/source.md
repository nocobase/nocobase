---
pkg: '@nocobase/plugin-user-data-sync'
title: "Memperluas Sumber Data Sinkronisasi"
description: "Ekstensi plugin sinkronisasi data pengguna NocoBase: sumber data sinkronisasi kustom, antarmuka SyncSource, pendaftaran sumber sinkronisasi."
keywords: "memperluas sumber data sinkronisasi,SyncSource,sumber sinkronisasi,plugin-user-data-sync,pengembangan sinkronisasi data,NocoBase"
---

# Memperluas Sumber Data Sinkronisasi

## Ikhtisar

NocoBase mendukung perluasan tipe sumber data sinkronisasi data pengguna sesuai kebutuhan.

## Server

### Antarmuka Sumber Data

Plugin sinkronisasi data pengguna bawaan menyediakan registrasi dan manajemen tipe sumber data. Untuk memperluas tipe sumber data, Anda perlu melakukan inheritance dari class abstrak `SyncSource` yang disediakan oleh plugin dan mengimplementasikan antarmuka standar yang sesuai.

```ts
import { SyncSource, UserData } from '@nocobase/plugin-user-data-sync';

class CustomSyncSource extends SyncSource {
  async pull(): Promise<UserData[]> {
    return [];
  }
}
```

`SyncSource` menyediakan properti options yang digunakan untuk mendapatkan konfigurasi kustom sumber data.

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

### Penjelasan Field UserData

| Field        | Keterangan                                     |
| ------------ | ---------------------------------------------- |
| `dataType`   | Tipe data, nilai opsional `user` dan `department` |
| `uniqueKey`  | Field identifier unik                          |
| `records`    | Record data                                    |
| `sourceName` | Nama sumber data                               |

Jika dataType adalah `user`, maka records berisi field-field berikut:

| Field         | Keterangan                  |
| ------------- | --------------------------- |
| `id`          | User ID                     |
| `nickname`    | Nickname pengguna           |
| `avatar`      | Avatar pengguna             |
| `email`       | Email                       |
| `phone`       | Nomor telepon               |
| `departments` | Array ID departemen yang diikuti |

Jika dataType adalah `department`, maka records berisi field-field berikut:
| Field      | Keterangan                |
| ---------- | ------------------------- |
| `id`       | ID Departemen             |
| `name`     | Nama departemen           |
| `parentId` | ID departemen induk       |

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

### Registrasi Tipe Sumber Data

Sumber data yang diperluas perlu didaftarkan ke modul manajemen data.

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

## Klien

Antarmuka pengguna klien didaftarkan melalui antarmuka `registerType` yang disediakan oleh klien plugin sinkronisasi data pengguna:

```ts
import SyncPlugin from '@nocobase/plugin-user-data-sync/client';

class CustomSourcePlugin extends Plugin {
  async load() {
    const sync = this.app.pm.get(SyncPlugin);
    sync.registerType(authType, {
      components: {
        AdminSettingsForm, // Formulir manajemen backend
      },
    });
  }
}
```

### Formulir Manajemen Backend

![](https://static-docs.nocobase.com/202412041429835.png)

Bagian atas adalah konfigurasi sumber data umum, dan bagian bawah adalah bagian formulir konfigurasi kustom yang dapat didaftarkan.
