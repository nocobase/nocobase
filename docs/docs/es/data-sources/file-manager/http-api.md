:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# API HTTP

La carga de archivos para los campos de adjunto y las colecciones de archivos se puede gestionar a través de la API HTTP. La forma de invocar el proceso varía según el motor de almacenamiento que utilice el adjunto o la colección de archivos.

## Carga desde el servidor

Para los motores de almacenamiento de código abierto integrados, como S3, OSS y COS, la API HTTP funciona de la misma manera que la carga desde la interfaz de usuario, es decir, los archivos se cargan a través del servidor. Las llamadas a la API requieren que se pase un token JWT (basado en el inicio de sesión del usuario) en el encabezado de solicitud `Authorization`; de lo contrario, se denegará el acceso.

### Campo de adjunto

Inicie una operación `create` en el recurso de adjuntos (`attachments`) enviando una solicitud POST y cargue el contenido binario a través del campo `file`. Después de la llamada, el archivo se cargará en el motor de almacenamiento predeterminado.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Si necesita cargar archivos en un motor de almacenamiento diferente, puede usar el parámetro `attachmentField` para especificar el motor de almacenamiento configurado para el campo de la colección. Si no está configurado, el archivo se cargará en el motor de almacenamiento predeterminado.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Colección de archivos

Al cargar en una colección de archivos, se generará automáticamente un registro de archivo. Inicie una operación `create` en el recurso de la colección de archivos enviando una solicitud POST y cargando el contenido binario a través del campo `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Al cargar en una colección de archivos, no es necesario especificar un motor de almacenamiento; el archivo se cargará en el motor de almacenamiento configurado para esa colección.

## Carga desde el cliente

Para los motores de almacenamiento compatibles con S3, proporcionados a través del plugin comercial S3-Pro, la carga mediante la API HTTP requiere varios pasos.

### Campo de adjunto

1.  Obtener información del motor de almacenamiento

    Inicie una operación `getBasicInfo` en la colección de almacenamientos (`storages`), incluyendo el nombre del almacenamiento, para solicitar la información de configuración del motor de almacenamiento.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Ejemplo de información de configuración del motor de almacenamiento devuelta:

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Obtener la información de URL pre-firmada del proveedor de servicios

    Inicie una operación `createPresignedUrl` en el recurso `fileStorageS3` enviando una solicitud POST con información relacionada con el archivo en el cuerpo para obtener la información de carga pre-firmada.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Nota:
    >
    > *   `name`: Nombre del archivo
    > *   `size`: Tamaño del archivo (en bytes)
    > *   `type`: El tipo MIME del archivo. Puede consultar: [Tipos MIME comunes](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId`: El ID del motor de almacenamiento (el campo `id` devuelto en el paso 1).
    > *   `storageType`: El tipo de motor de almacenamiento (el campo `type` devuelto en el paso 1).
    >
    > Ejemplo de datos de solicitud:
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    La estructura de datos de la información pre-firmada obtenida es la siguiente:

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

3.  Cargar el archivo

    Utilice la `putUrl` devuelta para realizar una solicitud `PUT`, cargando el archivo como cuerpo de la solicitud.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```

    > Nota:
    > *   `putUrl`: El campo `putUrl` devuelto en el paso anterior.
    > *   `file_path`: La ruta local del archivo a cargar.
    >
    > Ejemplo de datos de solicitud:
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Crear el registro del archivo

    Después de una carga exitosa, cree el registro del archivo iniciando una operación `create` en el recurso de adjuntos (`attachments`) con una solicitud POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Explicación de los datos dependientes en `data-raw`:
    > *   `title`: El campo `fileInfo.title` devuelto en el paso anterior.
    > *   `filename`: El campo `fileInfo.key` devuelto en el paso anterior.
    > *   `extname`: El campo `fileInfo.extname` devuelto en el paso anterior.
    > *   `path`: Vacío por defecto.
    > *   `size`: El campo `fileInfo.size` devuelto en el paso anterior.
    > *   `url`: Vacío por defecto.
    > *   `mimetype`: El campo `fileInfo.mimetype` devuelto en el paso anterior.
    > *   `meta`: El campo `fileInfo.meta` devuelto en el paso anterior.
    > *   `storageId`: El campo `id` devuelto en el paso 1.
    >
    > Ejemplo de datos de solicitud:
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Colección de archivos

Los tres primeros pasos son los mismos que para la carga en un campo de adjunto. Sin embargo, en el cuarto paso, debe crear el registro del archivo iniciando una operación `create` en el recurso de la colección de archivos con una solicitud POST y cargando la información del archivo en el cuerpo.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Explicación de los datos dependientes en `data-raw`:
> *   `title`: El campo `fileInfo.title` devuelto en el paso anterior.
> *   `filename`: El campo `fileInfo.key` devuelto en el paso anterior.
> *   `extname`: El campo `fileInfo.extname` devuelto en el paso anterior.
> *   `path`: Vacío por defecto.
> *   `size`: El campo `fileInfo.size` devuelto en el paso anterior.
> *   `url`: Vacío por defecto.
> *   `mimetype`: El campo `fileInfo.mimetype` devuelto en el paso anterior.
> *   `meta`: El campo `fileInfo.meta` devuelto en el paso anterior.
> *   `storageId`: El campo `id` devuelto en el paso 1.
>
> Ejemplo de datos de solicitud:
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```