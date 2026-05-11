---
title: "AuditManager"
description: "Audit manager NocoBase: AuditManager untuk mencatat log operasi, audit tracking."
keywords: "AuditManager,audit,log operasi,NocoBase"
---

# AuditManager

## Ikhtisar

`AuditManager` adalah modul manajemen audit resource di NocoBase, digunakan untuk mendaftarkan interface resource yang perlu diaudit.

### Penggunaan Dasar

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Method Class

### `setLogger()`

Mengatur method output log audit.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Signature

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

Mendaftarkan operasi resource yang perlu diaudit.

#### Signature

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

Mendukung beberapa cara penulisan:

1. Berlaku untuk semua resource

```ts
registerActions(['create']);
```

2. Berlaku untuk semua operasi pada resource tertentu `resource:*`

```ts
registerActions(['app:*']);
```

3. Berlaku untuk operasi tertentu pada resource tertentu `resouce:action`

```ts
registerAction(['pm:update']);
```

4. Mendukung memasukkan method `getMetaData`, `getUserInfo`, `getSourceAndTarget` kustom untuk operasi tertentu

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Saat interface yang didaftarkan tumpang tindih, cara registrasi yang lebih granular memiliki prioritas lebih tinggi, contoh:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Untuk interface `user:create`, yang berlaku adalah `3`.

### `registerActions()`

Mendaftarkan beberapa operasi resource yang perlu diaudit.

#### Signature

- `registerAction(actions: Action[])`
