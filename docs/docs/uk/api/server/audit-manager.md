:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::


# AuditManager

## Огляд

`AuditManager` — це модуль управління аудитом ресурсів у NocoBase, який використовується для реєстрації інтерфейсів ресурсів, що потребують аудиту.

### Базове використання

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Методи класу

### `setLogger()`

Встановлює метод виведення для журналів аудиту.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Підпис

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

Реєструє дію ресурсу для аудиту.

#### Підпис

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

#### Деталі

Підтримується кілька стилів написання:

1. Застосовується до всіх ресурсів

```ts
registerActions(['create']);
```

2. Застосовується до всіх дій певного ресурсу `resource:*`

```ts
registerActions(['app:*']);
```

3. Застосовується до певної дії певного ресурсу `resource:action`

```ts
registerAction(['pm:update']);
```

4. Підтримує передачу власних методів `getMetaData`, `getUserInfo` та `getSourceAndTarget` для дії

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Коли зареєстровані інтерфейси перетинаються, метод реєстрації з більш високою деталізацією має вищий пріоритет. Наприклад:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Для інтерфейсу `user:create` застосовуватиметься `3`.

### `registerActions()`

Реєструє кілька дій ресурсів для аудиту.

#### Підпис

- `registerActions(actions: Action[])`