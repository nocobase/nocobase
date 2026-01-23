---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Autenticación por SMS

## Introducción

El plugin de autenticación por SMS permite a los usuarios registrarse y acceder a NocoBase mediante SMS.

> Necesita usarse en conjunto con la funcionalidad de código de verificación por SMS que ofrece el `plugin` [`@nocobase/plugin-verification`](/auth-verification/verification/).

## Añadir autenticación por SMS

Acceda a la página de gestión de plugins de autenticación de usuarios.

![](https://static-docs.nocobase.com/202502282112517.png)

Añadir - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## Configuración de la nueva versión

:::info{title=Nota}
La nueva configuración se introdujo en la versión `1.6.0-alpha.30` y se espera que tenga soporte estable a partir de la `1.7.0`.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**Verificador:** Vincule un verificador de SMS para enviar códigos de verificación por SMS. Si no hay ningún verificador disponible, primero debe ir a la página de gestión de verificación para crear uno.
Consulte también:

- [Verificación](../verification/index.md)
- [Verificación: SMS](../verification/sms/index.md)

**Registrar automáticamente si el usuario no existe:** Cuando esta opción está marcada, si el número de teléfono del usuario no existe, se registrará un nuevo usuario utilizando el número de teléfono como apodo.

## Configuración de la versión anterior

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

La función de autenticación de inicio de sesión por SMS utilizará el proveedor de códigos de verificación por SMS configurado y establecido como predeterminado para enviar mensajes de texto.

**Registrar automáticamente si el usuario no existe:** Cuando esta opción está marcada, si el número de teléfono del usuario no existe, se registrará un nuevo usuario utilizando el número de teléfono como apodo.

## Iniciar sesión

Acceda a la página de inicio de sesión para utilizar esta función.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)