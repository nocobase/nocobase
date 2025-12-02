:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## Añadir un autenticador en NocoBase

Primero, añada un nuevo autenticador en NocoBase: Ajustes del **plugin** - Autenticación de usuario - Añadir - OIDC.

Copie la URL de devolución de llamada.

![](https://static-docs.nocobase.com/202412021504114.png)

## Registrar la aplicación

Abra el centro de administración de Microsoft Entra y registre una nueva aplicación.

![](https://static-docs.nocobase.com/202412021506837.png)

Pegue aquí la URL de devolución de llamada que acaba de copiar.

![](https://static-docs.nocobase.com/202412021520696.png)

## Obtener y completar la información necesaria

Haga clic en la aplicación que acaba de registrar y copie el **Application (client) ID** y el **Directory (tenant) ID** desde la página de resumen.

![](https://static-docs.nocobase.com/202412021522063.png)

Haga clic en `Certificates & secrets`, cree un nuevo secreto de cliente y copie el **Value**.

![](https://static-docs.nocobase.com/202412021522846.png)

La correspondencia entre la información de Microsoft Entra y la configuración del autenticador de NocoBase es la siguiente:

| Información de Microsoft Entra    | Campo del autenticador de NocoBase                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID | Client ID                                                                                                                                        |
| Client secrets - Value  | Client secret                                                                                                                                    |
| Directory (tenant) ID   | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, reemplace `{tenant}` con el Directory (tenant) ID |