---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Autenticación: DingTalk

## Introducción

El plugin de Autenticación: DingTalk permite a los usuarios iniciar sesión en NocoBase utilizando sus cuentas de DingTalk.

## Active el plugin

![](https://static-docs.nocobase.com/202406120929356.png)

## Solicite permisos de API en la consola de desarrolladores de DingTalk

Consulte <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">Plataforma Abierta de DingTalk - Implementar inicio de sesión en sitios web de terceros</a> para crear una aplicación.

Acceda a la consola de administración de aplicaciones y active los permisos "Información de número de teléfono personal" y "Permiso de lectura de información personal de la agenda".

![](https://static-docs.nocobase.com/202406120006620.png)

## Obtenga las credenciales desde la consola de desarrolladores de DingTalk

Copie el Client ID y el Client Secret.

![](https://static-docs.nocobase.com/202406120000595.png)

## Agregue la autenticación de DingTalk en NocoBase

Diríjase a la página de administración de plugins de autenticación de usuario.

![](https://static-docs.nocobase.com/202406112348051.png)

Agregar - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### Configuración

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - ¿Desea crear automáticamente un nuevo usuario si no se encuentra un usuario existente que coincida con el número de teléfono?
- Client ID y Client Secret - Ingrese la información que copió en el paso anterior.
- Redirect URL - URL de retorno (Callback URL), cópiela y continúe con el siguiente paso.

## Configure la URL de retorno en la consola de desarrolladores de DingTalk

Pegue la URL de retorno que copió en la consola de desarrolladores de DingTalk.

![](https://static-docs.nocobase.com/202406120012221.png)

## Iniciar sesión

Visite la página de inicio de sesión y haga clic en el botón debajo del formulario de inicio de sesión para iniciar sesión con terceros.

![](https://static-docs.nocobase.com/202406120014539.png)