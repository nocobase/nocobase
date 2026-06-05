# AuditManager

## Overview

`AuditManager` is the resource audit management module in NocoBase, used to register resource interfaces that need to be audited.

### Basic Usage

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Class Methods

### `setLogger()`

Sets the output method for audit logs.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Signature

- `setLogger(logger: AuditLogger)`

#### Type

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

Registers a resource action to be audited.

#### Signature

- `registerAction(action: Action)`

#### Type

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

#### Details

Several writing styles are supported:

1. Apply to all resources

```ts
registerActions(['create']);
```

2. Apply to all actions of a specific resource `resource:*`

```ts
registerActions(['app:*']);
```

3. Apply to a specific action of a specific resource `resource:action`

```ts
registerAction(['pm:update']);
```

4. Supports passing custom `getMetaData`, `getUserInfo`, and `getSourceAndTarget` methods for the action

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

When registered interfaces overlap, the more specific registration method has higher priority. For example:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

For the `user:create` interface, `3` will take effect.

### `registerActions()`

Registers multiple resource actions to be audited.

#### Signature

- `registerActions(actions: Action[])`