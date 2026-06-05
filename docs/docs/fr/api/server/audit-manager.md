:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# AuditManager

## Vue d'ensemble

`AuditManager` est le module de gestion d'audit des ressources de NocoBase. Il vous permet d'enregistrer les interfaces de ressources qui doivent être auditées.

### Utilisation de base

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Méthodes de classe

### `setLogger()`

Cette méthode définit la manière dont les journaux d'audit sont générés.

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

Enregistre une action de ressource à auditer.

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

#### Détails

Plusieurs syntaxes sont prises en charge :

1. S'applique à toutes les ressources

```ts
registerActions(['create']);
```

2. S'applique à toutes les actions d'une ressource spécifique : `resource:*`

```ts
registerActions(['app:*']);
```

3. S'applique à une action spécifique d'une ressource spécifique : `resource:action`

```ts
registerAction(['pm:update']);
```

4. Permet de passer des méthodes personnalisées `getMetaData`, `getUserInfo` et `getSourceAndTarget` pour l'action.

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Lorsque des interfaces enregistrées se chevauchent, la méthode d'enregistrement la plus spécifique a une priorité plus élevée. Par exemple :

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Pour l'interface `user:create`, c'est l'enregistrement `3` qui sera appliqué.

### `registerActions()`

Enregistre plusieurs actions de ressource à auditer.

#### Signature

- `registerActions(actions: Action[])`