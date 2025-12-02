---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Proceso de Configuración

## Visión General
Después de activar el **plugin** de correo electrónico, los administradores deben completar primero la configuración necesaria para que los usuarios puedan conectar sus cuentas de correo a NocoBase. (Actualmente, solo se admite la autorización para cuentas de correo de Outlook y Gmail; el inicio de sesión directo con cuentas de Microsoft y Google aún no está disponible).

El núcleo de la configuración reside en los ajustes de autenticación para las llamadas a la API del proveedor de servicios de correo electrónico. Los administradores deben completar los siguientes pasos para asegurar que el **plugin** funcione correctamente:

1.  **Obtener información de autenticación del proveedor de servicios**
    -   Inicie sesión en la consola de desarrolladores del proveedor de servicios de correo electrónico (por ejemplo, Google Cloud Console o Microsoft Azure Portal).
    -   Cree una nueva aplicación o proyecto y habilite el servicio de API de correo electrónico de Gmail u Outlook.
    -   Obtenga el Client ID y el Client Secret correspondientes.
    -   Configure la URI de redirección (Redirect URI) para que coincida con la dirección de devolución de llamada del **plugin** de NocoBase.

2.  **Configuración del proveedor de servicios de correo electrónico**
    -   Vaya a la página de configuración del **plugin** de correo electrónico.
    -   Proporcione la información de autenticación de la API requerida, incluyendo el Client ID y el Client Secret, para asegurar una correcta integración de autorización con el proveedor de servicios de correo electrónico.

3.  **Inicio de sesión con autorización**
    -   Los usuarios inician sesión en sus cuentas de correo electrónico a través del protocolo OAuth.
    -   El **plugin** generará y almacenará automáticamente el token de autorización del usuario para las llamadas a la API y las operaciones de correo electrónico posteriores.

4.  **Conexión de cuentas de correo electrónico**
    -   Después de una autorización exitosa, la cuenta de correo electrónico del usuario se conectará a NocoBase.
    -   El **plugin** sincronizará los datos de correo electrónico del usuario y proporcionará funciones para gestionar, enviar y recibir correos.

5.  **Uso de las funciones de correo electrónico**
    -   Los usuarios pueden ver, gestionar y enviar correos electrónicos directamente dentro de la plataforma.
    -   Todas las operaciones se completan mediante llamadas a la API del proveedor de servicios de correo electrónico, lo que garantiza una sincronización en tiempo real y una transmisión eficiente.

A través del proceso descrito anteriormente, el **plugin** de correo electrónico de NocoBase ofrece a los usuarios servicios de gestión de correo electrónico eficientes y seguros. Si encuentra algún problema durante la configuración, consulte la documentación relevante o contacte con el equipo de soporte técnico para obtener ayuda.

## Configuración del **plugin**

### Activación del **plugin** de correo electrónico

1.  Vaya a la página de gestión de **plugins**
2.  Busque el **plugin** "Email manager" y actívelo.

### Configuración del proveedor de servicios de correo electrónico

Una vez activado el **plugin** de correo electrónico, puede configurar los proveedores de servicios de correo electrónico. Actualmente, se admiten los servicios de correo de Google y Microsoft. Haga clic en "Ajustes" -> "Ajustes de correo electrónico" en la barra superior para acceder a la página de configuración.

![](https://static-docs.nocobase.com/mail-1733818617187.png)

![](https://static-docs.nocobase.com/mail-1733818617514.png)

Para cada proveedor de servicios, debe rellenar el Client ID y el Client Secret. A continuación, se detalla cómo obtener estos dos parámetros.