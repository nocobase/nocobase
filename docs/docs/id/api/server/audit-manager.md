:::tip
Dokumen ini diterjemahkan oleh AI. Untuk ketidakakuratan apa pun, silakan lihat [versi bahasa Inggris](/en)
:::

# AuditManager

## Gambaran Umum

`AuditManager` adalah modul manajemen audit sumber daya di NocoBase, yang digunakan untuk mendaftarkan antarmuka sumber daya yang perlu diaudit.

### Penggunaan Dasar

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Metode Kelas

### `setLogger()`

Mengatur metode keluaran untuk log audit.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Tanda Tangan

- `setLogger(logger: AuditLogger)`

#### Tipe

```ts
export interface AuditLog {
  uuid: string;
  dataSource: string;
  resource: string;
  action: string;
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
  userId: string;
  roleName: string;
  ip: string;
  ua: string;
  status: number;
  metadata?: Record<string, any>;
}

export interface AuditLogger {
  log(auditLog: AuditLog): Promise<void>;
}
```

### `registerAction()`

Mendaftarkan tindakan sumber daya yang akan diaudit.

#### Tanda Tangan

- `registerAction(action: Action)`

#### Tipe

```ts
export interface UserInfo {
  userId?: string;
  roleName?: string;
}

export interface SourceAndTarget {
  sourceCollection?: string;
  sourceRecordUK?: string;
  targetCollection?: string;
  targetRecordUK?: string;
}

type Action =
  | string
  | {
      name: string;
      getMetaData?: (ctx: Context) => Promise<Record<string, any>>;
      getUserInfo?: (ctx: Context) => Promise<UserInfo>;
      getSourceAndTarget?: (ctx: Context) => Promise<SourceAndTarget>;
    };
```

#### Detail

Beberapa gaya penulisan didukung:

1.  Berlaku untuk semua sumber daya

```ts
registerActions(['create']);
```

2.  Berlaku untuk semua tindakan dari sumber daya tertentu `resource:*`

```ts
registerActions(['app:*']);
```

3.  Berlaku untuk tindakan tertentu dari sumber daya tertentu `resource:action`

```ts
registerAction(['pm:update']);
```

4.  Mendukung penerusan metode `getMetaData`, `getUserInfo`, dan `getSourceAndTarget` kustom untuk tindakan tersebut

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Ketika antarmuka yang terdaftar tumpang tindih, metode pendaftaran yang lebih spesifik memiliki prioritas lebih tinggi. Contohnya:

1.  `registerActions('create')`

2.  `registerAction({ name: 'user:*', getMetaData })`

3.  `registerAction({ name: 'user:create', getMetaData })`

Untuk antarmuka `user:create`, `3` akan berlaku.

### `registerActions()`

Mendaftarkan beberapa tindakan sumber daya yang akan diaudit.

#### Tanda Tangan

- `registerActions(actions: Action[])`