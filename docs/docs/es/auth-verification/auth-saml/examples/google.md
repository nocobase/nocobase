:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Google Workspace

## Configure Google como IdP

[Consola de administración de Google](https://admin.google.com/) - Aplicaciones - Aplicaciones web y móviles

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

Después de configurar la aplicación, copie la **URL de SSO**, el **ID de entidad** y el **Certificado**.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## Añada un nuevo autenticador en NocoBase

Ajustes del plugin - Autenticación de usuario - Añadir - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

Introduzca la información que acaba de copiar, siguiendo este orden:

- SSO URL: URL de SSO
- Public Certificate: Certificado público
- idP Issuer: ID de entidad
- http: Marque esta opción si está realizando pruebas localmente con HTTP.

Luego, copie el SP Issuer/EntityID y la URL de ACS de la sección "Uso".

## Rellene la información del SP en Google

Vuelva a la Consola de Google, y en la página **Detalles del proveedor de servicios**, introduzca la URL de ACS y el ID de entidad que copió anteriormente, y marque la opción **Respuesta firmada**.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

En la sección **Asignación de atributos**, añada las asignaciones para los atributos correspondientes.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)