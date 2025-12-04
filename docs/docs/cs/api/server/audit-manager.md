:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# AuditManager

## Přehled

`AuditManager` je modul pro správu auditu zdrojů v NocoBase, který slouží k registraci rozhraní zdrojů, jež mají být auditována.

### Základní použití

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Metody třídy

### `setLogger()`

Nastavuje metodu výstupu pro auditní logy.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Podpis

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

Registruje akci zdroje, která má být auditována.

#### Podpis

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

#### Podrobnosti

Podporováno je několik stylů zápisu:

1. Platí pro všechny zdroje

```ts
registerActions(['create']);
```

2. Platí pro všechny akce konkrétního zdroje `resource:*`

```ts
registerActions(['app:*']);
```

3. Platí pro konkrétní akci konkrétního zdroje `resource:action`

```ts
registerAction(['pm:update']);
```

4. Podporuje předávání vlastních metod `getMetaData`, `getUserInfo` a `getSourceAndTarget` pro danou akci

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Pokud se registrovaná rozhraní překrývají, má vyšší prioritu specifičtější metoda registrace. Například:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Pro rozhraní `user:create` se uplatní `3`.

### `registerActions()`

Registruje více akcí zdroje, které mají být auditovány.

#### Podpis

- `registerActions(actions: Action[])`