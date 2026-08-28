---
title: "Motores de almacenamiento de archivos"
description: "Motores de almacenamiento para campos de archivos: almacenamiento local, Alibaba Cloud OSS, Amazon S3, Tencent Cloud COS y S3 Pro; configuración del título, la ruta, la URL de acceso, etc."
keywords: "almacenamiento de archivos,Storage,OSS,S3,COS,almacenamiento local,almacenamiento en la nube,NocoBase"
---

# Descripción general

## Motores integrados

Actualmente, NocoBase admite de forma integrada los siguientes tipos de motores:

- [Almacenamiento local](./local.md)
- [Alibaba Cloud OSS](./aliyun-oss.md)
- [Amazon S3](./amazon-s3.md)
- [Tencent Cloud COS](./tencent-cos.md)

Durante la instalación del sistema, se añade automáticamente un motor de almacenamiento local que puede utilizarse directamente. También es posible añadir nuevos motores o editar los parámetros de los existentes.

## Parámetros generales de los motores

Además de los parámetros específicos de cada tipo de motor, los siguientes son parámetros generales (se toma el almacenamiento local como ejemplo):

![Ejemplo de configuración del motor de almacenamiento de archivos](https://static-docs.nocobase.com/20240529115151.png)

### Título

Nombre del motor de almacenamiento, utilizado para su identificación manual.

### Nombre del sistema

Nombre del sistema del motor de almacenamiento, utilizado para su identificación por parte del sistema. Debe ser único en el sistema; si se deja vacío, el sistema generará uno aleatoriamente.

### Base de la URL de acceso

Parte correspondiente al prefijo de la dirección URL mediante la que se puede acceder externamente al archivo. Puede ser la base de la URL de acceso de una CDN, por ejemplo: “`https://cdn.nocobase.com/app`” (no es necesario incluir el “`/`” final).

### Ruta

Ruta relativa utilizada al almacenar los archivos. Esta parte también se añadirá automáticamente a la URL final al acceder a ellos. Por ejemplo: “`user/avatar`” (no es necesario incluir el “`/`” inicial ni final).

### Límite de tamaño de archivo

Límite de tamaño para los archivos que se suben a este motor de almacenamiento. Los archivos que superen el tamaño configurado no se podrán subir. El límite predeterminado del sistema es de 20 MB y puede ajustarse hasta un máximo de 1 GB.

### Tipo de archivo

Permite restringir los tipos de archivos que se pueden subir. Utiliza el formato de sintaxis [MIME](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types). Por ejemplo, `image/*` representa archivos de imagen. Para especificar varios tipos, sepáralos con comas en inglés; por ejemplo, `image/*, application/pdf` representa que se permiten archivos de imagen y archivos PDF.

### Motor de almacenamiento predeterminado

Al marcar esta opción, el motor se establece como el motor de almacenamiento predeterminado del sistema. Cuando no se especifica ningún motor de almacenamiento en un campo de adjuntos o una tabla de archivos, los archivos subidos se guardarán en el motor de almacenamiento predeterminado. El motor de almacenamiento predeterminado no se puede eliminar.

### Conservar los archivos al eliminar registros

Al marcar esta opción, los archivos ya subidos al motor de almacenamiento se conservarán aunque se eliminen los registros de datos de la tabla de adjuntos o de la tabla de archivos. Esta opción no está marcada de forma predeterminada; es decir, al eliminar un registro, también se eliminarán los archivos del motor de almacenamiento.

:::info{title=Nota}
Después de subir un archivo, la ruta de acceso final se compone de varias partes:

```
<访问 URL 基础>/<路径>/<文件名><后缀名>
```

Por ejemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.
:::