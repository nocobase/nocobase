:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Almacenamiento local

Los archivos subidos se guardarán en un directorio local del servidor. Esto es adecuado para escenarios de pequeña escala o experimentales donde el volumen total de archivos gestionados por el sistema es relativamente bajo.

## Parámetros de configuración

![Ejemplo de configuración del motor de almacenamiento de archivos](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Nota}
Aquí solo se presentan los parámetros específicos del motor de almacenamiento local. Para los parámetros generales, consulte los [Parámetros generales del motor](./index.md#general-engine-parameters).
:::

### Ruta

La ruta representa tanto la ruta relativa del archivo almacenado en el servidor como la ruta de acceso URL. Por ejemplo, "`user/avatar`" (sin la barra inclinada inicial ni final "`/`") representa:

1. La ruta relativa del archivo subido almacenado en el servidor: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. El prefijo de la dirección URL para acceder al archivo: `http://localhost:13000/storage/uploads/user/avatar`.