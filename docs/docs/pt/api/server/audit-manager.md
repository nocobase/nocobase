:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::

# AuditManager

## Visão Geral

`AuditManager` é o módulo de gerenciamento de auditoria de recursos no NocoBase, usado para registrar interfaces de recursos que precisam ser auditadas.

### Uso Básico

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Métodos da Classe

### `setLogger()`

Define o método de saída para os logs de auditoria.

```ts
const auditManager = new AuditManager();
auditManager.setLogger({
  log: async (auditLog: AuditLog) => console.log(auditLog);
})
```

#### Assinatura

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

Registra uma ação de recurso para ser auditada.

#### Assinatura

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
      getSourceAndTarget?: (ctx: Context) => Promise<SourceAndAndTarget>;
    };
```

#### Detalhes

São suportados vários estilos de escrita:

1. Aplica-se a todos os recursos

```ts
registerActions(['create']);
```

2. Aplica-se a todas as ações de um recurso específico `resource:*`

```ts
registerActions(['app:*']);
```

3. Aplica-se a uma ação específica de um recurso específico `resource:action`

```ts
registerAction(['pm:update']);
```

4. Suporta a passagem de métodos personalizados `getMetaData`, `getUserInfo` e `getSourceAndTarget` para a ação.

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Quando as interfaces registradas se sobrepõem, o método de registro mais específico tem prioridade maior. Por exemplo:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Para a interface `user:create`, o item `3` será aplicado.

### `registerActions()`

Registra múltiplas ações de recurso para serem auditadas.

#### Assinatura

- `registerActions(actions: Action[])`