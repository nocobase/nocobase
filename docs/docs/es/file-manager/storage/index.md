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
Cuando se selecciona «URL original», la dirección final del almacenamiento se construye a partir de varias partes:

```
<Prefijo de URL de acceso público>/<Ruta>/<Nombre de archivo><Extensión>
```

Por ejemplo: `https://cdn.nocobase.com/app/user/avatar/20240529115151.png`.

Cuando se selecciona «URL de NocoBase», el registro del archivo devuelve una ruta de NocoBase con el formato `/files/...`. La configuración anterior se sigue utilizando al acceder al servicio de almacenamiento.
:::

## URL de archivos y control de acceso

Un motor de almacenamiento puede devolver una URL de NocoBase o la URL original del servicio de almacenamiento. La URL de NocoBase es la opción predeterminada. Seleccione la URL original solo cuando un servicio externo deba utilizar directamente la dirección del almacenamiento.

Esta configuración se aplica por motor de almacenamiento. Después de guardarla, tanto los archivos existentes como los nuevos archivos subidos en ese motor devolverán las URL con el formato seleccionado. Los archivos no se mueven ni se vuelven a subir.

![Configuración de la URL del archivo](https://static-docs.nocobase.com/20260723221234.png)

### URL de NocoBase

El registro del archivo devuelve una ruta de acceso proporcionada por NocoBase, por ejemplo:

```text
/files/main/main/attachments/1.png
```

Las solicitudes a esta URL pasan primero por NocoBase y respetan los permisos de visualización configurados para el registro de archivo correspondiente. NocoBase solo lee el archivo o redirige a la dirección generada por el servicio de almacenamiento después de superar la comprobación de permisos.

Esta es la opción predeterminada recomendada. El registro devuelve una ruta de NocoBase, por lo que quien la utiliza no necesita saber si se usa almacenamiento local o en la nube.

### URL original

El registro del archivo devuelve directamente la dirección generada por el servicio de almacenamiento, por ejemplo:

```text
https://storage.example.com/path/to/file.png
```

Esta URL no pasa por NocoBase ni comprueba los permisos de visualización del registro. En el almacenamiento local, es una dirección de archivo estático local. En el almacenamiento en la nube, suele ser una dirección de almacenamiento de objetos o CDN.

Seleccione la URL original solo cuando Markdown, una página externa o un servicio de terceros deba utilizar directamente la dirección del almacenamiento.

:::warning Nota

Después de seleccionar la URL original, cualquier persona que tenga una URL válida puede omitir los controles de permisos de NocoBase y acceder al archivo. Si la URL no tiene firma ni caducidad, asegúrese de que el bucket y el archivo permitan la lectura pública.

:::

### Permitir acceso público

«Permitir acceso público» solo tiene efecto cuando se selecciona «URL de NocoBase». Al marcarlo, el motor sigue devolviendo una URL de NocoBase, pero NocoBase deja de comprobar los permisos del registro al acceder a ella. Cualquier persona con la URL puede acceder al archivo.

Esta opción no cambia la configuración de lectura pública del propio servicio de almacenamiento. Solo controla si NocoBase comprueba los permisos del registro del archivo.

### Cómo elegir

| Caso de uso | URL del archivo | Permitir acceso público |
| --- | --- | --- |
| Los archivos deben respetar los permisos de rol y de datos | URL de NocoBase | Sin marcar |
| Se necesita una dirección de archivo de NocoBase que se pueda compartir públicamente | URL de NocoBase | Marcado |
| Markdown, una página externa o un servicio de terceros debe leer directamente la dirección del almacenamiento | URL original | No aplicable |

:::warning Nota

[Almacenamiento local](./local), [Amazon S3](./amazon-s3), [Aliyun OSS](./aliyun-oss) y [Tencent COS](./tencent-cos) no generan URL firmadas temporales. Incluso si se activan la URL de NocoBase y los permisos del registro, quien ya haya obtenido la dirección original del servicio de almacenamiento podrá seguir accediendo directamente al archivo.

Para contratos, documentos de identidad, materiales internos u otros archivos que no deban ser públicos, utilice [S3 Pro](./s3-pro) y consulte su configuración específica de control de acceso.

:::

Si ya utiliza un motor de almacenamiento público y quiere migrar los archivos existentes a S3 Pro, consulte [Migrar a S3 Pro](./migrate-to-s3-pro.md).
