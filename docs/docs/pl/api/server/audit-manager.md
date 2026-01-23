:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# AuditManager

## Przegląd

`AuditManager` to moduł zarządzania audytem zasobów w NocoBase, służący do rejestrowania interfejsów zasobów, które mają być objęte audytem.

### Podstawowe użycie

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Metody klasy

### `setLogger()`

Ustawia metodę wyjścia dla logów audytu.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Sygnatura

- `setLogger(logger: AuditLogger)`

#### Typ

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

Rejestruje akcję zasobu, która ma być objęta audytem.

#### Sygnatura

- `registerAction(action: Action)`

#### Typ

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

#### Szczegóły

Obsługiwane są różne style zapisu:

1. Dotyczy wszystkich zasobów

```ts
registerActions(['create']);
```

2. Dotyczy wszystkich akcji konkretnego zasobu `resource:*`

```ts
registerActions(['app:*']);
```

3. Dotyczy konkretnej akcji konkretnego zasobu `resource:action`

```ts
registerAction(['pm:update']);
```

4. Obsługuje przekazywanie niestandardowych metod `getMetaData`, `getUserInfo` i `getSourceAndTarget` dla danej akcji.

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Gdy zarejestrowane interfejsy nakładają się, metoda rejestracji o większej szczegółowości ma wyższy priorytet. Na przykład:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Dla interfejsu `user:create` zastosowanie znajdzie metoda `3`.

### `registerActions()`

Rejestruje wiele akcji zasobów, które mają być objęte audytem.

#### Sygnatura

- `registerActions(actions: Action[])`