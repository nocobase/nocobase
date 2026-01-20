:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# AuditManager

## Översikt

`AuditManager` är NocoBase:s modul för hantering av resursgranskning, som används för att registrera resursgränssnitt som behöver granskas.

### Grundläggande användning

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Klassmetoder

### `setLogger()`

Ställer in utmatningsmetoden för granskningsloggar.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Signatur

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

Registrerar en resursåtgärd som ska granskas.

#### Signatur

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

#### Detaljer

Flera skrivstilar stöds:

1. Gäller för alla resurser

```ts
registerActions(['create']);
```

2. Gäller för alla åtgärder för en specifik resurs `resource:*`

```ts
registerActions(['app:*']);
```

3. Gäller för en specifik åtgärd för en specifik resurs `resource:action`

```ts
registerAction(['pm:update']);
```

4. Stöder att skicka anpassade `getMetaData`, `getUserInfo` och `getSourceAndTarget` metoder för åtgärden

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

När registrerade gränssnitt överlappar har den mer specifika registreringsmetoden högre prioritet. Till exempel:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

För `user:create`-gränssnittet kommer `3` att gälla.

### `registerActions()`

Registrerar flera resursåtgärder som ska granskas.

#### Signatur

- `registerActions(actions: Action[])`