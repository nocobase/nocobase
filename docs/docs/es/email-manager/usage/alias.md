---
pkg: "@nocobase/plugin-email-manager"
title: "Alias de correo electrónico"
description: "Los alias de correo electrónico permiten enviar correos con diferentes identidades de remitente bajo la misma cuenta de correo."
keywords: "alias de correo,identidad de remitente,Send As,Alias,NocoBase"
---

# Alias de correo electrónico

## Descripción de la función

Los alias de correo electrónico permiten enviar correos con diferentes identidades de remitente bajo la misma cuenta de correo.

Al enviar un correo, puede elegir desde el selector de remitente entre el buzón principal o las direcciones de alias ya sincronizadas. Al responder, reenviar o restaurar borradores, el sistema mantiene la identidad de remitente original.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)

> Outlook no admite esta función.

## Sincronización de alias

Tras autorizar correctamente una cuenta de Gmail, el sistema sincronizará automáticamente los alias disponibles bajo ese correo.

Si posteriormente añade o ajusta alias en Gmail, puede acceder a la configuración del correo y, en la opción "Nombre de remitente", hacer clic en "Sincronizar alias" para volver a obtenerlos.

![](https://static-docs.nocobase.com/Email-settings-04-02-2026_06_04_PM.png)

## Selección de alias al enviar

En el editor de correo, al hacer clic en el selector de remitente, podrá ver el buzón principal y los alias ya sincronizados bajo esa cuenta.

Si el mismo alias de correo está vinculado a varias cuentas, el selector incluirá el buzón principal correspondiente, lo que ayuda a distinguir qué cuenta y contexto se utilizan exactamente.

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)
