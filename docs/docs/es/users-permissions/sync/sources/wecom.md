---
pkg: "@nocobase/plugin-wecom"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Sincronizar datos de usuario desde WeChat Work

## Introducción

El **plugin** de **WeChat Work** le permite sincronizar datos de usuarios y departamentos desde WeChat Work.

## Crear y configurar una aplicación personalizada de WeChat Work

Primero, necesita crear una aplicación personalizada en la consola de administración de WeChat Work y obtener el **ID de la empresa** (Corp ID), el **AgentId** y el **Secret**.

Consulte [Autenticación de usuario - WeChat Work](/auth-verification/auth-wecom/).

## Agregar una fuente de datos de sincronización en NocoBase

Vaya a Usuarios y Permisos - Sincronizar - Agregar, y complete la información obtenida.

![](https://static-docs.nocobase.com/202412041251867.png)

## Configurar la sincronización de contactos

Acceda a la consola de administración de WeChat Work - Seguridad y Gestión - Herramientas de gestión, y haga clic en Sincronización de contactos.

![](https://static-docs.nocobase.com/202412041249958.png)

Configure como se muestra en la imagen y establezca la IP de confianza de la empresa.

![](https://static-docs.nocobase.com/202412041250776.png)

Ahora puede proceder con la sincronización de datos de usuario.

## Configurar el servidor de recepción de eventos

Si desea que los cambios en los datos de usuarios y departamentos en WeChat Work se sincronicen de manera oportuna con su aplicación NocoBase, puede realizar configuraciones adicionales.

Después de completar la información de configuración anterior, puede copiar la URL de notificación de devolución de llamada de contactos.

![](https://static-docs.nocobase.com/202412041256547.png)

Ingrésela en la configuración de WeChat Work, obtenga el Token y el EncodingAESKey, y complete la configuración de la **fuente de datos** de sincronización de usuarios de NocoBase.

![](https://static-docs.nocobase.com/202412041257947.png)