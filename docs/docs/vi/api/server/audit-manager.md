---
title: "AuditManager"
description: "Trình quản lý audit của NocoBase: AuditManager ghi log thao tác và theo dõi audit."
keywords: "AuditManager,audit,log thao tác,NocoBase"
---

# AuditManager

## Tổng quan

`AuditManager` là module quản lý audit tài nguyên trong NocoBase, dùng để đăng ký các API tài nguyên cần tham gia audit.

### Cách dùng cơ bản

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Phương thức của lớp

### `setLogger()`

Đặt phương thức ghi log audit.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Chữ ký

- `setLogger(logger: AuditLogger)`

#### Kiểu

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

Đăng ký thao tác tài nguyên tham gia audit.

#### Chữ ký

- `registerAction(action: Action)`

#### Kiểu

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

#### Thông tin chi tiết

Hỗ trợ các cách viết:

1. Áp dụng cho mọi tài nguyên

```ts
registerActions(['create']);
```

2. Áp dụng cho mọi thao tác của một tài nguyên `resource:*`

```ts
registerActions(['app:*']);
```

3. Áp dụng cho một thao tác cụ thể của tài nguyên `resouce:action`

```ts
registerAction(['pm:update']);
```

4. Hỗ trợ truyền các phương thức tùy chỉnh `getMetaData`, `getUserInfo`, `getSourceAndTarget` cho thao tác

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Khi các API đăng ký bị chồng lấp, cách đăng ký có độ chi tiết cao hơn sẽ ưu tiên hơn, ví dụ:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Đối với API `user:create`, đăng ký `3` sẽ có hiệu lực.

### `registerActions()`

Đăng ký nhiều thao tác tài nguyên tham gia audit.

#### Chữ ký

- `registerAction(actions: Action[])`
