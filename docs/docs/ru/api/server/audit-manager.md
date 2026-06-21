# AuditManager - Менеджер аудита

## Обзор

`AuditManager` — это модуль управления аудитом ресурсов в NocoBase, который используется для регистрации интерфейсов ресурсов, подлежащих аудиту.

### Базовое использование

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Методы класса

### `setLogger()`

Задает способ вывода логов аудита.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Сигнатура

- `setLogger(logger: AuditLogger)`

#### Тип

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

Регистрирует действие ресурса для аудита.

#### Сигнатура

- `registerAction(action: Action)`

#### Тип

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

#### Подробности

Поддерживаются несколько способов записи:

1. Применить ко всем ресурсам

```ts
registerActions(['create']);
```

2. Применить ко всем действиям конкретного ресурса `resource:*`

```ts
registerActions(['app:*']);
```

3. Применить к конкретному действию конкретного ресурса `resource:action`

```ts
registerAction(['pm:update']);
```

4. Поддерживается передача кастомных методов `getMetaData`, `getUserInfo` и `getSourceAndTarget` для действия

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Если зарегистрированные интерфейсы пересекаются, более специфичный способ регистрации имеет более высокий приоритет. Например:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Для интерфейса `user:create` будет применен вариант `3`.

### `registerActions()`

Регистрирует несколько действий ресурсов для аудита.

#### Сигнатура

- `registerActions(actions: Action[])`