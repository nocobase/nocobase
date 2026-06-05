---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Verificación: Autenticador TOTP

## Introducción

El autenticador TOTP permite a los usuarios vincular cualquier autenticador que cumpla con la especificación TOTP (Contraseña de un Solo Uso Basada en el Tiempo) (<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>), y realizar la verificación de identidad utilizando una contraseña de un solo uso basada en el tiempo (TOTP).

## Configuración del Administrador

Diríjase a la página de Gestión de Verificación.

![](https://static-docs.nocobase.com/202502271726791.png)

Añadir - Autenticador TOTP

![](https://static-docs.nocobase.com/202502271745028.png)

Aparte de un identificador único y un título, el autenticador TOTP no requiere ninguna configuración adicional.

![](https://static-docs.nocobase.com/202502271746034.png)

## Vinculación del Usuario

Después de añadir el autenticador, los usuarios pueden vincular el autenticador TOTP en el área de gestión de verificación de su perfil personal.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
Actualmente, el plugin no ofrece un mecanismo de códigos de recuperación. Una vez que el autenticador TOTP esté vinculado, se recomienda a los usuarios que lo guarden de forma segura. Si el autenticador se pierde accidentalmente, pueden usar otro método de verificación para confirmar su identidad, desvincular el autenticador y luego volver a vincularlo.
:::

## Desvinculación del Usuario

Para desvincular el autenticador, se requiere una verificación utilizando el método de verificación ya vinculado.

![](https://static-docs.nocobase.com/202502282103205.png)