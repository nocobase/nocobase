---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Administrador de Notificaciones

## Introducción

El Administrador de Notificaciones es un servicio centralizado que integra múltiples canales de notificación. Ofrece una interfaz unificada para la configuración de canales, la gestión de envíos y el registro de actividad, y permite una expansión flexible a canales adicionales.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Sección morada**: El Administrador de Notificaciones ofrece un servicio integral que incluye la configuración de canales y el registro de actividad, con la opción de expandirse a canales de notificación adicionales.
- **Sección verde**: Mensaje en la aplicación (In-App Message), un canal integrado que permite a los usuarios recibir notificaciones directamente dentro de la aplicación.
- **Sección roja**: Correo electrónico (Email), un canal extensible que permite a los usuarios recibir notificaciones por correo electrónico.

## Gestión de Canales

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Actualmente, los canales compatibles son:

- [Mensaje en la aplicación](/notification-manager/notification-in-app-message)
- [Correo electrónico](/notification-manager/notification-email) (utilizando el transporte SMTP integrado)

También puede extenderse a más canales; consulte la documentación de [Extensión de Canales](/notification-manager/development/extension).

## Registros de Notificaciones

El sistema registra información detallada y el estado de cada notificación, lo que facilita el análisis y la resolución de problemas.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Nodo de Notificación del Flujo de Trabajo

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)