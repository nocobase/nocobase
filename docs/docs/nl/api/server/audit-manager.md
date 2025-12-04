:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# AuditManager

## Overzicht

`AuditManager` is de NocoBase-module voor resource-auditbeheer, die wordt gebruikt om resource-interfaces te registreren die geaudit moeten worden.

### Basisgebruik

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Klassemethoden

### `setLogger()`

Hiermee stelt u de uitvoermethode in voor auditlogs.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Signatuur

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

Hiermee registreert u een resource-actie voor audit.

#### Signatuur

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

U kunt verschillende schrijfstijlen gebruiken:

1. Van toepassing op alle resources

```ts
registerActions(['create']);
```

2. Van toepassing op alle acties van een specifieke resource `resource:*`

```ts
registerActions(['app:*']);
```

3. Van toepassing op een specifieke actie van een specifieke resource `resource:action`

```ts
registerAction(['pm:update']);
```

4. U kunt aangepaste methoden zoals `getMetaData`, `getUserInfo` en `getSourceAndTarget` doorgeven voor de actie.

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Wanneer geregistreerde interfaces overlappen, heeft de meer specifieke registratiemethode een hogere prioriteit. Bijvoorbeeld:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Voor de `user:create` interface zal optie `3` worden toegepast.

### `registerActions()`

Hiermee registreert u meerdere resource-acties voor audit.

#### Signatuur

- `registerActions(actions: Action[])`