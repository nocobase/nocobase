# Motor de Almacenamiento: Almacenamiento Local

Los archivos que suba se guardarán en un directorio local del disco duro del servidor. Esta opción es ideal para escenarios donde el volumen total de archivos subidos gestionados por el sistema es pequeño o para fines experimentales.


:::warning Nota

Siempre que sea posible, utilice URL estables `/files/` para los archivos locales, de modo que NocoBase pueda comprobar el registro y el permiso de visualización del rol actual. Las URL heredadas `/storage/uploads/` no aplican permisos a nivel de registro, pero Docker, el Nginx integrado y las configuraciones generadas por la CLI de NocoBase las restringen de forma predeterminada a usuarios autenticados.

Si necesita guardar contratos, documentos de identidad, materiales internos u otros archivos que no deben ser públicos, utilice [S3 Pro](./s3-pro). Si ya existen archivos históricos, consulte [Migrar a S3 Pro](./migrate-to-s3-pro.md).

Si un Nginx personalizado sirve archivos locales mediante `alias`, su ubicación `/storage/uploads/` debe usar `auth_request` para llamar al endpoint de autenticación de NocoBase. De lo contrario, omitirá la comprobación de inicio de sesión predeterminada. Configure también `X-Content-Type-Options: nosniff` y devuelva como adjuntos los archivos de contenido activo como `html`, `svg`, `xhtml` y `pdf`. Consulte [Proxy inverso con Nginx](../../nocobase-cli/production/reverse-proxy/nginx.md) para ver un ejemplo completo y la configuración de subaplicaciones, y la [guía de seguridad: almacenamiento de archivos](../../security/guide.md#almacenamiento-de-archivos) para conocer los riesgos.

Si una integración existente depende del acceso anónimo a URL heredadas, configure `LEGACY_LOCAL_STORAGE_PUBLIC_ACCESS=true` y reinicie la aplicación. Este interruptor de compatibilidad solo afecta a `/storage/uploads/` y no modifica los permisos de registro para `/files/`.

:::

## Parámetros de Configuración

![Ejemplo de configuración del motor de almacenamiento de archivos](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Nota}
Aquí solo se presentan los parámetros específicos del motor de almacenamiento local. Para los parámetros generales, consulte [Parámetros Generales del Motor](./index.md#引擎通用参数).
:::

### Ruta

Representa tanto la ruta relativa donde se almacenan los archivos en el servidor como la ruta de acceso URL. Por ejemplo, "`user/avatar`" (sin barras diagonales al inicio ni al final) representa:

1. La ruta relativa en el servidor donde se guardan los archivos subidos: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. El prefijo de la URL para acceder a los archivos: `http://localhost:13000/storage/uploads/user/avatar`.
