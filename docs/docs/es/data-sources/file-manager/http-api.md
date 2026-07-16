---
title: "API HTTP del gestor de archivos"
description: "Los campos de adjuntos y las tablas de archivos permiten cargar archivos mediante la API HTTP, con carga desde el servidor (S3/OSS/COS), carga directa desde el cliente, autenticación JWT y especificación del motor de almacenamiento."
keywords: "API HTTP de carga de archivos,attachments create,carga desde el servidor,carga directa desde el cliente,NocoBase"
---

# API HTTP

La carga de archivos de los campos de adjuntos y las tablas de archivos admite el procesamiento mediante la API HTTP. Según el motor de almacenamiento utilizado por los adjuntos o la tabla de archivos, existen diferentes formas de realizar las llamadas.

## Carga desde el servidor

Para los motores de almacenamiento de código abierto integrados en el proyecto, como S3, OSS y COS, la API HTTP utiliza la misma función de llamada que la carga desde la interfaz de usuario; todos los archivos se cargan a través del servidor. Para llamar a la interfaz, es necesario transmitir en el encabezado de solicitud `Authorization` un token JWT basado en el inicio de sesión del usuario; de lo contrario, se rechazará el acceso.

### Campo de adjuntos

Inicia la operación `create` sobre el recurso de la tabla de adjuntos (`attachments`), envía la solicitud mediante POST y carga el contenido binario a través del campo file. Tras la llamada, el archivo se cargará en el motor de almacenamiento predeterminado.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Si necesitas cargar el archivo en otro motor de almacenamiento, puedes especificar mediante el parámetro attachmentField el motor de almacenamiento configurado para el campo de la tabla de datos correspondiente (si no está configurado, se cargará en el motor de almacenamiento predeterminado).

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Tabla de archivos

La carga en una tabla de archivos generará automáticamente un registro de archivo. Inicia la operación `create` sobre el recurso de la tabla de archivos, envía la solicitud mediante POST y carga el contenido binario a través del campo file.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

No es necesario especificar el motor de almacenamiento al cargar en una tabla de archivos; el archivo se cargará en el motor de almacenamiento configurado para dicha tabla.

## Carga desde el cliente

Para los motores de almacenamiento compatibles con S3 proporcionados por el complemento comercial S3-Pro, la carga mediante la API HTTP requiere varias llamadas que deben realizarse por pasos.

### Campo de adjuntos

1.  Obtener información del motor de almacenamiento

    Inicia la operación getBasicInfo sobre la tabla de almacenamiento (storages), incluyendo el identificador del espacio de almacenamiento (storage name), para solicitar la información de configuración del motor de almacenamiento.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Ejemplo de la información de configuración del motor de almacenamiento devuelta:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Obtener la información prefirmada del proveedor

    Inicia la operación createPresignedUrl sobre el recurso fileStorageS3, envía la solicitud mediante POST e incluye en el body la información relacionada con el archivo para obtener la información de carga prefirmada.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Descripción:
    >
    > * name: nombre del archivo
    > * size: tamaño del archivo (en bytes)
    > * type: tipo MIME del archivo; consulta：[Tipos MIME comunes](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > * storageId: ID del motor de almacenamiento (campo `id` devuelto en el primer paso)
    > * storageType: tipo de motor de almacenamiento (campo type devuelto en el primer paso)
    >
    > Datos de solicitud de ejemplo:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    La estructura de los datos de la información prefirmada obtenida es la siguiente:

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  Carga de archivos

    Utiliza putUrl devuelto para iniciar una solicitud PUT y cargar el archivo como body.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Descripción:
    > * putUrl: campo putUrl devuelto en el paso anterior
    > * file_path: ruta del archivo local que se va a cargar
    >
    > Datos de solicitud de ejemplo:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Crear un registro de archivo

    Tras cargar correctamente el archivo, inicia la operación create sobre el recurso de la tabla de adjuntos (attachments), envía la solicitud mediante POST y crea el registro de archivo.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Descripción de los datos dependientes en data-raw:
    > * title: campo `fileInfo.title` devuelto en el paso anterior
    > * filename: campo `fileInfo.key` devuelto en el paso anterior
    > * extname: campo `fileInfo.extname` devuelto en el paso anterior
    > * path: vacío de forma predeterminada
    > * size: campo `fileInfo.size` devuelto en el paso anterior
    > * url: vacío de forma predeterminada
    > * mimetype: campo `fileInfo.mimetype` devuelto en el paso anterior
    > * meta: campo `fileInfo.meta` devuelto en el paso anterior
    > * storageId: campo `id` devuelto en el primer paso
    >
    > Datos de solicitud de ejemplo:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Tabla de archivos

Las tres primeras operaciones son iguales que en la carga de campos de adjuntos, pero en el cuarto paso es necesario crear un registro de archivo. Para ello, inicia la operación create sobre el recurso de la tabla de archivos, envía la solicitud mediante POST y carga la información del archivo en el body.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Descripción de los datos dependientes en data-raw:
> * title: campo fileInfo.title devuelto en el paso anterior
> * filename: campo fileInfo.key devuelto en el paso anterior
> * extname: campo fileInfo.extname devuelto en el paso anterior
> * path: vacío de forma predeterminada
> * size: campo fileInfo.size devuelto en el paso anterior
> * url: vacío de forma predeterminada
> * mimetype: campo fileInfo.mimetype devuelto en el paso anterior
> * meta: campo fileInfo.meta devuelto en el paso anterior
> * storageId: campo id devuelto en el primer paso
>
> Datos de solicitud de ejemplo:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```