:::tip
このドキュメントはAIによって翻訳されました。不正確な情報については、[英語版](/en)をご参照ください
:::

# AuditManager

## 概要

`AuditManager` は NocoBase におけるリソース監査管理モジュールで、監査対象となるリソースインターフェースを登録するために使用されます。

### 基本的な使い方

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## クラスメソッド

### `setLogger()`

監査ログの出力方法を設定します。

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### シグネチャ

- `setLogger(logger: AuditLogger)`

#### 型

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

監査対象となるリソース操作を登録します。

#### シグネチャ

- `registerAction(action: Action)`

#### 型

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

#### 詳細

いくつかの記述方法をサポートしています。

1. すべてのリソースに適用する場合

```ts
registerActions(['create']);
```

2. 特定のリソースのすべての操作に適用する場合 `resource:*`

```ts
registerActions(['app:*']);
```

3. 特定のリソースの特定の操作に適用する場合 `resource:action`

```ts
registerAction(['pm:update']);
```

4. 操作ごとにカスタムの `getMetaData`、`getUserInfo`、`getSourceAndTarget` メソッドを渡すこともできます。

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

登録されたインターフェースが重複する場合、より詳細な登録方法が優先されます。例えば：

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

`user:create` インターフェースの場合、`3` が適用されます。

### `registerActions()`

複数の監査対象リソース操作を登録します。

#### シグネチャ

- `registerActions(actions: Action[])`