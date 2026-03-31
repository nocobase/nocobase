---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Configuración de Microsoft

### Requisitos previos
Para permitir que los usuarios conecten sus buzones de Outlook a NocoBase, debe implementar la aplicación en un servidor con acceso a los servicios de Microsoft. El backend utilizará las API de Microsoft.

### Registrar una cuenta

1. Vaya a https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
    
2. Inicie sesión en su cuenta de Microsoft
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### Crear un inquilino

1. Vaya a https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount e inicie sesión en su cuenta.
    
2. Rellene la información básica y obtenga el código de verificación.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. Rellene la demás información y continúe.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. Rellene la información de su tarjeta de crédito (puede omitir este paso por ahora).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### Obtener el ID de cliente

1. Haga clic en el menú superior y seleccione "Microsoft Entra ID".

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. Seleccione "App registrations" en el panel izquierdo.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. Haga clic en "New registration" en la parte superior.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. Rellene la información y envíela.

El nombre puede ser cualquiera. Para los tipos de cuenta, seleccione la opción que se muestra en la imagen a continuación. Puede dejar el URI de redirección en blanco por ahora.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. Obtenga el ID de cliente.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### Autorización de API

1. Abra el menú "API permissions" en el panel izquierdo.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. Haga clic en el botón "Add a permission".

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. Haga clic en "Microsoft Graph".

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. Busque y añada los siguientes permisos. El resultado final debería ser como se muestra en la imagen a continuación.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (By default)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### Obtener el secreto

1. Haga clic en "Certificates & secrets" en el panel izquierdo.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. Haga clic en el botón "New client secret".

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. Rellene la descripción y la fecha de caducidad, y haga clic en "Add".

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. Obtenga el ID del secreto.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. Copie el ID de cliente y el secreto de cliente, y péguelos en la página de configuración de correo electrónico.

![](https://static-docs.nocobase.com/mail-1733818630710.png)