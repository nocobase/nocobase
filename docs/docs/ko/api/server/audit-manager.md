:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# AuditManager

## 개요

`AuditManager`는 NocoBase의 리소스 감사 관리 모듈이며, 감사에 참여할 리소스 인터페이스를 등록하는 데 사용됩니다.

### 기본 사용법

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## 클래스 메서드

### `setLogger()`

감사 로그의 출력 방식을 설정합니다.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### 시그니처

- `setLogger(logger: AuditLogger)`

#### 타입

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

감사에 참여할 리소스 작업을 등록합니다.

#### 시그니처

- `registerAction(action: Action)`

#### 타입

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

#### 상세 정보

몇 가지 작성 방식이 지원됩니다.

1. 모든 리소스에 적용

```ts
registerActions(['create']);
```

2. 특정 리소스의 모든 작업에 적용 `resource:*`

```ts
registerActions(['app:*']);
```

3. 특정 리소스의 특정 작업에 적용 `resource:action`

```ts
registerAction(['pm:update']);
```

4. 작업에 대해 사용자 정의 `getMetaData`, `getUserInfo`, `getSourceAndTarget` 메서드를 전달할 수 있습니다.

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

등록된 인터페이스가 중복될 경우, 더 세분화된 등록 방식이 우선순위가 높습니다. 예를 들어:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

`user:create` 인터페이스의 경우, `3`번이 적용됩니다.

### `registerActions()`

감사에 참여할 여러 리소스 작업을 등록합니다.

#### 시그니처

- `registerActions(actions: Action[])`