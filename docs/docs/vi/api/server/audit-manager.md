:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# AuditManager

## Tổng quan

`AuditManager` là mô-đun quản lý kiểm toán tài nguyên trong NocoBase, dùng để đăng ký các giao diện tài nguyên cần được kiểm toán.

### Cách sử dụng cơ bản

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

Đặt phương thức xuất cho nhật ký kiểm toán.

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

Đăng ký một hành động tài nguyên để kiểm toán.

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

#### Chi tiết

Hỗ trợ một số cách viết sau:

1. Áp dụng cho tất cả tài nguyên

```ts
registerActions(['create']);
```

2. Áp dụng cho tất cả hành động của một tài nguyên cụ thể `resource:*`

```ts
registerActions(['app:*']);
```

3. Áp dụng cho một hành động cụ thể của một tài nguyên cụ thể `resource:action`

```ts
registerAction(['pm:update']);
```

4. Hỗ trợ truyền vào các phương thức `getMetaData`, `getUserInfo`, và `getSourceAndTarget` tùy chỉnh cho hành động

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Khi các giao diện đã đăng ký bị trùng lặp, phương thức đăng ký có độ chi tiết cao hơn sẽ có ưu tiên cao hơn. Ví dụ:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Đối với giao diện `user:create`, phương thức `3` sẽ có hiệu lực.

### `registerActions()`

Đăng ký nhiều hành động tài nguyên để kiểm toán.

#### Chữ ký

- `registerActions(actions: Action[])`