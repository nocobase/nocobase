:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Iniciar sesión con Google

> https://developers.google.com/identity/openid-connect/openid-connect

## Obtener credenciales de Google OAuth 2.0

[Consola de Google Cloud](https://console.cloud.google.com/apis/credentials) - Crear credenciales - ID de cliente OAuth

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

Acceda a la interfaz de configuración y complete la URL de redireccionamiento autorizada. La URL de redireccionamiento se puede obtener al añadir un autenticador en NocoBase; normalmente es `http(s)://host:port/api/oidc:redirect`. Consulte la sección [Manual de usuario - Configuración](../index.md#configuración).

![](https://static-docs.nocobase.com/24078bf52ec66a16334894cb3d9d126.png)

## Añadir un nuevo autenticador en NocoBase

Ajustes del plugin - Autenticación de usuario - Añadir - OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

Consulte los parámetros presentados en la sección [Manual de usuario - Configuración](../index.md#configuración) para completar la configuración del autenticador.