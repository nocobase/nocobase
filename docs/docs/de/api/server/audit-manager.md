:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# AuditManager

## Übersicht

`AuditManager` ist das Modul zur Ressourcen-Audit-Verwaltung in NocoBase. Es dient dazu, Ressourcen-Schnittstellen zu registrieren, die auditiert werden sollen.

### Grundlegende Verwendung

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Klassenmethoden

### `setLogger()`

Legt die Ausgabemethode für Audit-Logs fest.

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

Registriert eine Ressourcen-Aktion, die auditiert werden soll.

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

#### Details

Es werden verschiedene Schreibweisen unterstützt:

1. Gilt für alle Ressourcen

```ts
registerActions(['create']);
```

2. Gilt für alle Aktionen einer bestimmten Ressource `resource:*`

```ts
registerActions(['app:*']);
```

3. Gilt für eine bestimmte Aktion einer bestimmten Ressource `resource:action`

```ts
registerAction(['pm:update']);
```

4. Unterstützt die Übergabe benutzerdefinierter `getMetaData`-, `getUserInfo`- und `getSourceAndTarget`-Methoden für die Aktion.

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Wenn sich registrierte Schnittstellen überschneiden, hat die spezifischere Registrierungsmethode eine höhere Priorität. Zum Beispiel:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Für die Schnittstelle `user:create` tritt `3` in Kraft.

### `registerActions()`

Registriert mehrere Ressourcen-Aktionen, die auditiert werden sollen.

#### Signatur

- `registerActions(actions: Action[])`