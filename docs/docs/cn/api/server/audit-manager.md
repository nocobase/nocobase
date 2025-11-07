# AuditManager

## 概览

`AuditManager` 是 NocoBase 中的资源审计管理模块，用于注册需要参与审计的资源接口。

### 基本使用

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## 类方法

### `setLogger()`

设置审计日志的输出方法。

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### 签名

- `setLogger(logger: AuditLogger)`

#### 类型

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

注册参与审计的资源操作。

#### 签名

- `registerAction(action: Action)`

#### 类型

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

#### 详细信息

支持几种写法:

1. 对所有资源生效

```ts
registerActions(['create']);
```

2. 对某个资源的所有操作生效 `resource:*`

```ts
registerActions(['app:*']);
```

3. 对某个资源的某个操作生效 `resouce:action`

```ts
registerAction(['pm:update']);
```

4. 支持传入针对操作自定义的 `getMetaData`, `getUserInfo`, `getSourceAndTarget` 方法

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

当注册的接口有重叠时，颗粒度细的注册方方式优先级更高，例如：

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

对于 `user:create` 接口，生效的是 `3`.

### `registerActions()`

注册多个参与审计的资源操作。

#### 签名

- `registerAction(actions: Action[])`
