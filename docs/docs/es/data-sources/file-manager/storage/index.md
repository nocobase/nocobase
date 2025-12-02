:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Descripción general

## Motores integrados

Actualmente, NocoBase es compatible con los siguientes tipos de motores integrados:

- [Almacenamiento local](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Durante la instalación del sistema, se añade automáticamente un motor de almacenamiento local que puede utilizar directamente. También puede añadir nuevos motores o editar los parámetros de los existentes.

## Parámetros comunes del motor

Además de los parámetros específicos de cada tipo de motor, a continuación se detallan los parámetros comunes (tomando como ejemplo el almacenamiento local):

![Ejemplo de configuración del motor de almacenamiento de archivos](https://static-docs.nocobase.com/20240529115151.png)

### Título

El nombre del motor de almacenamiento, utilizado para su identificación manual.

### Nombre del sistema

El nombre del sistema del motor de almacenamiento, utilizado para su identificación por el sistema. Debe ser único en todo el sistema. Si lo deja en blanco, el sistema lo generará automáticamente de forma aleatoria.

### URL base de acceso

Es la parte del prefijo de la dirección URL para el acceso externo al archivo. Puede ser la URL base de acceso de una CDN, por ejemplo: "`https://cdn.nocobase.com/app`" (sin la barra final "`/`").

### Ruta

La ruta relativa utilizada al almacenar archivos. Esta parte también se concatenará automáticamente a la URL final cuando se acceda a ella. Por ejemplo: "`user/avatar`" (sin la barra inicial ni la final "`/`").

### Límite de tamaño de archivo

El límite de tamaño para los archivos que se suben a este motor de almacenamiento. Los archivos que superen este tamaño no podrán subirse. El límite predeterminado del sistema es de 20 MB, y el límite máximo ajustable es de 1 GB.

### Tipo de archivo

Permite limitar los tipos de archivos que se pueden subir, utilizando el formato de descripción de sintaxis [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por ejemplo, `image/*` representa archivos de imagen. Se pueden separar varios tipos con comas, como: `image/*, application/pdf` para permitir archivos de imagen y PDF.

### Motor de almacenamiento predeterminado

Al marcar esta opción, se establece como el motor de almacenamiento predeterminado del sistema. Cuando un campo de adjunto o una colección de archivos no especifica un motor de almacenamiento, los archivos subidos se guardarán en el motor de almacenamiento predeterminado. El motor de almacenamiento predeterminado no se puede eliminar.

### Conservar archivos al eliminar registros

Al marcar esta opción, los archivos subidos en el motor de almacenamiento se conservan incluso cuando se eliminan los registros de datos en la colección de adjuntos o archivos. Por defecto, esta opción no está marcada, lo que significa que los archivos en el motor de almacenamiento se eliminan junto con los registros.

:::info{title=Sugerencia}
Después de subir un archivo, la ruta de acceso final se construye concatenando varias partes:

```
<URL base de acceso>/<Ruta>/<Nombre del archivo><Extensión>
```

Por ejemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::