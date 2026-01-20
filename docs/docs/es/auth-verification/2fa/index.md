---
pkg: '@nocobase/plugin-two-factor-authentication'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Autenticación de Dos Factores (2FA)

## Introducción

La Autenticación de Dos Factores (2FA) es una medida de autenticación adicional que se utiliza al iniciar sesión en una aplicación. Cuando se habilita la 2FA en la aplicación, los usuarios deben proporcionar otra forma de autenticación, como un código OTP, TOTP, etc., además de su contraseña.

:::info{title=Nota}
Actualmente, el proceso de 2FA solo se aplica a los inicios de sesión basados en contraseña. Si su aplicación ha habilitado SSO u otros métodos de autenticación, por favor, utilice la autenticación multifactor (MFA) proporcionada por el IdP correspondiente.
:::

## Habilitar plugin

![](https://static-docs.nocobase.com/202502282108145.png)

## Configuración del Administrador

Después de habilitar el plugin, se agregará una página de configuración de 2FA a la página de gestión de autenticadores.

Los administradores deben marcar la opción "Habilitar autenticación de dos factores (2FA) para todos los usuarios" y seleccionar un tipo de autenticador disponible para vincular. Si no hay autenticadores disponibles, primero debe crear uno nuevo en la página de gestión de verificación. Consulte: [Verificación](../verification/index.md)

![](https://static-docs.nocobase.com/202502282109802.png)

## Inicio de Sesión del Usuario

Una vez que se habilita la 2FA en la aplicación, cuando los usuarios inician sesión con una contraseña, se iniciará el proceso de verificación de 2FA.

Si un usuario aún no ha vinculado ningún autenticador especificado, se le pedirá que vincule uno. Una vez que la vinculación sea exitosa, podrá acceder a la aplicación.

![](https://static-docs.nocobase.com/202502282110829.png)

Si un usuario ya ha vinculado algún autenticador especificado, se le pedirá que verifique su identidad utilizando el autenticador vinculado. Una vez que la verificación sea exitosa, podrá acceder a la aplicación.

![](https://static-docs.nocobase.com/202502282110148.png)

Después de iniciar sesión, los usuarios pueden vincular autenticadores adicionales en la página de gestión de verificación de su centro personal.

![](https://static-docs.nocobase.com/202502282110024.png)