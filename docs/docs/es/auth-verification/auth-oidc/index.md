---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Autenticación: OIDC

## Introducción

El plugin de Autenticación: OIDC sigue el estándar del protocolo OIDC (Open ConnectID), utilizando el flujo de código de autorización (Authorization Code Flow), para permitir a los usuarios iniciar sesión en NocoBase con cuentas proporcionadas por proveedores de identidad de terceros (IdP).

## Activar el plugin

![](https://static-docs.nocobase.com/202411122358790.png)

## Añadir autenticación OIDC

Acceda a la página de gestión de plugins de autenticación de usuarios.

![](https://static-docs.nocobase.com/202411130004459.png)

Añadir - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Configuración

### Configuración básica

![](https://static-docs.nocobase.com/202411130006341.png)

| Configuración                                      | Descripción                                                                                                                                                                | Versión        |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Sign up automatically when the user does not exist | ¿Crear automáticamente un nuevo usuario si no se encuentra un usuario existente que coincida?                                                                              | -              |
| Issuer                                             | El emisor (issuer) es proporcionado por el IdP y suele terminar en `/.well-known/openid-configuration`.                                                                   | -              |
| Client ID                                          | ID de cliente                                                                                                                                                              | -              |
| Client Secret                                      | Secreto de cliente                                                                                                                                                         | -              |
| scope                                              | Opcional, el valor predeterminado es `openid email profile`.                                                                                                               | -              |
| id_token signed response algorithm                 | El algoritmo de firma para el `id_token`, el valor predeterminado es `RS256`.                                                                                              | -              |
| Enable RP-initiated logout                         | Habilita el cierre de sesión iniciado por RP. Cierra la sesión del IdP cuando el usuario cierra sesión. La URL de redirección de cierre de sesión posterior (Post logout redirect URL) del IdP debe ser la proporcionada en [Uso](#uso). | `v1.3.44-beta` |

### Mapeo de campos

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Configuración                   | Descripción                                                                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Mapeo de campos. NocoBase actualmente admite el mapeo de campos como apodo, correo electrónico y número de teléfono. El apodo predeterminado usa `openid`.        |
| Use this field to bind the user | Se utiliza para vincular con usuarios existentes. Puede elegir correo electrónico o nombre de usuario, siendo el correo electrónico el predeterminado. El IdP debe proporcionar información de usuario que contenga los campos `email` o `username`. |

### Configuración avanzada

![](https://static-docs.nocobase.com/202411130013306.png)

| Configuración                                                     | Descripción                                                                                                                                                                                                                                                         | Versión        |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| HTTP                                                              | Si la URL de callback de NocoBase utiliza el protocolo HTTP, el valor predeterminado es `https`.                                                                                                                                                                       | -              |
| Port                                                              | Puerto para la URL de callback de NocoBase, los valores predeterminados son `443/80`.                                                                                                                                                                                | -              |
| State token                                                       | Se utiliza para verificar el origen de la solicitud y prevenir ataques CSRF. Puede introducir un valor fijo, pero **se recomienda encarecidamente dejarlo en blanco para que se generen valores aleatorios por defecto. Si utiliza un valor fijo, evalúe cuidadosamente su entorno y los riesgos de seguridad.** | -              |
| Pass parameters in the authorization code grant exchange          | Al intercambiar un código por un token, algunos IdP pueden requerir que se pasen el Client ID o el Client Secret como parámetros. Puede seleccionar esta opción y especificar los nombres de los parámetros correspondientes.                                                                                | -              |
| Method to call the user info endpoint                             | El método HTTP utilizado al solicitar la API de información del usuario.                                                                                                                                                                              | -              |
| Where to put the access token when calling the user info endpoint | Cómo se pasa el token de acceso al llamar a la API de información del usuario:<br/>- Header - En la cabecera de la solicitud (predeterminado).<br />- Body - En el cuerpo de la solicitud, utilizado con el método `POST`.<br />- Query parameters - Como parámetros de consulta, utilizado con el método `GET`.                   | -              |
| Skip SSL verification                                             | Omite la verificación SSL al solicitar la API del IdP. **Esta opción expone su sistema a riesgos de ataques de intermediario (man-in-the-middle). Habilite esta opción solo si comprende su propósito e implicaciones. Se desaconseja encarecidamente su uso en entornos de producción.**        | `v1.3.40-beta` |

### Uso

![](https://static-docs.nocobase.com/202411130019570.png)

| Configuración            | Descripción                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Redirect URL             | Se utiliza para configurar la URL de callback en el IdP.                                                 |
| Post logout redirect URL | Se utiliza para configurar la URL de redirección de cierre de sesión posterior (Post logout redirect URL) en el IdP cuando el cierre de sesión iniciado por RP está habilitado. |

:::info
Al realizar pruebas localmente, utilice `127.0.0.1` en lugar de `localhost` para la URL, ya que el inicio de sesión OIDC requiere escribir el estado (state) en la cookie del cliente para la validación de seguridad. Si la ventana de inicio de sesión aparece y desaparece rápidamente sin que se complete el inicio de sesión, verifique los registros del servidor en busca de problemas de estado (state) no coincidentes y asegúrese de que el parámetro de estado esté incluido en la cookie de la solicitud. Este problema suele ocurrir cuando el estado en la cookie del cliente no coincide con el estado en la solicitud.
:::

## Iniciar sesión

Acceda a la página de inicio de sesión y haga clic en el botón debajo del formulario para iniciar sesión con un tercero.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)