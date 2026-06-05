---
pkg: "@nocobase/plugin-email-manager"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Configuración de Google

### Requisitos previos

Para que los usuarios puedan conectar sus cuentas de correo de Google a NocoBase, la aplicación debe estar desplegada en un servidor que tenga acceso a los servicios de Google, ya que el backend realizará llamadas a la API de Google.
    
### Registrar una cuenta

1. Abra https://console.cloud.google.com/welcome para acceder a Google Cloud.
2. La primera vez que acceda, deberá aceptar los términos y condiciones.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### Crear una aplicación

1. Haga clic en "Select a project" en la parte superior.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. Haga clic en el botón "NEW PROJECT" en la ventana emergente.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. Rellene la información del proyecto.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. Una vez creado el proyecto, selecciónelo.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Habilitar la API de Gmail

1. Haga clic en el botón "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. Acceda al panel de control de "APIs & Services".

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. Busque "mail".

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. Haga clic en el botón "ENABLE" para habilitar la API de Gmail.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### Configurar la pantalla de consentimiento de OAuth

1. Haga clic en el menú "OAuth consent screen" a la izquierda.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. Seleccione "External".

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. Rellene la información del proyecto (esta se mostrará en la página de autorización) y haga clic en guardar.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. Rellene la información de contacto del desarrollador ("Developer contact information") y haga clic en continuar.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. Haga clic en continuar.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. Añada usuarios de prueba para realizar pruebas antes de publicar la aplicación.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. Haga clic en continuar.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. Revise la información de resumen y regrese al panel de control.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### Crear credenciales

1. Haga clic en el menú "Credentials" a la izquierda.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. Haga clic en el botón "CREATE CREDENTIALS" y seleccione "OAuth client ID".

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. Seleccione "Web application".

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. Rellene la información de la aplicación.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. Introduzca el dominio de despliegue final del proyecto (el ejemplo aquí es una dirección de prueba de NocoBase).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. Añada la URI de redirección autorizada. Debe ser `dominio + "/admin/settings/mail/oauth2"`. Por ejemplo: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. Haga clic en crear para ver la información de OAuth.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Copie el Client ID y el Client secret y péguelos en la página de configuración de correo electrónico.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. Haga clic en guardar para completar la configuración.

### Publicar la aplicación

Una vez completado el proceso anterior y probadas las funcionalidades como el inicio de sesión de autorización de usuarios de prueba y el envío de correos electrónicos, podrá publicar la aplicación.

1. Haga clic en el menú "OAuth consent screen".

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. Haga clic en el botón "EDIT APP" y luego en el botón "SAVE AND CONTINUE" en la parte inferior.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. Haga clic en el botón "ADD OR REMOVE SCOPES" para seleccionar los ámbitos de permisos de usuario.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. Busque "Gmail API" y luego marque "Gmail API" (confirme que el valor del Scope es la API de Gmail con "https://mail.google.com/").

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. Haga clic en el botón "UPDATE" en la parte inferior para guardar.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. Haga clic en el botón "SAVE AND CONTINUE" en la parte inferior de cada página y, finalmente, haga clic en el botón "BACK TO DASHBOARD" para volver a la página del panel de control.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. Haga clic en el botón "PUBLISH APP". Aparecerá una página de confirmación que enumera la información necesaria para la publicación. Luego, haga clic en el botón "CONFIRM".

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. Vuelva a la página de la consola y verá que el estado de publicación es "In production".

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. Haga clic en el botón "PREPARE FOR VERIFICATION", rellene la información requerida y haga clic en el botón "SAVE AND CONTINUE" (los datos de la imagen son solo para fines de demostración).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. Continúe rellenando la información necesaria (los datos de la imagen son solo para fines de demostración).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. Haga clic en el botón "SAVE AND CONTINUE".

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. Haga clic en el botón "SUBMIT FOR VERIFICATION" para enviar la verificación.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. Espere el resultado de la aprobación.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. Si la aprobación aún está pendiente, los usuarios pueden hacer clic en el enlace "unsafe" para autorizar e iniciar sesión.

![](https://static-docs.nocobase.com/mail-1735633689645.png)