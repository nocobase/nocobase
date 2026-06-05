---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Autenticación: WeCom

## Introducción

El **plugin** de **WeCom** permite a los usuarios iniciar sesión en NocoBase utilizando sus cuentas de WeCom.

## Activar el plugin

![](https://static-docs.nocobase.com/202406272056962.png)

## Crear y configurar una aplicación personalizada de WeCom

Acceda al panel de administración de WeCom para crear una aplicación personalizada.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

Haga clic en la aplicación para acceder a su página de detalles, desplácese hacia abajo y haga clic en "Inicio de sesión autorizado de WeCom".

![](https://static-docs.nocobase.com/202406272104655.png)

Establezca el dominio de devolución de llamada autorizado como el dominio de su aplicación NocoBase.

![](https://static-docs.nocobase.com/202406272105662.png)

Vuelva a la página de detalles de la aplicación y haga clic en "Autorización web y JS-SDK".

![](https://static-docs.nocobase.com/202406272107063.png)

Configure y verifique el dominio de devolución de llamada para la función de autorización web OAuth2.0 de la aplicación.

![](https://static-docs.nocobase.com/202406272107899.png)

En la página de detalles de la aplicación, haga clic en "IP de confianza corporativa".

![](https://static-docs.nocobase.com/202406272108834.png)

Configure la IP de la aplicación NocoBase.

![](https://static-docs.nocobase.com/202406272109805.png)

## Obtener credenciales desde el panel de administración de WeCom

En el panel de administración de WeCom, en "Mi empresa", copie el "ID de empresa".

![](https://static-docs.nocobase.com/202406272111637.png)

En el panel de administración de WeCom, en "Gestión de aplicaciones", acceda a la página de detalles de la aplicación que creó en el paso anterior y copie el AgentId y el Secret.

![](https://static-docs.nocobase.com/202406272122322.png)

## Añadir autenticación de WeCom en NocoBase

Vaya a la página de gestión de plugins de autenticación de usuarios.

![](https://static-docs.nocobase.com/202406272115044.png)

Añadir - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### Configuración

![](https://static-docs.nocobase.com/202412041459250.png)

| Opción                                                                                                | Descripción                                                                                                                                                                                   | Requisito de versión |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Cuando un número de teléfono no coincide con un usuario existente, <br />¿se debe crear un nuevo usuario automáticamente? | Si un número de teléfono no coincide con un usuario existente, ¿se debe crear un nuevo usuario automáticamente?                                                                             | -                   |
| ID de empresa                                                                                         | ID de empresa, obtenido del panel de administración de WeCom.                                                                                                                                 | -                   |
| AgentId                                                                                               | Obtenido de la configuración de la aplicación personalizada en el panel de administración de WeCom.                                                                                           | -                   |
| Secret                                                                                                | Obtenido de la configuración de la aplicación personalizada en el panel de administración de WeCom.                                                                                           | -                   |
| Origen                                                                                                | El dominio de la aplicación actual.                                                                                                                                                           | -                   |
| Enlace de redirección de la aplicación del entorno de trabajo                                         | La ruta de la aplicación a la que se redirigirá después de un inicio de sesión exitoso.                                                                                                       | `v1.4.0`            |
| Inicio de sesión automático                                                                           | Iniciar sesión automáticamente cuando el enlace de la aplicación se abre en el navegador de WeCom. Cuando hay varios autenticadores de WeCom configurados, solo uno puede tener esta opción habilitada. | `v1.4.0`            |
| Enlace a la página de inicio de la aplicación del entorno de trabajo                                  | Enlace a la página de inicio de la aplicación del entorno de trabajo.                                                                                                                         | -                   |

## Configurar la página de inicio de la aplicación WeCom

:::info
Para las versiones `v1.4.0` y superiores, cuando la opción "Inicio de sesión automático" está habilitada, el enlace a la página de inicio de la aplicación se puede simplificar a: `https://<url>/<path>`, por ejemplo, `https://example.nocobase.com/admin`.

También puede configurar enlaces separados para dispositivos móviles y de escritorio, por ejemplo, `https://example.nocobase.com/m` y `https://example.nocobase.com/admin`.
:::

Acceda al panel de administración de WeCom y pegue el enlace copiado de la página de inicio de la aplicación del entorno de trabajo en el campo de dirección de la página de inicio de la aplicación correspondiente.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## Iniciar sesión

Visite la página de inicio de sesión y haga clic en el botón debajo del formulario de inicio de sesión para iniciar sesión a través de terceros.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
Debido a las restricciones de permisos de WeCom sobre información sensible como los números de teléfono, la autorización solo se puede completar dentro del cliente de WeCom. Cuando inicie sesión con WeCom por primera vez, siga los pasos a continuación para completar la autorización de inicio de sesión inicial dentro del cliente de WeCom.
:::

## Primer inicio de sesión

Desde el cliente de WeCom, acceda al Entorno de Trabajo, desplácese hasta la parte inferior y haga clic en la aplicación para entrar en la página de inicio que configuró previamente. Esto completará la autorización inicial. Después, podrá usar WeCom para iniciar sesión en su aplicación NocoBase.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />