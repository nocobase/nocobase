:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

# AuditManager

## Panoramica

`AuditManager` è il modulo di gestione dell'audit delle risorse in NocoBase, utilizzato per registrare le interfacce delle risorse che devono essere sottoposte ad audit.

### Utilizzo di base

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Metodi di Classe

### `setLogger()`

Imposta il metodo di output per i log di audit.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Firma

- `setLogger(logger: AuditLogger)`

#### Tipo

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

Registra un'azione di risorsa da sottoporre ad audit.

#### Firma

- `registerAction(action: Action)`

#### Tipo

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

#### Dettagli

Sono supportati diversi stili di scrittura:

1.  Si applica a tutte le risorse

    ```ts
    registerActions(['create']);
    ```

2.  Si applica a tutte le azioni di una risorsa specifica `resource:*`

    ```ts
    registerActions(['app:*']);
    ```

3.  Si applica a un'azione specifica di una risorsa specifica `resource:action`

    ```ts
    registerAction(['pm:update']);
    ```

4.  Supporta il passaggio di metodi `getMetaData`, `getUserInfo` e `getSourceAndTarget` personalizzati per l'azione

    ```ts
    registerActions([
      'create',
      { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
    ]);
    ```

Quando le interfacce registrate si sovrappongono, il metodo di registrazione più specifico ha una priorità maggiore. Ad esempio:

1.  `registerActions('create')`

2.  `registerAction({ name: 'user:*', getMetaData })`

3.  `registerAction({ name: 'user:create', getMetaData })`

Per l'interfaccia `user:create`, avrà effetto il punto `3`.

### `registerActions()`

Registra più azioni di risorsa da sottoporre ad audit.

#### Firma

- `registerActions(actions: Action[])`