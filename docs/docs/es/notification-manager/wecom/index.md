---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Notificación: WeCom

## Introducción

El plugin de **WeCom** permite que la aplicación envíe mensajes de notificación a los usuarios de WeCom.

## Agregue y configure un autenticador de WeCom

Primero, debe agregar y configurar un autenticador de WeCom en NocoBase. Consulte [Autenticación de usuario - WeCom](/auth-verification/auth-wecom). Solo los usuarios del sistema que hayan iniciado sesión a través de WeCom podrán recibir notificaciones del sistema mediante WeCom.

## Agregue un canal de notificación de WeCom

![](https://static-docs.nocobase.com/202412041522365.png)

## Configure el canal de notificación de WeCom

Seleccione el autenticador que acaba de configurar.

![](https://static-docs.nocobase.com/202412041525284.png)

## Configuración del nodo de notificación del flujo de trabajo

Seleccione el canal de notificación de WeCom que configuró. Es compatible con tres tipos de mensajes: Tarjeta de texto, Markdown y Tarjeta de plantilla.

![](https://static-docs.nocobase.com/202412041529319.png)