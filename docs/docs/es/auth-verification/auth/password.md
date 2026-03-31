---
pkg: '@nocobase/plugin-auth'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Autenticación por Contraseña

## Interfaz de Configuración

![](https://static-docs.nocobase.com/202411131505095.png)

## Permitir Registro

Cuando el registro está permitido, la página de inicio de sesión mostrará un enlace para crear una cuenta, y usted podrá acceder a la página de registro.

![](https://static-docs.nocobase.com/78903930d4b47aaf75cf94c55dd3596e.png)

Página de registro

![](https://static-docs.nocobase.com/ac3c3ab42df28cb7c6dc70b24e99e7f7.png)

Cuando el registro no está permitido, la página de inicio de sesión no mostrará el enlace para crear una cuenta.

![](https://static-docs.nocobase.com/8d5e3b6df9991bfc1c2e095a93745121.png)

Cuando el registro no está permitido, no se podrá acceder a la página de registro.

![](https://static-docs.nocobase.com/09325c4b07e09f88f80a14dff8430556.png)

## Configuración del Formulario de Registro<Badge>v1.4.0-beta.7+</Badge>

Usted puede configurar qué campos de la colección de usuarios se mostrarán en el formulario de registro y si son obligatorios. Al menos uno de los campos, nombre de usuario o correo electrónico, debe configurarse como visible y obligatorio.

![](https://static-docs.nocobase.com/202411262133669.png)

Página de registro

![](https://static-docs.nocobase.com/202411262135801.png)

## Olvidé mi Contraseña<Badge>v1.8.0+</Badge>

La función de 'Olvidé mi Contraseña' permite a los usuarios restablecer su contraseña mediante verificación por correo electrónico si la han olvidado.

### Configuración del Administrador

1.  **Habilitar la función de Olvidé mi Contraseña**

    En la pestaña "Configuración" > "Autenticación" > "Olvidé mi Contraseña", marque la casilla "Habilitar la función de Olvidé mi Contraseña".

    ![20250423071957_rec_](https://static-docs.nocobase.com/20250423071957_rec_.gif)

2.  **Configurar Canal de Notificación**

    Seleccione un canal de notificación por correo electrónico (actualmente solo se admite el correo electrónico). Si no hay canales de notificación disponibles, primero deberá añadir uno.

    ![20250423072225_rec_](https://static-docs.nocobase.com/20250423072225_rec_.gif)

3.  **Configurar Correo Electrónico de Restablecimiento de Contraseña**

    Personalice el asunto y el contenido del correo electrónico, compatible con formato HTML o texto sin formato. Puede utilizar las siguientes variables:
    - Usuario actual
    - Configuración del sistema
    - Enlace de restablecimiento de contraseña
    - Caducidad del enlace de restablecimiento (minutos)

    ![20250427170047](https://static-docs.nocobase.com/20250427170047.png)

4.  **Establecer Caducidad del Enlace de Restablecimiento**

    Establezca el período de validez (en minutos) para el enlace de restablecimiento; el valor predeterminado es de 120 minutos.

    ![20250423073557](https://static-docs.nocobase.com/20250423073557.png)

### Flujo de Uso para el Usuario

1.  **Iniciar Solicitud de Restablecimiento de Contraseña**

    En la página de inicio de sesión, haga clic en el enlace "Olvidé mi Contraseña" (el administrador debe haber habilitado previamente esta función) para acceder a la página de restablecimiento de contraseña.

    ![20250421103458_rec_](https://static-docs.nocobase.com/20250421103458_rec_.gif)

    Ingrese la dirección de correo electrónico registrada y haga clic en el botón "Enviar correo de restablecimiento".

    ![20250421113442_rec_](https://static-docs.nocobase.com/20250421113442_rec_.gif)

2.  **Restablecer Contraseña**

    El usuario recibirá un correo electrónico con un enlace de restablecimiento. Al hacer clic en el enlace, se abrirá una página donde podrá establecer una nueva contraseña.

    ![20250421113748](https://static-docs.nocobase.com/20250421113748.png)

    Una vez configurada, el usuario podrá iniciar sesión en el sistema con su nueva contraseña.

### Consideraciones

- El enlace de restablecimiento tiene un límite de tiempo; por defecto, es válido durante 120 minutos después de su generación (configurable por el administrador).
- El enlace solo se puede usar una vez y caduca inmediatamente después de su uso.
- Si el usuario no recibe el correo electrónico de restablecimiento, por favor, verifique que la dirección de correo sea correcta o revise la carpeta de correo no deseado (spam).
- El administrador debe asegurarse de que la configuración del servidor de correo sea correcta para garantizar que el correo electrónico de restablecimiento se envíe con éxito.