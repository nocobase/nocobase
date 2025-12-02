---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Registro de Auditoría

## Introducción

El registro de auditoría le permite documentar y seguir las actividades de los usuarios, así como el historial de operaciones de los recursos dentro del sistema.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Descripción de Parámetros

| Parámetro                   | Descripción                                                                                                                               |
| :-------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Recurso**                 | El tipo de recurso objetivo de la operación                                                                                               |
| **Acción**                  | El tipo de operación realizada                                                                                                            |
| **Usuario**                 | El usuario que realizó la operación                                                                                                       |
| **Rol**                     | El rol del usuario durante la operación                                                                                                   |
| **Fuente de datos**         | La fuente de datos                                                                                                                        |
| **Colección de destino**    | La colección de destino                                                                                                                   |
| **UK de registro de destino** | El identificador único de la colección de destino                                                                                         |
| **Colección de origen**     | La colección de origen del campo de asociación                                                                                            |
| **UK de registro de origen**  | El identificador único de la colección de origen                                                                                          |
| **Estado**                  | El código de estado HTTP de la respuesta a la solicitud de operación                                                                      |
| **Fecha de creación**       | La fecha y hora de la operación                                                                                                           |
| **UUID**                    | El identificador único de la operación, consistente con el ID de solicitud (Request ID) de la operación, que puede usar para recuperar los registros de la aplicación. |
| **IP**                      | La dirección IP del usuario                                                                                                               |
| **UA**                      | La información de UA del usuario                                                                                                          |
| **Metadatos**               | Metadatos como los parámetros, el cuerpo de la solicitud y el contenido de la respuesta de la operación.                                   |

## Descripción de Recursos Auditados

Actualmente, las siguientes operaciones de recursos se registrarán en el registro de auditoría:

### Aplicación Principal

| Operación        | Descripción                 |
| :--------------- | :-------------------------- |
| `` `app:resart` ``     | Reinicio de la aplicación   |
| `` `app:clearCache` `` | Borrar caché de la aplicación |

### Gestor de plugins

| Operación        | Descripción      |
| :--------------- | :--------------- |
| `` `pm:add` ``     | Añadir plugin    |
| `` `pm:update` ``  | Actualizar plugin  |
| `` `pm:enable` ``  | Habilitar plugin |
| `` `pm:disable` `` | Deshabilitar plugin |
| `` `pm:remove` ``  | Eliminar plugin  |

### Autenticación de Usuario

| Operación                 | Descripción         |
| :------------------------ | :------------------ |
| `` `auth:signIn` ``        | Iniciar sesión      |
| `` `auth:signUp` ``        | Registrarse         |
| `` `auth:signOut` ``       | Cerrar sesión       |
| `` `auth:changePassword` `` | Cambiar contraseña |

### Usuario

| Operación                 | Descripción      |
| :------------------------ | :--------------- |
| `` `users:updateProfile` `` | Actualizar perfil |

### Configuración de UI

| Operación                       | Descripción          |
| :------------------------------ | :------------------- |
| `` `uiSchemas:insertAdjacent` `` | Insertar UI Schema   |
| `` `uiSchemas:patch` ``          | Modificar UI Schema  |
| `` `uiSchemas:remove` ``         | Eliminar UI Schema   |

### Operaciones de Colección

| Operación          | Descripción                           |
| :----------------- | :------------------------------------ |
| `` `create` ``         | Crear registro                        |
| `` `update` ``         | Actualizar registro                   |
| `` `destroy` ``        | Eliminar registro                     |
| `` `updateOrCreate` `` | Actualizar o crear registro           |
| `` `firstOrCreate` ``  | Consultar o crear registro            |
| `` `move` ``           | Mover registro                        |
| `` `set` ``            | Establecer registro de campo de asociación |
| `` `add` ``            | Añadir registro de campo de asociación |
| `` `remove` ``         | Eliminar registro de campo de asociación |
| `` `export` ``         | Exportar registro                     |
| `` `import` ``         | Importar registro                     |

## Añadir Otros Recursos Auditados

Si usted ha extendido otras operaciones de recursos a través de plugins y desea que estos comportamientos de operación de recursos se registren en el registro de auditoría, puede consultar la [API](/api/server/audit-manager.md).