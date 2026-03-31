:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Control de permisos ACL

ACL (Access Control List) se utiliza para controlar los permisos de operación sobre los recursos. Usted puede asignar permisos a roles, o bien, omitir las restricciones de rol y definir permisos directamente. El sistema ACL ofrece un mecanismo flexible para la gestión de permisos, compatible con fragmentos de permisos, middleware, evaluación condicional y otros métodos.

:::tip Nota

Los objetos ACL pertenecen a las **fuentes de datos** (`dataSource.acl`). El ACL de la **fuente de datos** principal se puede acceder rápidamente a través de `app.acl`. Para el uso de ACL en otras **fuentes de datos**, consulte el capítulo [Gestión de fuentes de datos](./data-source-manager.md).

:::

## Registrar fragmentos de permisos (Snippets)

Los fragmentos de permisos (Snippets) permiten registrar combinaciones de permisos de uso común como unidades reutilizables. Una vez que un rol se vincula a un snippet, obtiene el conjunto de permisos correspondiente. Esto reduce la configuración repetitiva y mejora la eficiencia en la gestión de permisos.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // El prefijo ui.* indica permisos que se pueden configurar en la interfaz.
  actions: ['customRequests:*'], // Operaciones de recurso correspondientes, admite comodines.
});
```

## Permisos que omiten las restricciones de rol (allow)

`acl.allow()` se utiliza para permitir que ciertas operaciones eludan las restricciones de rol. Es adecuado para APIs públicas, escenarios que requieren una evaluación dinámica de permisos o casos en los que la decisión de permisos debe basarse en el contexto de la solicitud.

```ts
// Acceso público, no requiere inicio de sesión
acl.allow('app', 'getLang', 'public');

// Accesible para usuarios que han iniciado sesión
acl.allow('app', 'getInfo', 'loggedIn');

// Basado en una condición personalizada
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Descripción del parámetro `condition`:**

- `'public'` : Cualquier usuario (incluidos los no autenticados) puede acceder, sin necesidad de autenticación.
- `'loggedIn'` : Solo los usuarios que han iniciado sesión pueden acceder, requiere una identidad de usuario válida.
- `(ctx) => Promise<boolean>` o `(ctx) => boolean` : Función personalizada que determina dinámicamente si se permite el acceso basándose en el contexto de la solicitud. Permite implementar lógicas de permisos complejas.

## Registrar middleware de permisos (use)

`acl.use()` se utiliza para registrar middleware de permisos personalizados, lo que le permite insertar lógica personalizada en el flujo de verificación de permisos. Normalmente se usa junto con `ctx.permission` para definir reglas de permisos personalizadas. Es adecuado para escenarios que requieren un control de permisos no convencional, como formularios públicos que necesitan verificación de contraseña personalizada o evaluación dinámica de permisos basada en parámetros de solicitud.

**Escenarios de aplicación típicos:**

- Escenarios de formularios públicos: Sin usuario ni rol, pero los permisos deben restringirse mediante una contraseña personalizada.
- Control de permisos basado en parámetros de solicitud, direcciones IP y otras condiciones.
- Reglas de permisos personalizadas, omitiendo o modificando el flujo de verificación de permisos predeterminado.

**Controlar permisos a través de `ctx.permission`:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Ejemplo: Un formulario público requiere verificación de contraseña para omitir la comprobación de permisos.
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Verificación exitosa, omitir la comprobación de permisos.
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Ejecutar la comprobación de permisos (continuar el flujo ACL).
  await next();
});
```

**Descripción de las propiedades de `ctx.permission`:**

- `skip: true` : Omite las comprobaciones de permisos ACL posteriores y permite el acceso directamente.
- Se puede configurar dinámicamente en el middleware según la lógica personalizada para lograr un control de permisos flexible.

## Añadir restricciones de datos fijas para operaciones específicas (addFixedParams)

`addFixedParams` permite añadir restricciones fijas de ámbito de datos (filtro) a las operaciones de ciertos recursos. Estas restricciones se aplican directamente, omitiendo las limitaciones de rol, y se utilizan normalmente para proteger datos críticos del sistema.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Incluso si un usuario tiene permiso para eliminar roles, no podrá eliminar roles del sistema como `root`, `admin` o `member`.
```

> **Consejo:** `addFixedParams` se puede utilizar para evitar que datos sensibles, como roles integrados del sistema o cuentas de administrador, sean eliminados o modificados accidentalmente. Estas restricciones se superponen con los permisos de rol, asegurando que, incluso con permisos, no se puedan manipular los datos protegidos.

## Comprobar permisos (can)

`acl.can()` se utiliza para determinar si un rol tiene permiso para ejecutar una operación específica, devolviendo un objeto de resultado de permiso o `null`. Se usa comúnmente para la evaluación dinámica de permisos en la lógica de negocio, por ejemplo, para decidir si se permiten ciertas operaciones en un middleware o en el *Handler* de una operación, basándose en el rol.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Puede pasar un solo rol o un array de roles
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`El rol ${result.role} puede ejecutar la operación ${result.action}`);
  // `result.params` contiene los parámetros fijos configurados a través de `addFixedParams`
  console.log('Parámetros fijos:', result.params);
} else {
  console.log('No tiene permiso para ejecutar esta operación');
}
```

> **Consejo:** Si se pasan varios roles, cada rol se verificará secuencialmente y se devolverá el resultado del primer rol que tenga permiso.

**Definiciones de tipo:**

```ts
interface CanArgs {
  role?: string;      // Rol único
  roles?: string[];   // Múltiples roles (se verifican secuencialmente, devuelve el primer rol con permiso)
  resource: string;   // Nombre del recurso
  action: string;    // Nombre de la operación
}

interface CanResult {
  role: string;       // Rol con permiso
  resource: string;   // Nombre del recurso
  action: string;    // Nombre de la operación
  params?: any;       // Información de parámetros fijos (si se configuraron a través de `addFixedParams`)
}
```

## Registrar operaciones configurables (setAvailableAction)

Si desea que las operaciones personalizadas se puedan configurar en la interfaz (por ejemplo, que se muestren en la página de gestión de roles), debe registrarlas utilizando `setAvailableAction`. Las operaciones registradas aparecerán en la interfaz de configuración de permisos, donde los administradores pueden configurar los permisos de operación para diferentes roles.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Nombre de visualización en la interfaz, admite internacionalización
  type: 'new-data',               // Tipo de operación
  onNewRecord: true,              // Si se aplica al crear nuevos registros
});
```

**Descripción de los parámetros:**

- **displayName** : Nombre que se muestra en la interfaz de configuración de permisos, admite internacionalización (utilizando el formato `{{t("key")}}`).
- **type** : Tipo de operación, que determina la clasificación de esta operación en la configuración de permisos.
  - `'new-data'` : Operaciones que crean nuevos datos (como importar, añadir, etc.).
  - `'existing-data'` : Operaciones que modifican datos existentes (como actualizar, eliminar, etc.).
- **onNewRecord** : Si se aplica al crear nuevos registros, solo es válido para el tipo `'new-data'`.

Después del registro, esta operación aparecerá en la interfaz de configuración de permisos, donde los administradores pueden configurar los permisos de la operación en la página de gestión de roles.