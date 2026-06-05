:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Información general

## Introducción

Los motores de almacenamiento se utilizan para guardar archivos en servicios específicos, como el almacenamiento local (en el disco duro del servidor), el almacenamiento en la nube, entre otros.

Antes de subir cualquier archivo, es necesario configurar un motor de almacenamiento. Durante la instalación, el sistema añade automáticamente un motor de almacenamiento local que puede utilizar directamente. También puede añadir nuevos motores o editar los parámetros de los existentes.

## Tipos de motores de almacenamiento

Actualmente, NocoBase ofrece soporte integrado para los siguientes tipos de motores de almacenamiento:

- [Almacenamiento local](./local)
- [Amazon S3](./amazon-s3)
- [Aliyun OSS](./aliyun-oss)
- [Tencent COS](./tencent-cos)
- [S3 Pro](./s3-pro)

El sistema añade automáticamente un motor de almacenamiento local durante la instalación, el cual puede utilizar directamente. También tiene la opción de añadir nuevos motores o editar los parámetros de los ya existentes.

## Parámetros comunes

Además de los parámetros específicos de cada tipo de motor, las siguientes secciones describen los parámetros comunes (tomando como ejemplo el almacenamiento local):

![Ejemplo de configuración del motor de almacenamiento de archivos](https://static-docs.nocobase.com/20240529115151.png)

### Título

El nombre del motor de almacenamiento, utilizado para su identificación manual.

### Nombre del sistema

El nombre del sistema del motor de almacenamiento, utilizado para su identificación por parte del sistema. Debe ser único dentro del sistema. Si lo deja en blanco, el sistema generará uno aleatoriamente de forma automática.

### Prefijo de URL de acceso público

La parte del prefijo de la URL de acceso público para el archivo. Puede ser la URL base de un CDN, por ejemplo: "`https://cdn.nocobase.com/app`" (sin la barra final "` / `" ).

### Ruta

La ruta relativa utilizada al almacenar archivos. Esta parte también se añadirá automáticamente a la URL final durante el acceso. Por ejemplo: "`user/avatar`" (sin barras al principio ni al final).

### Límite de tamaño de archivo

El límite de tamaño para los archivos que se suben a este motor de almacenamiento. Los archivos que superen este tamaño no podrán subirse. El límite predeterminado del sistema es de 20 MB y se puede ajustar hasta un máximo de 1 GB.

### Tipos de archivo

Puede restringir los tipos de archivos que se pueden subir, utilizando el formato de descripción de la sintaxis [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por ejemplo: `image/*` representa archivos de imagen. Se pueden separar varios tipos con comas, como: `image/*, application/pdf`, lo que permite archivos de imagen y PDF.

### Motor de almacenamiento predeterminado

Al marcar esta opción, se establece como el motor de almacenamiento predeterminado del sistema. Cuando un campo de adjunto o una colección de archivos no especifica un motor de almacenamiento, los archivos subidos se guardarán en el motor de almacenamiento predeterminado. El motor de almacenamiento predeterminado no se puede eliminar.

### Mantener archivo al eliminar registro

Al marcar esta opción, el archivo subido en el motor de almacenamiento se mantendrá incluso si se elimina el registro de datos en la tabla de adjuntos o en la colección de archivos. Por defecto, esta opción no está marcada, lo que significa que el archivo en el motor de almacenamiento se eliminará junto con el registro.

:::info{title=Sugerencia}
Después de subir un archivo, la ruta de acceso final se construye concatenando varias partes:

```
<Prefijo de URL de acceso público>/<Ruta>/<Nombre de archivo><Extensión>
```

Por ejemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::