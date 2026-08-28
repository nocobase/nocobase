# Motor de Almacenamiento: Almacenamiento Local

Los archivos que suba se guardarán en un directorio local del disco duro del servidor. Esta opción es ideal para escenarios donde el volumen total de archivos subidos gestionados por el sistema es pequeño o para fines experimentales.


:::warning Nota

El almacenamiento local no admite acceso privado. Después de subir un archivo, NocoBase genera una URL de acceso directo, y cualquier persona que tenga esa URL puede acceder al archivo.

Si necesita guardar contratos, documentos de identidad, materiales internos u otros archivos que no deben ser públicos, utilice [S3 Pro](./s3-pro). Si ya existen archivos históricos, consulte [Migrar a S3 Pro](./migrate-to-s3-pro.md).

Si no utiliza Docker ni la configuración oficial de nginx y accede a los archivos locales subidos mediante un proxy personalizado, asegúrese de que la ruta `/storage/uploads/` configure `X-Content-Type-Options: nosniff` y devuelva archivos de contenido activo como `html`, `svg`, `xhtml` y `pdf` como adjuntos. Para más detalles, consulte la [guía de seguridad: almacenamiento de archivos](../../security/guide.md).

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
