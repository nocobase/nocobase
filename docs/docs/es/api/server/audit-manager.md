:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# AuditManager

## Descripción general

`AuditManager` es el módulo de gestión de auditoría de recursos en NocoBase. Se utiliza para registrar las interfaces de recursos que necesitan ser auditadas.

### Uso básico

```ts
import { Plugin } from '@nocobase/server';

class PluginCustomAuditResourceServer extends Plugin {
  async load() {
    this.app.auditManager.registerAction('resource:action');
  }
}
```

## Métodos de clase

### `setLogger()`

Establece el método de salida para los registros de auditoría.

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

Registra una acción de recurso para ser auditada.

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

#### Detalles

Se admiten varios estilos de escritura:

1. Se aplica a todos los recursos

```ts
registerActions(['create']);
```

2. Se aplica a todas las acciones de un recurso específico: `resource:*`

```ts
registerActions(['app:*']);
```

3. Se aplica a una acción específica de un recurso específico: `resource:action`

```ts
registerAction(['pm:update']);
```

4. Permite pasar métodos personalizados `getMetaData`, `getUserInfo` y `getSourceAndTarget` para la acción

```ts
registerActions([
  'create',
  { name: 'auth:signIn', getMetaData, getUserInfo, getSourceAndTarget },
]);
```

Cuando las interfaces registradas se superponen, el método de registro más específico tiene mayor prioridad. Por ejemplo:

1. `registerActions('create')`

2. `registerAction({ name: 'user:*', getMetaData })`

3. `registerAction({ name: 'user:create', getMetaData })`

Para la interfaz `user:create`, la opción `3` será la que tendrá efecto.

### `registerActions()`

Registra múltiples acciones de recursos para ser auditadas.

#### Firma

- `registerActions(actions: Action[])`